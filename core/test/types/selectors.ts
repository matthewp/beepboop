import { bb } from '../../lib/bb.js';
import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('on() infers selectors correctly', () => {
  let machine = bb.selectors(['#count'] as const);

  type Type = typeof machine;
  type OnParams = Parameters<Type['on']>;

  expectTypeOf<OnParams[0]>().toMatchTypeOf<'#count'>();
});