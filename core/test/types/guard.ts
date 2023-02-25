import { bb } from '../../lib/bb.js';
import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('guard() infers model props', () => {
  bb
    .selectors(['#count'] as const)
    .model({
      name: bb.string(),
    })
    .states(['one', 'two'] as const)
    .events('one', ['change'] as const)
    .transition('one', 'change', 'two',
      bb.guard(({ model }) => model.name === 'bar')
    )
});