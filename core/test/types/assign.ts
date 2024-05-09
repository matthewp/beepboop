import { bb } from '../../lib/bb.js';
//import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('assign() infers from model', () => {
  let machine = bb.model({
    name: bb.string(),
    age: bb.number(),
  });
  
  machine.assign('name', () => 'bar');
  // @ts-expect-error
  machine.assign('name', () => 22);

  machine.assign('age', () => 22);
  // @ts-expect-error
  machine.assign('age', () => 'some string');
});

test('assign() infers inside of immediate', () => {
  bb
    .model({
      name: bb.string()
    })
    .states(['one', 'two'] as const)
    .immediate('one', 'two',
      bb.assign('name', () => 'value')
    );

  bb
    .model({
      name: bb.string()
    })
    .states(['one', 'two'] as const)
    .immediate('one', 'two',
      // @ts-expect-error
      bb.assign('name', () => 22)
    );
});