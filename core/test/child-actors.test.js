import { bb } from '../lib/bb.js';
import * as s from '../lib/schema.js';

QUnit.module('Child Actors');

QUnit.test('can create child actor and send events to it', function(assert) {
  // Child machine
  const childMachine = bb
    .model(s.object({
      count: s.number()
    }))
    .states(['idle'])
    .events('idle', ['increment'])
    .transition('idle', 'increment', 'idle', 
      bb.assign('count', ({ model }) => model.count + 1)
    )
    .init(
      bb.assign('count', () => 0)
    );

  // Parent machine with child actor
  const parentMachine = bb
    .model(s.object({
      child: s.type() // For now, use generic type until we have proper Actor validation
    }))
    .states(['idle'])
    .init(
      bb.assign('child', () => bb.actor(childMachine))
    );

  const parentActor = bb.actor(parentMachine);
  parentActor.interpret();

  // Verify child was created
  const childActor = parentActor.service.context.model.child;
  assert.ok(childActor, 'Child actor should be created');
  assert.ok(typeof childActor.send === 'function', 'Child actor should have send method');

  // Start child interpreter
  childActor.interpret();

  // Check initial child state
  assert.equal(childActor.service.context.model.count, 0, 'Child should start with count 0');

  // Send event to child from parent context
  childActor.send('increment');

  // Verify child state updated
  assert.equal(childActor.service.context.model.count, 1, 'Child count should increment to 1');
});