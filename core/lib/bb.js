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
let viewEffect = () => (root, model, ev) => {
  // Re-render the view with updated model
  root.draw(model);
};
let mutateAction = (fn) =>
  action((ctx, ev) => {
    fn(ctx.root, ctx.model, ev);
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
    
    // Create a proper actor from the built machine
    this.actor = Object.create(Actor, {
      machine: valueEnumerable(props.machine),
      viewFn: valueEnumerable(props.viewFn),
      propsSchema: valueEnumerable(props.propsSchema),
      service: valueEnumerableWritable(undefined),
    });
    
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

  callView(model) {
    return this.actor.viewFn({
      deliver: this.deliver,
      model: model ?? this.actor.service.context.model,
      send: this.actor.send
    });
  }

  draw(model) {
    this.setState({
      view: this.callView(model)
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
    
    if (!this.viewFn) {
      throw new Error('Cannot mount actor without a view function. Use bb.view(machine) to create a mountable component.');
    }
    
    // Create component directly with machine data
    const component = createElement(Component, { 
      machine: this.machine, 
      viewFn: this.viewFn,
      propsSchema: this.propsSchema,
      props: {} 
    });
    
    render(component, el);
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
        let needsViewAction = false;
        for (let type of extras) {
          if (AssignType.isPrototypeOf(type)) {
            let key = type.key;
            args.push(reduce(type.reducer.bind(type)));
            needsViewAction = true;
          } else {
            args.push(type);
          }
        }
        // Add view effect once at the end if needed
        if (needsViewAction && builder.viewFn) {
          args.push(mutateAction(viewEffect()));
        }
        stateArgs.push(transition(evName, dest, ...args));
      }
    }
    for (let dest in state.immediates) {
      for (let extras of state.immediates[dest]) {
        let args = [];
        let needsViewAction = false;
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
            needsViewAction = true;
          } else {
            args.push(type);
          }
        }
        // Add view effect once at the end if needed
        if (needsViewAction && builder.viewFn) {
          args.push(mutateAction(viewEffect()));
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
  
  // Add init effects if any were defined
  if (states[BEEPBOOP_INITIAL_STATE]) {
    let needsViewAction = false;
    for (let dest in states[BEEPBOOP_INITIAL_STATE].immediates) {
      for (let extras of states[BEEPBOOP_INITIAL_STATE].immediates[dest]) {
        for (let type of extras) {
          if (AssignType.isPrototypeOf(type)) {
            initialArgs.push(reduce(type.reducer.bind(type)));
            needsViewAction = true;
          } else {
            initialArgs.push(type);
          }
        }
      }
    }
    // Add view effect once at the end if needed
    if (needsViewAction && builder.viewFn) {
      initialArgs.push(mutateAction(viewEffect()));
    }
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

let GuardType = Object.getPrototypeOf(guard(() => {}));

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
    // Always ensure BEEPBOOP_INITIAL_STATE exists
    desc[BEEPBOOP_INITIAL_STATE] = {
      events: {},
      immediates: {},
      invoke: null,
    };
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
  action(fn) {
    return action(h(fn));
  },
  effect(key, fn) {
    return createBuilder(this.initial, this.model, this.states, {
      ...this.effects,
      [key]: mergeArray(this.effects[key], effect(fn)),
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
  init(...args) {
    // Filter out guards since they don't make sense for initialization
    const filteredArgs = args.filter(arg => !GuardType.isPrototypeOf(arg));
    return this.immediate(BEEPBOOP_INITIAL_STATE, this.initial, ...filteredArgs);
  },
  invoke(state, fn) {
    let desc = extendState(this, state);
    desc.invoke = fn;
    return appendStates(this, {
      ...this.states,
      [state]: desc,
    });
  },
  view(fnOrMachine) {
    // If it's a function, it's the old .view(fn) for setting the view function
    if (typeof fnOrMachine === 'function') {
      return createBuilder(this.initial, this.model, this.states, this.effects, fnOrMachine ?? null, this.alwaysTransitions, this.propsSchema);
    }
    
    // If it's a Builder object (machine), it's the new bb.view(machine) for creating a component
    if (Builder.isPrototypeOf(fnOrMachine)) {
      if (!fnOrMachine.viewFn) {
        throw new Error('bb.view(machine) requires a machine with a view function. Use .view() on your machine builder first.');
      }
      
      const builtMachine = build(fnOrMachine);
      
      return (props) => createElement(Component, { 
        machine: builtMachine, 
        viewFn: fnOrMachine.viewFn,
        propsSchema: fnOrMachine.propsSchema,
        props 
      });
    }
    
    // Invalid argument
    throw new Error('bb.view() expects either a view function or a machine builder.');
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
