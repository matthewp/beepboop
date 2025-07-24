import { bb } from '../../lib/bb.js';
import * as s from '../../lib/schema.js';
//import { expectTypeOf } from 'expect-type';
import { test } from 'node:test';

test('assign() infers from model', () => {
  let machine = bb.model(s.object({
    name: s.string(),
    age: s.number(),
  }));
  
  machine.assign('name', () => 'bar');
  // @ts-expect-error
  machine.assign('name', () => 22);

  machine.assign('age', () => 22);
  // @ts-expect-error
  machine.assign('age', () => 'some string');
});

test('assign() infers inside of immediate', () => {
  bb
    .model(s.object({
      name: s.string()
    }))
    .states(['one', 'two'] as const)
    .immediate('one', 'two',
      bb.assign('name', () => 'value')
    );

  bb
    .model(s.object({
      name: s.string()
    }))
    .states(['one', 'two'] as const)
    .immediate('one', 'two',
      // @ts-expect-error
      bb.assign('name', () => 22)
    );
});