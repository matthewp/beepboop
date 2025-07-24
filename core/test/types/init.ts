import { bb } from '../../lib/bb.js';
import * as s from '../../lib/schema.js';

// Test that init() accepts the same types as transition() extras (except guards)
const machine = bb
  .model(s.object({
    count: s.number(),
    name: s.string(),
    user: s.object({
      profile: s.object({
        age: s.number()
      })
    })
  }))
  .states(['idle'])
  .init(
    // Should accept bb.assign()
    bb.assign('count', () => 42),
    bb.assign('name', () => 'test'),
    // Should accept nested property assignment
    bb.assign('user.profile.age', () => 25),
    // Should accept custom reduce functions
    bb.reduce(() => ({ count: 10, name: 'reduced', user: { profile: { age: 30 } } }))
    // Guards should be filtered out but not cause type errors if passed
  );

// Test that init() returns the same builder type
const builder2 = machine.init(bb.assign('count', () => 100));

// Test chaining still works after init()
const finalMachine = builder2
  .events('idle', ['increment'])
  .transition('idle', 'increment', 'idle', bb.assign('count', (ev) => ev.model.count + 1))
  .view(({ model }) => model.count);

// Type should be inferred correctly
const actor = bb.actor(finalMachine);
