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

let mutation = (selector, m) => (root, value) => {
  let el = root.querySelector(selector);
  return m(el, value);
};
let mutateText = (el, value) => (el.textContent = value);
let mutateAction = (fns, key) =>
  action((ctx) => {
    for (let fn of fns) {
      fn(ctx.root, ctx.model[key]);
    }
  });

// Blueprint
let Blueprint = {
  mutate(selector, mutator) {
    throw new Error(`Not yet implemented`);
  },
  text(selector, key) {
    return createBlueprint(
      this.machine,
      this.ui,
      {
        ...this.effects,
        [key]: mergeArray(this.effects[key], mutation(selector, mutateText)),
      },
      this.events
    );
  },
  on(selector, domEvent, machineEvent) {
    return createBlueprint(this.machine, this.ui, this.effects, {
      ...this.events,
      [selector]: mergeArray(this.effects[selector], [domEvent, machineEvent]),
    });
  },
};

function createBlueprint(machine, ui, effects, events) {
  return Object.create(Blueprint, {
    machine: valueEnumerable(machine),
    ui: valueEnumerable(ui),
    effects: valueEnumerable(effects ?? {}),
    events: valueEnumerable(events ?? {}),
  });
}

let UI = {
  selectors() {
    return this;
  },
};

function createUI() {
  return create(UI);
}

class Event {
  constructor(type, domEvent, service) {
    this.type = type;
    this.domEvent = domEvent;
    this.model = service.context.model;
    this.state = service.machine.current;
  }
}

function listenToEvents(app, root) {
  for (const [selector, defns] of Object.entries(app.events)) {
    for (const el of root.querySelectorAll(selector)) {
      for (const [domEvent, machineEvent] of defns) {
        el.addEventListener(domEvent, (ev) => {
          // TODO unlisten
          app.service?.send(new Event(machineEvent, ev, app.service));
        });
      }
    }
  }
}

let App = {
  mount(selector) {
    let el =
      typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    this.service = interpret(
      this.machine,
      () => {
        // TODO state change effects
      },
      el
    );
    listenToEvents(this, el);
  },
};

function build({ machine: builder, effects }) {
  let machineDefn = {};
  for (let name in builder.states) {
    let state = builder.states[name];
    let stateArgs = [];
    for (let evName in state.events) {
      let eventDetails = state.events[evName];
      for (const [dest, extras] of eventDetails) {
        stateArgs.push(transition(evName, dest, ...extras));
      }
    }
    for (let dest in state.immediates) {
      let extras = state.immediates[dest];
      let args = [];
      for (let type of extras) {
        if (AssignType.isPrototypeOf(type)) {
          let key = type.key;
          args.push(reduce(type.reducer.bind(type)));
          args.push(mutateAction(effects[key], key));
        } else {
          args.push(type);
        }
      }
      stateArgs.push(immediate(dest, ...args));
    }
    machineDefn[name] = createState(...stateArgs);
  }

  let modelFn = builder.model ?? (() => ({}));
  let machine = createMachine(builder.initial, machineDefn, (root) => {
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

function createBuilder(initial, model, selectors, states) {
  if (arguments.length < 4) {
    throw new Error('ops');
  }
  return Object.create(Builder, {
    initial: valueEnumerable(initial),
    model: valueEnumerable(model),
    states: valueEnumerable(states),
  });
}

function appendStates(builder, states) {
  return createBuilder(
    builder.initial,
    builder.model,
    builder.selectors,
    states
  );
}

let AssignType = {
  reducer(ctx, ev) {
    let newValue = this.fn(ev);
    ctx.model[this.key] = newValue;
    return ctx;
  },
};

let Builder = {
  selectors(selectors) {
    return createBuilder(this.initial, this.model, selectors, this.states);
  },
  model(model) {
    return createBuilder(this.initial, model, this.selectors, this.states);
  },
  states(names) {
    const desc = {};
    for (let name of names) {
      desc[name] = {
        events: {},
        immediates: {},
      };
    }
    return createBuilder(names[0], this.model, this.selectors, desc);
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
    desc.immediates[dest] = args;
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
  ui() {
    return createUI();
  },
  app(blue) {
    return Object.create(App, {
      machine: valueEnumerable(build(blue)),
      events: valueEnumerable(blue.events),
      service: valueEnumerableWritable(undefined),
    });
  },
  connect(machine, ui) {
    return createBlueprint(machine, ui);
  },
};

/**
 * @type {Builder}
 */
export let bb = create(Builder);
