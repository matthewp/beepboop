import { bb } from '../../lib/bb.js';
import * as s from '../../lib/schema.js';
import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('on() infers destination event and model prop', () => {
  let machine = bb
    .selectors(['#count'] as const)
    .model(s.object({
      name: s.string(),
    }))
    .states(['one', 'two'] as const)
    .events('one', ['change'] as const)

  machine.on('#count', 'click', 'change');

  // @ts-expect-error
  machine.on('#count', 'click', 'fake-event');
});