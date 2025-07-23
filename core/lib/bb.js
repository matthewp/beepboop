import {
  createMachine,
  state as createState,
  action,
  guard,
  transition,
  immediate,
  interpret,
  reduce,
  invoke,
} from 'robot3';
import { createElement, render, Component as PreactComponent } from 'preact';

// Constants
const BEEPBOOP_INITIAL_STATE = 'beepboop.initial';
const LIFECYCLE_EFFECT = Symbol('lifecycle');

// Util
let valueEnumerable = (value) => ({ enumerable: true, value });
let valueEnumerableWritable = (value) => ({
  enumerable: true,
  value,
  writable: true,
});
let create = (a, b) => Object.freeze(Object.create(a, b));
let mergeArray = (a, b) => (Array.isArray(a) ? a.concat([b]) : [b]);
let h = (fn) => (_, ev) => fn(ev);

// Props validation function
function validateProps(props, schema) {
  if (!schema) {
    return props; // No validation if no schema defined
  }
  
  const result = schema['~standard'].validate(props);
  if ('issues' in result) {
    // Throw error with validation issues
    const messages = result.issues.map(issue => 
      `${issue.path.length > 0 ? issue.path.join('.') + ': ' : ''}${issue.message}`
    ).join(', ');
    throw new Error(`Props validation failed: ${messages}`);
  }
  
  return result.value;
}

let effect = fn => (_r, _v, ev) => fn(ev);
let viewEffect = () => (_r, _v, ev) => {
  // Re-render the view with updated model
  let component = ev.service.context.root;
  if (component.actor.service) {
    component.draw();
  }
};
let mutateAction = (fns, key) =>
  action((ctx, ev) => {
    for (let fn of fns) {
      fn(ctx.root, ctx.model[key], ev);
    }
  });


class EventDetails {
  constructor(type, domEvent, data, actor) {
    this.type = type;
    this.domEvent = domEvent;
    this.actor = actor;
    this.data = data;
    this._service = actor.service;
  }
  send = (...args) => {
    return this.actor.send(...args);
  }
  sendEvent(...args) {
    return this.actor.sendEvent(...args);
  }
  get root() {
    return this.actor.component;
  }
  get service() {
    return this._service ?? this.actor.service;
  }
  set service(val) {
    this._service = val;
  }
  get model() {
    return this.service.context.model;
  }
  get state() {
    return this.service.machine.current;
  }
}

class Component extends PreactComponent {
  constructor(props) {
    super(props);
    this.actor = Object.create(props.actor);
    this.actor.send = this.actor.send.bind(this.actor);
    this.actor.sendEvent = this.actor.sendEvent.bind(this.actor);
    this.actor.init(this);

    // Validate and send initial props event
    const validatedProps = validateProps(props.props, this.actor.propsSchema);
    this.actor.send('props', validatedProps);

    this.state = {
      view: this.callView()
    };
  }

  deliver = (name) => {
    return event => this.actor.sendEvent(name, event);
  };

  callView() {
    return this.actor.viewFn({
      deliver: this.deliver,
      model: this.actor.service.context.model,
      send: this.actor.send
    });
  }

  draw() {
    this.setState({
      view: this.callView()
    });
  }

  componentDidUpdate(prevProps) {
    // Validate and send props event on updates
    const validatedProps = validateProps(this.props.props, this.actor.propsSchema);
    this.actor.send('props', validatedProps);
  }

  render() {
    return this.state.view;
  }
}

let Actor = {
  mount(selector) {
    let el =
      typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    // Render the view with the actual model from the service
    if (this.viewFn) {
      render(createElement(this.view()), el);
    }
  },
  init(component) {
    this.component = component;
    this.interpret();
  },
  interpret() {
    this.service = interpret(
      this.machine,
      () => {
        // TODO state change effects
      },
      this.component,
      new EventDetails(null, null, null, this)
    );
    return this;
  },
  send(eventType, data) {
    let domEvent = null;
    if (typeof eventType === 'object' && ('type' in eventType)) {
      domEvent = eventType;
      eventType = domEvent.type;
    }
    this.service?.send(new EventDetails(eventType, domEvent, data, this));
  },
  sendEvent(eventType, domEvent) {
    this.service?.send(new EventDetails(eventType, domEvent, null, this));
  },
  view() {
    return (props) => createElement(Component, { actor: this, props });
  }
};


function build(builder) {
  let effects = builder.effects;


  // Process always transitions - apply to all states
  let states = { ...builder.states };
  for (let { event, args } of (builder.alwaysTransitions || [])) {
    for (let stateName in states) {
      let state = states[stateName];
      state.events[event] = mergeArray(state.events[event], [stateName, args]);
    }
  }

  let machineDefn = {};
  for (let name in states) {
    let state = states[name];
    let stateArgs = [];
    for (let evName in state.events) {
      let eventDetails = state.events[evName];
      for (let [dest, extras] of eventDetails) {
        let args = [];
        for (let type of extras) {
          if (AssignType.isPrototypeOf(type)) {
            let key = type.key;
            args.push(reduce(type.reducer.bind(type)));
            // Always add view effect if there's a view function
            if (builder.viewFn) {
              args.push(mutateAction([viewEffect()], key));
            }
          } else {
            args.push(type);
          }
        }
        stateArgs.push(transition(evName, dest, ...args));
      }
    }
    for (let dest in state.immediates) {
      for (let extras of state.immediates[dest]) {
        let args = [];
        if (name === builder.initial) {
          args.push(reduce(function(ctx, ev) {
            ev.service = this;
            return ctx;
          }));
        }
        for (let type of extras) {
          if (AssignType.isPrototypeOf(type)) {
            let key = type.key;
            args.push(reduce(type.reducer.bind(type)));
            // Always add view effect if there's a view function
            if (builder.viewFn) {
              args.push(mutateAction([viewEffect()], key));
            }
          } else {
            args.push(type);
          }
        }
        stateArgs.push(immediate(dest, ...args));
      }
    }
    // Check if this state has an invoke function
    if (state.invoke) {
      machineDefn[name] = invoke(h(state.invoke), ...stateArgs);
    } else {
      machineDefn[name] = createState(...stateArgs);
    }
  }

  // Start with empty model - users set initial values via transitions
  let modelFn = () => ({});

  // Add the initial state that immediately transitions to the builder's initial state
  let initialArgs = [];
  if (effects[LIFECYCLE_EFFECT] && typeof window !== 'undefined') {
    initialArgs.push(mutateAction(effects[LIFECYCLE_EFFECT], ''));
  }

  machineDefn[BEEPBOOP_INITIAL_STATE] = createState(immediate(builder.initial, ...initialArgs));

  let machine = createMachine(BEEPBOOP_INITIAL_STATE, machineDefn, (root) => {
    return {
      model: modelFn(),
      root,
    };
  });
  return machine;
}

function extendState(bb, state) {
  let desc = Object.getOwnPropertyDescriptor(bb.states, state);
  return desc.value;
}

function createBuilder(initial, model, states, effects, viewFn, alwaysTransitions, propsSchema) {
  return Object.create(Builder, {
    initial: valueEnumerable(initial),
    model: valueEnumerable(model),
    states: valueEnumerable(states),
    effects: valueEnumerable(effects ?? {}),
    viewFn: valueEnumerable(viewFn ?? null),
    alwaysTransitions: valueEnumerable(alwaysTransitions ?? []),
    propsSchema: valueEnumerable(propsSchema ?? null)
  });
}

function appendStates(builder, states) {
  return createBuilder(
    builder.initial,
    builder.model,
    states,
    builder.effects,
    builder.viewFn,
    builder.alwaysTransitions,
    builder.propsSchema
  );
}

let AssignType = {
  reducer(ctx, ev) {
    let newValue = this.fn(ev);
    
    if (this.key.includes('.')) {
      // Handle nested path like 'user.name'
      const keys = this.key.split('.');
      let obj = ctx.model;
      
      // Navigate to parent object
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      
      // Set final property
      obj[keys[keys.length - 1]] = newValue;
    } else {
      // Current behavior for flat keys
      ctx.model[this.key] = newValue;
    }
    
    return ctx;
  },
};

let Builder = {
  template() {
    throw new Error(`Not yet implemented.`);
  },
  model(schema) {
    return createBuilder(this.initial, schema, this.states, this.effects, this.viewFn, this.alwaysTransitions, this.propsSchema);
  },
  props(schema) {
    return createBuilder(this.initial, this.model, this.states, this.effects, this.viewFn, this.alwaysTransitions, schema);
  },
  states(names) {
    let desc = {};
    for (let name of names) {
      desc[name] = {
        events: {},
        immediates: {},
        invoke: null,
      };
    }
    return createBuilder(names[0], this.model, desc, this.effects, this.viewFn, this.alwaysTransitions, this.propsSchema);
  },
  events(state, events) {
    // TODO validate state exists
    let desc = extendState(this, state);
    for (let name of events) {
      desc.events[name] = {};
    }
    return appendStates(this, {
      ...this.states,
      [state]: desc,
    });
  },
  immediate(state, dest, ...args) {
    let desc = extendState(this, state);
    desc.immediates[dest] = mergeArray(desc.immediates[dest], args);
    return appendStates(this, {
      ...this.states,
      [state]: desc,
    });
  },
  transition(state, event, dest, ...args) {
    let desc = extendState(this, state);
    //desc.immediates[dest] = args;
    desc.events[event] = mergeArray(desc.events[event], [dest, args]);
    return appendStates(this, {
      ...this.states,
      [state]: desc,
    });
  },
  guard(fn) {
    return guard(h(fn));
  },
  assign(key, fn) {
    return create(AssignType, {
      key: valueEnumerable(key),
      fn: valueEnumerable(fn),
    });
  },
  effect(keyOrFn, fn) {
    let key, effectFn;

    if (typeof keyOrFn === 'function') {
      // Lifecycle effect - use special symbol key
      key = LIFECYCLE_EFFECT;
      effectFn = keyOrFn;
    } else {
      // Model effect - use provided key
      key = keyOrFn;
      effectFn = fn;
    }

    return createBuilder(this.initial, this.model, this.states, {
      ...this.effects,
      [key]: mergeArray(this.effects[key], effect(effectFn)),
    }, this.viewFn, this.alwaysTransitions, this.propsSchema);
  },
  always(event, ...args) {
    const newAlwaysTransitions = mergeArray(this.alwaysTransitions, { event, args });
    return createBuilder(
      this.initial,
      this.model,
      this.states,
      this.effects,
      this.viewFn,
      newAlwaysTransitions,
      this.propsSchema
    );
  },
  invoke(state, fn) {
    let desc = extendState(this, state);
    desc.invoke = fn;
    return appendStates(this, {
      ...this.states,
      [state]: desc,
    });
  },
  view(fn) {
    return createBuilder(this.initial, this.model, this.states, this.effects, fn ?? null, this.alwaysTransitions, this.propsSchema);
  },
  actor(builder) {
    if (builder) {
      return Object.create(Actor, {
        machine: valueEnumerable(build(builder)),
        viewFn: valueEnumerable(builder.viewFn),
        propsSchema: valueEnumerable(builder.propsSchema),
        service: valueEnumerableWritable(undefined),
      });
    } else {
      return create(Actor);
    }
  }
};

export let bb = create(Builder);
