declare module '@matthewp/beepboop' {
  import type { Machine, MachineState, Reducer, guard as baseGuard } from 'robot3';
  import type { Cell, cell } from 'cellx';

  export type Binding = {
    updateOn(cell: Cell): void;
    set(val: any): void;
    get current(): any;
  };

  export type Component<R extends HTMLElement> = {
    mount(root: R): void;
    unmount(): void;
  };

  export type SetupArgs<R, K> = {
    props: Record<string, any>;
    cell: typeof cell;
    state: Cell<{
      name: K;
      value: MachineState;
    }>;
    root: R;
    // DOM helpers
    text(selector: string): Binding;
  };

  export type CreateComponentArgs<S, C, K, R> = {
    machine: Machine<S, C, K>;

    setup(args: SetupArgs<R, K>): Record<string, Cell>;
  };

  export function createComponent<S = {}, C = {}, K = string, R extends HTMLElement>(args: CreateComponentArgs<S, C, K, R>): Component<R>;

  // Assign
  export type AssignFunction<T, C, E> = (current: T, event: E, context: C) => T;
  export function assign<T extends string, C, E>(prop: string, fn: AssignFunction<T, C, E>): Reducer<C, E>;

  
  // Guard
  export type BaseGuard = typeof baseGuard;
  function NamedGuard<T extends string, C, E>(guardFunction?: GuardFunction<T, E, C> | undefined): Guard<C, E>;
  export const guard: BaseGuard | typeof NamedGuard;

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
}