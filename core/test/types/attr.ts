import { bb } from '../../lib/bb.js';
import * as s from '../../lib/schema.js';
import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('attr() infers selectors and model props', () => {
  let machine = bb.selectors(['#count'] as const)
    .model(s.object({
      name: s.string()
    }));

  type Type = typeof machine;
  type AttrParams = Parameters<Type['attr']>;

  expectTypeOf<AttrParams[0]>().toMatchTypeOf<'#count'>();
  // @ts-expect-error
  expectTypeOf<AttrParams[0]>().toMatchTypeOf<'another-string'>();

  expectTypeOf<AttrParams[2]>().toMatchTypeOf<'name'>();
  // @ts-expect-error
  expectTypeOf<AttrParams[1]>().toMatchTypeOf<'another-string'>();
});

