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

let BindingType = { init: false };
let TextBinding = create(BindingType, {
  get: valueEnumerable(el => el.textContent),
  set: valueEnumerable((el, value) => el.textContent = value),
});
let AttrBinding = create(BindingType, {
  get: valueEnumerable(function(el) { return el.getAttribute(this.attrName) }),
  set: valueEnumerable(function(el, value) { return el.setAttribute(this.attrName, value) }),
});
let ClassBinding = create(BindingType, {
  get: valueEnumerable(function(el) { return el.classList.contains(this.className) }),
  set: valueEnumerable(function(el, value) { return el.classList.toggle(this.className, value) }),
});
let ActorBinding = create(BindingType, {
  get: valueEnumerable(() => null),
  set: valueEnumerable(function(el) {
    // TODO unmount?
    this.actor.mount(el);
  }),
  init: valueEnumerable(true)
})

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
let initAction = (allBindings) => {
  let initBindings = allBindings.filter(binding => binding.init);
  return action(({ root, model }) => {
    initBindings.forEach(binding => {
      for(let el of root.querySelectorAll(binding.selector)) {
        // TODO obviously wrong
        binding.set(el, model[binding.key]);
      }
    });
  });
};

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
let AnyType = {
  coerce: raw => raw
};

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

function listenToMutations(app, root) {
  let observer = new MutationObserver(mutations => {
    // Loop over added nodes and see if any bindings match.
    for(let { addedNodes } of mutations) {
      for(let addedNode of addedNodes) {
        if(addedNode.nodeType !== 1) continue;
        app.service.context.bindings.forEach(binding => {
          for(let el of addedNode.querySelectorAll(binding.selector)) {
            binding.set(el, app.service.context.model[binding.key]);
          }
        });
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
}

let Actor = {
  __proto__: AnyType,
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
    listenToMutations(this, el);
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

  // Setup bindings
  let allBindings = Object.values(builder.bindings);

  machineDefn[BEEPBOOP_INITIAL_STATE] = createState(immediate(builder.initial, initAction(allBindings)));

  let modelFn = buildModelFn(builder.model, builder.bindings);
  let machine = createMachine(BEEPBOOP_INITIAL_STATE, machineDefn, (root) => {
    return {
      bindings: allBindings,
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
    [key]: create(BindingType, { key: valueEnumerable(key), selector: valueEnumerable(selector) })
  });

let Builder = {
  template() {
    throw new Error(`Not yet implemented.`);
  },
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
  send(key, eventType) {
    return action((ctx, ev) => {
      ctx.model[key].postMessage({ type: eventType })
    })
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
  class(selector, className, key) {
    return addDOMBinding(this, selector, key, Object.create(ClassBinding, {
      className: valueEnumerable(className)
    }));
  },
  spawn(selector, key, actor) {
    return addDOMBinding(this, selector, key, Object.create(ActorBinding, {
      actor: valueEnumerable(actor)
    }));
  },
  effect(key, fn) {
    return createBuilder(this.initial, this.model, this.selectors, this.states, {
      ...this.effects,
      [key]: mergeArray(this.effects[key], effect(fn)),
    }, this.evMap, this.bindings);
  },
  actor(builder) {
    if(builder) {
      return Object.create(Actor, {
        machine: valueEnumerable(build(builder)),
        events: valueEnumerable(builder.evMap),
        service: valueEnumerableWritable(undefined),
      });
    } else {
      return create(Actor);
    }
  }
};

export let bb = create(Builder);
