import { bb } from '../../lib/bb.js';
import * as s from '../../lib/schema.js';
import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('text() infers selectors and model props', () => {
  let machine = bb.selectors(['#count'] as const)
    .model(s.object({
      name: s.string()
    }));

  type Type = typeof machine;
  type TextParams = Parameters<Type['text']>;

  expectTypeOf<TextParams[0]>().toMatchTypeOf<'#count'>();
  // @ts-expect-error
  expectTypeOf<TextParams[0]>().toMatchTypeOf<'another-string'>();

  expectTypeOf<TextParams[1]>().toMatchTypeOf<'name'>();
  // @ts-expect-error
  expectTypeOf<TextParams[1]>().toMatchTypeOf<'another-string'>();
});

