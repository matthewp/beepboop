declare namespace util {
  type ValidKey = string | number | symbol; // TODO remove?

  type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

  type identity<T> = T;
  type flatten<T extends object> = identity<{ [k in keyof T]: T[k] }>;
  type extendShape<A, B> = flatten<Omit<A, keyof B> & B>;
  type stringKey<K extends ValidKey> = K extends string ? K : never;
  type stringKeys<K extends {}> = stringKey<keyof K>;
}

// UI
declare namespace ui {
  type AddSelector<R extends UIRawShape, S extends string> = util.extendShape<
    R,
    {
      [s in S]: {
        type: HTMLElement;
      };
    }
  >;

  type UIRawShape = {
    // selectors
    [k in string]: {
      type: HTMLElement;
    };
  };

  type UIValue = {
    string(): string;
    number(): number;
    boolean(): boolean;
    json<T extends {} = {}>(): T;
  };

  type UIElement = {
    attr(name: string): UIValue;
    prop(name: string): UIValue;
    text(): UIValue;
  };

  type UIFn = (selector: string) => UIElement;

  type UIProto<R extends UIRawShape> = {
    selectors<S extends readonly string[]>(
      sel: S
    ): UIType<AddSelector<R, util.ArrayElement<S>>>;
    shape(/* future jsx here */): UIType<R>;
  };

  type UIType<R extends UIRawShape> = UIFn & UIProto<R>;
}

// Blueprint
declare namespace blue {
  type BlueprintRawShape = {
    // selectors
    [k in string]: {
      text: string;
    };
  };

  type AddSelector<
    R extends BlueprintRawShape,
    S extends string
  > = util.extendShape<
    R,
    {
      [s in S]: {
        text: string;
      };
    }
  >;

  const UI_EXTRA_BRAND: unique symbol;
  type UIExtraType<R, M, S> = {
    [UI_EXTRA_BRAND]: R;
  };

  type MutatorFn = (el: HTMLElement) => void;
  const MUTATOR_BRAND: unique symbol;
  type Mutator = {
    [MUTATOR_BRAND]: true;
    fn: MutatorFn;
  };

  type getSelectors<B extends BlueprintRawShape> = util.stringKeys<B>;

  type createMutator = (fn: MutatorFn) => Mutator;

  type BlueprintT<
    R extends RawShape,
    M extends RawModel,
    U extends ui.UIRawShape,
    B extends BlueprintRawShape
  > = {
    mutate<S extends getSelectors<B>>(
      sel: S,
      mutator: Mutator
    ): BlueprintT<R, M, U, B>;
    text<S extends getSelectors<B>, K extends keyof M>(
      sel: S,
      key: K
    ): BlueprintT<R, M, U, B>;
    on<S extends getSelectors<B>>(
      sel: S,
      domEvent: string,
      event: GetAllEvents<R>
    ): BlueprintT<R, M, U, B>;
  };
}

// Machine
type RawModel = {};

type RawShape = {
  selectors: {
    [k in string]: {
      text: string;
    };
  };
  states: {
    [k in string]: {
      // events
      events: {
        [e in string]: string[];
      };
      immediates: string[];
    };
  };
};

// Getters
type ShapeStates<R extends RawShape> = R['states'];
type ShapeSelectors<R extends RawShape> = R['selectors'];
type GetStates<R extends RawShape> = util.stringKeys<R['states']>;
type GetEvents<R extends RawShape, S extends GetStates<R>> = util.stringKeys<R['states'][S]['events']>;
type GetAllEvents<R extends RawShape> = util.stringKeys<ShapeStates<R>[string]['events']>;
type GetTransitions<
  R extends RawShape,
  S extends GetStates<R>,
  E extends GetEvents<R, S>
> = ShapeStates<R>[S]['events'][E];
type GetImmediates<
  R extends RawShape,
  S extends GetStates<R>
> = ShapeStates<R>[S]['immediates'] extends undefined ? [] : ShapeStates<R>[S]['immediates'];
type GetModelKeys<M extends RawModel> = util.stringKeys<M>;

// Setters
type AddState<
  R extends RawShape,
  S extends string,
  B = {},
  I = undefined
> = util.extendShape<R, {
  states: util.extendShape<R['states'], {
    [s in S]: {
      events: B;
      immediates: I;
    };
  }>
}>;

type AddEvent<
  R extends RawShape,
  S extends GetStates<R>,
  E extends string,
  D extends readonly string[] = []
> = AddState<
  R,
  S,
  util.extendShape<
    ShapeStates<R>[S]['events'],
    {
      [e in E]: D;
    }
  >,
  GetImmediates<R, S>
>;
type AddTransition<
  R extends RawShape,
  S extends GetStates<R>,
  E extends GetEvents<R, S>,
  D extends string
> = AddEvent<R, S, E, [...GetTransitions<R, S, E>, D]>;
type AddImmediate<
  R extends RawShape,
  S extends GetStates<R>,
  D extends string
> = AddState<R, S, GetEvents<R, S>, [...GetImmediates<R, S>, D]>;
type AddSelector<R extends RawShape, S extends string, B = {}, I = undefined> = util.extendShape<R, {
  selectors: util.extendShape<R['selectors'], {
    [s in S]: {
      type: HTMLElement;
    };
  }>
}>;

// Extras
declare const GUARD_BRAND: unique symbol;
type GuardType<R extends RawShape, M> = {
  [GUARD_BRAND]: R;
  fn: (model: M) => boolean;
};

declare const REDUCE_BRAND: unique symbol;
type ReduceType<R extends RawShape, M> = {
  [REDUCE_BRAND]: R;
  fn: (model: M) => M;
};

type ExtraType<R extends RawShape, M> = GuardType<R, M> | ReduceType<R, M>;

// Event
type MachineEvent<R extends RawShape, M extends RawModel> = {
  type: GetAllEvents<R>;
  domEvent: Event;
  model: M;
  state: GetStates<R>;
};

// Builder

type BuilderType<R extends RawShape, M extends RawModel> = {
  shape: R;
  selectors<S extends readonly string[]>(
    sel: S
  ): BuilderType<AddSelector<R, util.ArrayElement<S>>, M>;
  model<M extends {}>(model: M | ((props: any) => M)): BuilderType<R, M>;
  state<S extends string>(s: S): BuilderType<AddState<R, S>, M>;
  states<S extends readonly string[]>(
    state: S
  ): BuilderType<AddState<R, util.ArrayElement<S>>, M>;
  events<S extends GetStates<R>, E extends readonly string[]>(
    state: S,
    events: E
  ): BuilderType<AddEvent<R, S, util.ArrayElement<E>>, M>;
  transition<
    S extends GetStates<R>,
    E extends GetEvents<R, S>,
    D extends GetStates<R>
  >(
    state: S,
    event: E,
    dest: D,
    ...extras: ExtraType<R, M>[]
  ): BuilderType<AddTransition<R, S, E, D>, M>;
  immediate<S extends GetStates<R>, D extends GetStates<R>>(
    state: S,
    dest: D,
    ...extras: ExtraType<R, M>[]
  ): BuilderType<AddImmediate<R, S, D>, M>;

  // Helpers
  guard<RR extends R, MM extends M>(
    fn: (event: MachineEvent<RR, MM>) => boolean
  ): GuardType<RR, MM>;
  reduce<RR extends R, MM extends M>(
    fn: (event: MachineEvent<RR, MM>) => MM
  ): ReduceType<RR, MM>;
  assign<RR extends R, MM extends M, K extends keyof MM>(
    key: K,
    fn: (event: MachineEvent<RR, MM>) => MM[K]
  ): ReduceType<RR, MM>;

  ui(): ui.UIType<{}>;

  connect<RR extends R, MM extends M, U extends ui.UIRawShape>(
    machine: BuilderType<RR, MM>,
    ui: ui.UIType<U>
  ): blue.BlueprintT<RR, MM, U, {}>;
};

type Builder = BuilderType<RawShape, RawModel>;
declare const bb: Builder;

// Other exports
type createMutator = blue.createMutator;

export { bb, createMutator };
