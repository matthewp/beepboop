import { bb } from '../../lib/bb.js';
import * as s from '../../lib/schema.js';
import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('guard() infers model props', () => {
  bb
    .selectors(['#count'] as const)
    .model(s.object({
      name: s.string(),
    }))
    .states(['one', 'two'] as const)
    .events('one', ['change'] as const)
    .transition('one', 'change', 'two',
      bb.guard(({ model }) => model.name === 'bar')
    )
});