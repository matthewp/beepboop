import { Component } from 'preact';
import { type GetSelectors as GetTemplateSelectors } from 'ts-types-html-parser';
import type { StandardSchemaV1 } from '@standard-schema/spec';

declare namespace util {
  type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
  type AllKeys<T> = T extends any ? keyof T : never;

  type identity<T> = T;
  type flatten<T extends object> = identity<{ [k in keyof T]: T[k] }>;
  type extendShape<A, B> = flatten<Omit<A, keyof B> & B>;

  const brandSymbol: unique symbol;
  type brand<T, N> = T & {
    [brandSymbol]: N;
  }
}

type RawShape = {
  model: StandardSchemaV1,
  props?: StandardSchemaV1 | undefined;
  selectors: {
    [s1 in string]: {};
  };
  states: {
    [s2 in string]: {
      // events
      events: {
        [e in string]: string[];
      };
      immediates: string[];
    };
  };
};

// Getters
type GetSelectors<R extends RawShape> = keyof R['selectors'] extends string ? keyof R['selectors'] : never;
type GetStates<R extends RawShape> = keyof R['states'] extends string ? keyof R['states'] : never;
type GetEvents<R extends RawShape, S extends GetStates<R>> = keyof R['states'][S]['events'] extends string ? keyof R['states'][S]['events'] : never;
type GetAllEvents<R extends RawShape> = util.AllKeys<R['states'][GetStates<R>]['events']> | 'props'
type GetImmediates<R extends RawShape, S extends GetStates<R>> =
  R['states'][S]['immediates'] extends undefined ? [] : R['states'][S]['immediates'];
type GetTransitions<R extends RawShape, S extends GetStates<R>, E extends GetEvents<R, S>> = R['states'][S]['events'][E];
type GetModelKeys<R extends RawShape> = NestedPaths<StandardSchemaV1.InferOutput<R['model']>>;
type GetModelKeyType<R extends RawShape, K extends GetModelKeys<R>> = GetNestedType<StandardSchemaV1.InferOutput<R['model']>, K>;

// Props types
type GetPropsType<R extends RawShape> = R['props'] extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<R['props']> : any;

// Debug nested path types step by step
type NestedPaths<T> = T extends Record<string, any>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, any>
        ? T[K] extends readonly any[]
          ? K // Arrays are terminal paths
          : K | `${K}.${NestedPaths<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

type GetNestedType<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? GetNestedType<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;


// Setters
type AddSelector<R extends RawShape, S extends string> = util.extendShape<R, {
  selectors: util.extendShape<R['selectors'], {
    [s in S]: {};
  }>
}>;
type AddState<R extends RawShape, S extends string, B = {}, I = undefined> = util.extendShape<R, {
  states: util.extendShape<R['states'], {
    [s in S]: {
      events: B;
      immediates: I;
    };
  }>
}>;
type AddModel<R extends RawShape, S extends StandardSchemaV1> = util.extendShape<R, { model: S }>;
type AddProps<R extends RawShape, S extends StandardSchemaV1> = util.extendShape<R, { props: S }>;
type AddEvent<R extends RawShape, S extends GetStates<R>, E extends string, D extends readonly string[] = []> = AddState<
  R,
  S,
  util.extendShape<
    R['states'][S]['events'],
    {
      [e in E]: D;
    }
  >,
  GetImmediates<R, S>
>;
type AddTransition<R extends RawShape, S extends GetStates<R>, E extends GetEvents<R, S>, D extends string> =
  AddEvent<R, S, E, [...GetTransitions<R, S, E>, D]>;
type AddImmediate<R extends RawShape, S extends GetStates<R>, D extends string> = AddState<R, S, GetEvents<R, S>, [...GetImmediates<R, S>, D]>;
type AddAlwaysEvent<R extends RawShape, E extends string> = R & {
  states: {
    [K in keyof R['states']]: {
      events: R['states'][K]['events'] & { [e in E]: [K] };
      immediates: R['states'][K]['immediates'];
    };
  };
};

// Extras
declare const GUARD_BRAND: unique symbol;
type GuardType<R extends RawShape> = util.brand<{
  [GUARD_BRAND]: R;
  fn: (model: R['model']) => boolean;
}, 'guard'>;

declare const REDUCE_BRAND: unique symbol;
type ReduceType<R extends RawShape> = util.brand<{
  [REDUCE_BRAND]: R; // necessary for weird reasons
  fn: (model: R['model']) => R['model'];
}, 'reduce'>;
type ExtraType<R extends RawShape> = GuardType<R> | ReduceType<R>;
type SendFunction<R extends RawShape> = (event: GetAllEvents<R> | { type: GetAllEvents<R>;[key: string]: any }) => void;

// Standard Schema is now used for all model definitions

// Event - conditional type for props events
type MachineEvent<R extends RawShape, E extends GetAllEvents<R> = GetAllEvents<R>, T = any> = {
  type: E;
  data: E extends 'props' ? GetPropsType<R> : T;
  domEvent: Event;
  model: {
    [k in GetModelKeys<R>]: GetModelKeyType<R, k>
  };
  state: GetStates<R>;
  root: Component;
  send(type: string, data?: any): void;
  send({ type: any }): void;
  sendEvent: (type: string, domEvent: Event) => void;
};

declare const me: MachineEvent<any>;

// Actor
type Actor<R extends RawShape = any> = {
  mount(rootSelector: string | HTMLElement | Document): void;
  interpret(): Actor<R>;
  send(eventType: GetAllEvents<R>, data?: any): void;
  send(event: { type: GetAllEvents<R>; [key: string]: any }): void;
};

type BuilderType<R extends RawShape> = {
  // UI
  selectors<const S extends readonly string[]>(
    sel: S
  ): BuilderType<AddSelector<R, util.ArrayElement<S>>>;
  template<S extends string>(tmpl: S): BuilderType<AddSelector<R, GetTemplateSelectors<S> & {}>>;
  on<S extends GetSelectors<R> = GetSelectors<R>, E extends GetAllEvents<R> = GetAllEvents<R>>(
    sel: S,
    domEvent: string,
    machineEvent: E,
  ): BuilderType<R>;
  text<S extends GetSelectors<R> = GetSelectors<R>, K extends GetModelKeys<R> = GetModelKeys<R>>(
    sel: S,
    modelProp: K
  ): BuilderType<R>;
  attr<S extends GetSelectors<R> = GetSelectors<R>, K extends GetModelKeys<R> = GetModelKeys<R>>(
    sel: S,
    attrName: string,
    modelProp: K
  ): BuilderType<R>;
  class<S extends GetSelectors<R> = GetSelectors<R>, K extends GetModelKeys<R> = GetModelKeys<R>>(
    sel: S,
    className: string,
    modelProp: K
  ): BuilderType<R>;
  prop<S extends GetSelectors<R> = GetSelectors<R>, K extends GetModelKeys<R> = GetModelKeys<R>>(
    sel: S,
    propName: string,
    modelProp: K
  ): BuilderType<R>;
  effect<K extends GetModelKeys<R>>(
    key: K,
    fn: (event: MachineEvent<R>) => void
  ): BuilderType<R>;
  effect(
    fn: (event: MachineEvent<R>) => void | (() => void)
  ): BuilderType<R>;
  spawn<S extends GetSelectors<R> = GetSelectors<R>, K extends GetModelKeys<R> = GetModelKeys<R>>(
    sel: S,
    key: K,
    actor: Actor<any>
  ): BuilderType<R>;
  view(
    fn: (props: {
      model: { [k in GetModelKeys<R>]: GetModelKeyType<R, k> };
      send: SendFunction<R>;
    }) => any
  ): BuilderType<R>;
  view<M extends RawShape>(machine: M & { viewFn: any }): (props?: any) => Component;

  // Data model
  model<S extends StandardSchemaV1>(schema: S): BuilderType<AddModel<R, S>>;
  props<S extends StandardSchemaV1>(schema: S): BuilderType<AddProps<R, S>>;

  // FSM
  states<const S extends readonly string[]>(
    states: S
  ): BuilderType<AddState<R, util.ArrayElement<S>>>;
  events<S extends GetStates<R>, const E extends readonly string[]>(
    state: S,
    events: E
  ): BuilderType<AddEvent<R, S, util.ArrayElement<E>>>;
  transition<S extends GetStates<R>, E extends GetEvents<R, S> = GetEvents<R, S>, D extends GetStates<R> = GetStates<R>>(
    state: S,
    event: E,
    dest: D,
    ...extras: ExtraType<R>[]
  ): BuilderType<AddTransition<R, S, E, D>>;
  immediate<S extends GetStates<R>, D extends GetStates<R>>(
    state: S,
    dest: D,
    ...extras: ExtraType<R>[]
  ): BuilderType<AddImmediate<R, S, D>>;
  always<E extends string>(
    event: E,
    ...extras: ExtraType<R>[]
  ): BuilderType<AddAlwaysEvent<R, E>>;
  init(...extras: ExtraType<R>[]): BuilderType<R>;
  invoke<S extends GetStates<R>>(
    state: S,
    fn: (event: MachineEvent<R>) => Promise<any>
  ): BuilderType<R>;

  // Helpers
  guard<RR extends R>(
    fn: (event: MachineEvent<RR>) => boolean
  ): GuardType<RR>;
  reduce<RR extends R>(
    fn: (event: MachineEvent<RR>) => RR['model']
  ): ReduceType<RR>;
  assign<RR extends R, K extends GetModelKeys<RR> = GetModelKeys<RR>>(
    key: K,
    fn: (event: MachineEvent<RR>) => GetModelKeyType<RR, K>
  ): ReduceType<RR>;

  actor(builder: R): Actor<R>;
  actor(): Actor<R>;
}

type Builder = BuilderType<{ states: {}, selectors: {}, model: StandardSchemaV1 }>;
declare const bb: Builder;

interface BeepBoopComponent extends Component<{ actor: Actor<any> }> {
  draw(): void;
}

export {
  bb,
  BeepBoopComponent as Component,
  BeepBoopComponent as View,
};
