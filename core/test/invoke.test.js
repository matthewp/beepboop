import { bb } from '../lib/bb.js';
import { interpret } from 'robot3';

QUnit.module('BeepBoop Invoke Tests');

QUnit.test('invoke method exists', function(assert) {
  assert.ok(typeof bb.invoke === 'function', 'bb.invoke method exists');
});

QUnit.test('invoke method can be chained', function(assert) {
  const mockFn = async () => 'test';
  
  const machine = bb
    .model({ data: bb.string('') })
    .states(['idle', 'loading'])
    .invoke('loading', mockFn);
  
  assert.ok(machine, 'invoke method returns a builder');
  assert.ok(typeof machine.view === 'function', 'returned builder has view method');
});

QUnit.test('invoke state configuration is stored', function(assert) {
  const mockFn = async () => 'test';
  
  const machine = bb
    .model({ data: bb.string('') })
    .states(['idle', 'loading'])
    .invoke('loading', mockFn);
  
  // Check that the invoke function was stored in the state descriptor
  assert.ok(machine.states.loading, 'loading state exists');
  assert.equal(typeof machine.states.loading.invoke, 'function', 'invoke is a function');
  assert.equal(machine.states.loading.invoke, mockFn, 'correct function stored');
});

QUnit.test('invoke replaces previous invoke on same state', function(assert) {
  const mockFn1 = async () => 'test1';
  const mockFn2 = async () => 'test2';
  
  const machine = bb
    .model({ data: bb.string('') })
    .states(['idle', 'loading'])
    .invoke('loading', mockFn1)
    .invoke('loading', mockFn2);
  
  assert.equal(machine.states.loading.invoke, mockFn2, 'second function replaces first');
  assert.notEqual(machine.states.loading.invoke, mockFn1, 'first function was replaced');
});

QUnit.test('invoke works with complete machine definition', async function(assert) {
  assert.expect(2);
  
  const testData = { id: 1, name: 'Test User' };
  const mockFetch = async (event) => {
    assert.ok(event.model, 'async function receives event with model');
    return testData;
  };
  
  const machine = bb
    .model({ 
      data: bb.type(),
      loading: bb.boolean(false)
    })
    .states(['idle', 'loading', 'success'])
    .events('idle', ['fetch'])
    .events('loading', ['done'])
    .transition('idle', 'fetch', 'loading')
    .invoke('loading', mockFetch)
    .transition('loading', 'done', 'success', 
      bb.assign('data', ({ data }) => data)
    );
  
  // Create actor to test the machine builds successfully
  const actor = bb.actor(machine);
  assert.ok(actor, 'machine with invoke builds successfully');

  actor.interpret().send('fetch');
});
