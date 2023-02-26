import {
  createMachine,
  state as createState,
  action,
  guard,
  transition,
  immediate,
  interpret,
  reduce,
} from 'robot3';

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

let BindingType = {};
let TextBinding = create(BindingType, {
  get: valueEnumerable(el => el.textContent),
  set: valueEnumerable((el, value) => el.textContent = value),
});
let AttrBinding = create(BindingType, {
  get: valueEnumerable(function(el) { return el.getAttribute(this.attrName) }),
  set: valueEnumerable(function(el, value) { return el.setAttribute(this.attrName, value) }),
});

let mutation = (selector, m) => (root, value) => {
  let el = root.querySelector(selector);
  return m.set(el, value);
};
let effect = fn => (_r, _v, ev) => fn(ev);
let mutateAction = (fns, key) =>
  action((ctx, ev) => {
    for (let fn of fns) {
      fn(ctx.root, ctx.model[key], ev);
    }
  });

// Schema modeling
let StringType = {
  coerce: raw => ''+raw
};
let BooleanType = {
  coerce: raw => Boolean(raw)
};
let NumberType = {
  coerce: raw => Number(raw)
};
let ArrayType = {};

class Event {
  constructor(type, domEvent, root, service) {
    this.type = type;
    this.domEvent = domEvent;
    this.root = root;
    this.service = service;
  }
  get model() {
    return this.service.context.model;
  }
  get state() {
    return this.service.machine.current;
  }
}

function listenToEvents(app, root) {
  for (let [selector, defns] of Object.entries(app.events)) {
    for (let el of root.querySelectorAll(selector)) {
      for (let [domEvent, machineEvent] of defns) {
        el.addEventListener(domEvent, (ev) => {
          // TODO unlisten
          app.service?.send(new Event(machineEvent, ev, root, app.service));
        });
      }
    }
  }
}

let App = {
  mount(selector) {
    // TODO this should create an instance of app
    let el =
      typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    this.service = interpret(
      this.machine,
      () => {
        // TODO state change effects
      },
      el,
      new Event(null, null, el, null)
    );
    listenToEvents(this, el);
  },
};

function createModel(root, schema, bindings) {
  let model = {};
  // TODO this can be compiled ahead of time
  for(const [key, type] of Object.entries(schema)) {
    let b = bindings[key];
    if(typeof b !== 'undefined') {
      let el = root.querySelector(b.selector);
      model[key] = type.coerce(b.get(el));
    }
  }
  return model;
}

const buildModelFn = (schema, bindings) => root => createModel(root, schema, bindings);

function build(builder) {
  let effects = builder.effects;
  let machineDefn = {};
  for (let name in builder.states) {
    let state = builder.states[name];
    let stateArgs = [];
    for (let evName in state.events) {
      let eventDetails = state.events[evName];
      for (let [dest, extras] of eventDetails) {
        let args = [];
        for (let type of extras) {
          if (AssignType.isPrototypeOf(type)) {
            let key = type.key;
            args.push(reduce(type.reducer.bind(type)));
            if(typeof effects[key] !== 'undefined') {
              args.push(mutateAction(effects[key], key));
            }
          } else {
            args.push(type);
          }
        }
        stateArgs.push(transition(evName, dest, ...args));
      }
    }
    for (let dest in state.immediates) {
      for(let extras of state.immediates[dest]) {
        let args = [];
        if(name === builder.initial) {
          args.push(reduce(function(ctx, ev) {
            ev.service = this;
            return ctx;
          }));
        }
        for (let type of extras) {
          if (AssignType.isPrototypeOf(type)) {
            let key = type.key;
            args.push(reduce(type.reducer.bind(type)));
            if(typeof effects[key] !== 'undefined') {
              args.push(mutateAction(effects[key], key));
            }
          } else {
            args.push(type);
          }
        }
        stateArgs.push(immediate(dest, ...args));
      }
    }
    machineDefn[name] = createState(...stateArgs);
  }

  let modelFn = buildModelFn(builder.model, builder.bindings);
  let machine = createMachine(builder.initial, machineDefn, (root) => {
    return {
      model: modelFn(root),
      root,
    };
  });
  return machine;
}

function extendState(bb, state) {
  let desc = Object.getOwnPropertyDescriptor(bb.states, state);
  return desc.value;
}

function createBuilder(initial, model, selectors, states, effects, evMap, bindings) {
  return Object.create(Builder, {
    initial: valueEnumerable(initial),
    model: valueEnumerable(model),
    selectors: valueEnumerable(selectors),
    states: valueEnumerable(states),
    effects: valueEnumerable(effects ?? {}),
    evMap: valueEnumerable(evMap ?? {}),
    bindings: valueEnumerable(bindings ?? {})
  });
}

function appendStates(builder, states) {
  return createBuilder(
    builder.initial,
    builder.model,
    builder.selectors,
    states,
    builder.evMap,
    builder.effects,
    builder.bindings,
  );
}

let AssignType = {
  reducer(ctx, ev) {
    let newValue = this.fn(ev);
    ctx.model[this.key] = newValue;
    return ctx;
  },
};

let addDOMBinding = (b, selector, key, BindingType) => 
  createBuilder(b.initial, b.model, b.selectors, b.states, {
    ...b.effects,
    [key]: mergeArray(b.effects[key], mutation(selector, BindingType)),
  }, b.evMap, {
    ...b.bindings,
    [key]: create(BindingType, { selector: valueEnumerable(selector) })
  });

let Builder = {
  selectors(selectors) {
    return createBuilder(this.initial, this.model, selectors, this.states, this.effects, this.evMap, this.bindings);
  },
  model(schema) {
    return createBuilder(this.initial, schema, this.selectors, this.states, this.effects, this.evMap, this.bindings);
  },
  string() {
    return create(StringType);
  },
  number() {
    return create(NumberType);
  },
  boolean() {
    return create(BooleanType);
  },
  array() { return create(ArrayType); },
  type() { return undefined; },
  states(names) {
    let desc = {};
    for (let name of names) {
      desc[name] = {
        events: {},
        immediates: {},
      };
    }
    return createBuilder(names[0], this.model, this.selectors, desc, this.effects, this.evMap, this.bindings);
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
  on(selector, domEvent, machineEvent) {
    return createBuilder(this.initial, this.model, this.selectors, this.states, this.effects, {
      ...this.evMap,
      [selector]: mergeArray(this.evMap[selector], [domEvent, machineEvent]),
    }, this.bindings);
  },
  text(selector, key) {
    return addDOMBinding(this, selector, key, TextBinding);
  },
  attr(selector, attrName, key) {
    return addDOMBinding(this, selector, key, Object.create(AttrBinding, {
      attrName: valueEnumerable(attrName)
    }));
  },
  effect(key, fn) {
    return createBuilder(this.initial, this.model, this.selectors, this.states, {
      ...this.effects,
      [key]: mergeArray(this.effects[key], effect(fn)),
    }, this.evMap, this.bindings);
  },
  app(builder) {
    return Object.create(App, {
      machine: valueEnumerable(build(builder)),
      events: valueEnumerable(builder.evMap),
      service: valueEnumerableWritable(undefined),
    });
  }
};

/**
 * @type {Builder}
 */
export let bb = create(Builder);
