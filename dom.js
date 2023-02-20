import { interpret, guard, reduce } from 'robot3';
import { cellx as cell } from 'cellx';

function extraGuard(...args) {
  if (args.length === 1) {
    return guard(...args);
  } else {
    let [name, fn] = args;
    return guard((ctx, ev) => fn(ctx[name](), ev));
  }
}

function assign(prop, fn) {
  return reduce((ctx, ev) => {
    let cell = ctx[prop];
    cell(fn(cell(), ev, ctx));
    return ctx;
  });
}

let Binding = {
  updateOn(cell) {
    cell.onChange(() => {
      this.set(cell());
    });
  },
};

let TextBinding = Object.create(Binding, {
  set: {
    value(val) {
      this.root.textContent = val;
    },
  },
  current: {
    get() {
      return this.root.textContent;
    },
  },
});

let createBinding = (base, root, selector) => 
  Object.create(base, {
    root: {
      get() {
        return root.querySelector(selector);
      },
    },
  });

function text(selector) {
  return createBinding(TextBinding, this, selector);
}

let Component = {
  mount(root) {
    this.root = root;
    this.state = cell();
    this.service = interpret(this.machine, () => {
      this.state(this.service.machine.state);
    });
    this.send = this.service.send.bind(this.service);
    this.state(this.service.machine.state);
  },
  unmount() {
    this.service?.stop();
  },
  contextFn(props) {
    let r = this.root;
    return this.setup({
      props,
      cell,
      root: r,
      state: this.state,
      // DOM helpers
      text: text.bind(r)
    });
  },
};

function createComponent(options) {
  let component = Object.create(Component, {
    machine: {
      enumerable: true,
      value: Object.create(options.machine, {
        context: {
          value(props) {
            return component.contextFn(props);
          },
        },
      }),
    },
    setup: {
      enumerable: true,
      value: options.setup,
    },
  });
  return component;
}

export {
  action,
  createMachine,
  state,
  immediate,
  interpret,
  invoke,
  reduce,
  transition,
} from 'robot3';

export {
  createComponent,
  assign,
  extraGuard as guard
};