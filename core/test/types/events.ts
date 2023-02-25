import { bb } from '../../lib/bb.js';
import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('events() infers states correct', () => {
  let machine = bb.states(['one', 'two'] as const);
  type Type = typeof machine;
  type EventsParams = Parameters<Type['events']>;
  type EventParamsStates = EventsParams[0];
  
  expectTypeOf<EventParamsStates>().toMatchTypeOf<'one' | 'two'>();
});

test('transitions() infers source, event, and destination', () => {
  let machine = bb.states(['one', 'two'] as const)
    .events('one', ['foo'] as const);

  type Type = typeof machine;
  type TransitionParams = Parameters<Type['transition']>;

  // Source
  expectTypeOf<TransitionParams[0]>().toMatchTypeOf<'one' | 'two'>();
  // Event
  type TransitionParamsWithStateOne = Parameters<typeof machine.transition<'one'>>;
  expectTypeOf<TransitionParamsWithStateOne[1]>().toMatchTypeOf<'foo'>();
  // Destination
  expectTypeOf<TransitionParams[2]>().toMatchTypeOf<'one' | 'two'>();
});

test('immediate() infers source and destination', () => {
  let machine = bb.states(['one', 'two'] as const);

  type Type = typeof machine;
  type ImmediateParams = Parameters<Type['immediate']>;

  expectTypeOf<ImmediateParams[0]>().toMatchTypeOf<'one' | 'two'>();
  expectTypeOf<ImmediateParams[1]>().toMatchTypeOf<'one' | 'two'>();
});