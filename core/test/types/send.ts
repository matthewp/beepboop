import { bb } from '../../lib/bb.js';
import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('send() infers model prop', () => {
  let machine = bb
    .model({
      worker: bb.type<Worker>()
    });

  type Type = typeof machine;
  type SendParams = Parameters<Type['send']>;

  expectTypeOf<SendParams[0]>().toMatchTypeOf<'worker'>();
  // @ts-expect-error
  expectTypeOf<SendParams[0]>().toMatchTypeOf<'another-string'>();

  expectTypeOf<SendParams[1]>().toMatchTypeOf<string>();
});

