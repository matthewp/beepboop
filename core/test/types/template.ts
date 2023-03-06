import { bb } from '../../lib/bb.js';
import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('template() infers selectors correctly', () => {
  let machine = bb.template(`
    <div class="counter">
      Count is <span id="count"></span>
      <button type="button" id="inc">Increment</button>
    </div>
  `);

  type Type = typeof machine;
  type TextParams = Parameters<Type['text']>;

  expectTypeOf<TextParams[0]>().toMatchTypeOf<'.counter' | '#count' | '#inc'>();

  // @ts-expect-error
  expectTypeOf<string>().toMatchTypeOf<TextParams[0]>();
});