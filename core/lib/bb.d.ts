import { type GetSelectors as GetTemplateSelectors } from 'ts-types-html-parser';

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
  model: {
    [k: string]: any;
  },
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
type GetAllEvents<R extends RawShape> = util.AllKeys<R['states'][GetStates<R>]['events']>
type GetImmediates<R extends RawShape, S extends GetStates<R>> =
  R['states'][S]['immediates'] extends undefined ? [] : R['states'][S]['immediates'];
type GetTransitions<R extends RawShape, S extends GetStates<R>, E extends GetEvents<R, S>> = R['states'][S]['events'][E];
type GetModelKeys<R extends RawShape> = keyof R['model'] extends string ? keyof R['model'] : never;
type GetModelKeyType<R extends RawShape, K extends GetModelKeys<R>> = R['model'][K][typeof underlyingTypeSymbol];

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
type AddModel<R extends RawShape, M extends ModelSchema> = util.extendShape<R, { model: M }>;
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
type AddImmediate<R extends RawShape,S extends GetStates<R>, D extends string> = AddState<R, S, GetEvents<R, S>, [...GetImmediates<R, S>, D]>;

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

// Data model
declare const underlyingTypeSymbol: unique symbol;
type BBType<T = any> = util.brand<{ [underlyingTypeSymbol]: T; }, 'bbtype'>;
type BBString = util.brand<{ [underlyingTypeSymbol]: string; }, 'bbstring'>;
type BBNumber = util.brand<{ [underlyingTypeSymbol]: number; }, 'bbnumber'>;
type BBBool = util.brand<{ [underlyingTypeSymbol]: boolean; }, 'bbbool'>;
type BBObject = util.brand<{ [underlyingTypeSymbol]: {}; }, 'bbobj'>;
type BBArray = util.brand<{ [underlyingTypeSymbol]: Array<any> }, 'bbarray'>;
type BBSchemaType = BBString | BBNumber | BBBool | BBObject | BBArray | BBType;
type ModelSchema = {
  [k: string]: BBSchemaType
};

// Event
type MachineEvent<R extends RawShape> = {
  type: GetAllEvents<R>;
  domEvent: MouseEvent;
  model: {
    [k in GetModelKeys<R>]: GetModelKeyType<R, k>
  };
  state: GetStates<R>;
  root: HTMLElement;
};

// App
type App = {
  mount(rootSelector: string | HTMLElement): void;
};

type BuilderType<R extends RawShape> = {
  // UI
  selectors<S extends readonly string[]>(
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
  effect<K extends GetModelKeys<R>>(
    key: K,
    fn: (event: MachineEvent<R>) => void
  ): BuilderType<R>;

  // Data model
  model<MS extends ModelSchema>(schema: MS): BuilderType<AddModel<R, MS>>;
  string(): BBString;
  number(): BBNumber;
  boolean(): BBBool;
  object(o: { [k: string]: BBSchemaType }): BBObject;
  array(arr: BBSchemaType): BBArray;
  type<T>(): BBType<T>;

  // FSM
  states<S extends readonly string[]>(
    states: S
  ): BuilderType<AddState<R, util.ArrayElement<S>>>;
  events<S extends GetStates<R>, E extends readonly string[]>(
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

  app(builder: R): App;
}

type Builder = BuilderType<{ states: {}, selectors: {}, model: {} }>;
declare const bb: Builder;

export {
  bb
};