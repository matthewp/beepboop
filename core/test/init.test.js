import { bb } from '../lib/bb.js';
import * as s from '../lib/schema.js';

QUnit.module('init() method tests');

QUnit.test('init() method initializes model properties', function(assert) {
  const machine = bb
    .model(s.object({
      count: s.number(),
      name: s.string()
    }))
    .states(['idle'])
    .init(
      bb.assign('count', () => 42),
      bb.assign('name', () => 'initialized')
    );

  const actor = bb.actor(machine);
  actor.interpret();
  
  // Check that model was initialized correctly
  assert.equal(actor.service.context.model.count, 42, 'count was initialized');
  assert.equal(actor.service.context.model.name, 'initialized', 'name was initialized');
});

QUnit.test('init() method filters out guards', function(assert) {
  // This test ensures guards are ignored but doesn't cause errors
  const machine = bb
    .model(s.object({
      count: s.number()
    }))
    .states(['idle'])
    .init(
      bb.guard(() => true), // This should be filtered out
      bb.assign('count', () => 10),
    );

  const actor = bb.actor(machine);
  actor.interpret();
  
  // Should work despite the guard being present
  assert.equal(actor.service.context.model.count, 10, 'init worked with guard filtered out');
});

QUnit.test('init() method works without any arguments', function(assert) {
  const machine = bb
    .model(s.object({
      status: s.string()
    }))
    .states(['idle'])
    .init(); // Empty init

  const actor = bb.actor(machine);
  actor.interpret();
  
  // Should work fine with empty init
  assert.ok(actor.service, 'machine works with empty init');
});

QUnit.test('init() method runs before entering first state', function(assert) {
  let initRan = false;
  let stateEntered = false;
  
  const machine = bb
    .model(s.object({
      initialized: s.boolean()
    }))
    .states(['idle'])
    .events('idle', ['check'])
    .init(
      bb.assign('initialized', () => {
        initRan = true;
        return true;
      })
    )
    .transition('idle', 'check', 'idle', bb.assign('initialized', () => {
      stateEntered = true;
      return false;
    }));

  const actor = bb.actor(machine);
  actor.interpret();
  
  // Init should have run, but transition hasn't
  assert.ok(initRan, 'init ran during initialization');
  assert.notOk(stateEntered, 'state transition has not run yet');
  assert.ok(actor.service.context.model.initialized, 'model was initialized');
  
  // Now trigger the transition
  actor.send('check');
  assert.ok(stateEntered, 'state transition ran after send');
  assert.notOk(actor.service.context.model.initialized, 'model was updated by transition');
});
