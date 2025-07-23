import { bb } from '../lib/bb.js';
import * as s from '../lib/schema.js';
import * as v from 'valibot';
import { h, render } from 'preact';

QUnit.module('BeepBoop Props Tests');

QUnit.test('bb.props() method exists and is chainable', function(assert) {
  assert.ok(typeof bb.props === 'function', 'bb.props method exists');
  
  const machine = bb
    .props(s.object({ name: s.string() }))
    .states(['idle']);
  
  assert.ok(machine, 'props method returns a builder');
  assert.ok(typeof machine.view === 'function', 'returned builder has view method');
});

QUnit.test('props schema is stored in builder', function(assert) {
  const propsSchema = s.object({ 
    userId: s.string(),
    theme: s.string()
  });
  
  const machine = bb
    .props(propsSchema)
    .states(['idle']);
  
  assert.equal(machine.propsSchema, propsSchema, 'props schema is stored correctly');
});

QUnit.test('props validation works with valid props', function(assert) {
  const machine = bb
    .props(s.object({ 
      name: s.string(),
      count: s.number()
    }))
    .states(['idle'])
    .view(() => h('div', null, 'Test'));

  const actor = bb.actor(machine);
  const Component = actor.view();
  
  // Create a temporary container for rendering
  const container = document.createElement('div');
  
  try {
    const validProps = { name: 'John', count: 42 };
    render(h(Component, validProps), container);
    assert.ok(true, 'Valid props render without throwing validation error');
    assert.equal(container.textContent, 'Test', 'Component renders correctly');
  } catch (error) {
    assert.ok(false, `Unexpected error: ${error.message}`);
  }
});

QUnit.test('props validation throws with invalid props', function(assert) {
  const machine = bb
    .props(s.object({ 
      name: s.string(),
      count: s.number()
    }))
    .states(['idle'])
    .view(() => h('div', null, 'Test'));

  const actor = bb.actor(machine);
  const Component = actor.view();
  
  const container = document.createElement('div');
  
  assert.throws(() => {
    const invalidProps = { name: 123, count: 'not a number' };
    render(h(Component, invalidProps), container);
  }, /Props validation failed/, 'Invalid props throw validation error');
});

QUnit.test('props validation with external schema library (Valibot)', function(assert) {
  const machine = bb
    .props(v.object({ 
      email: v.pipe(v.string(), v.email()),
      age: v.pipe(v.number(), v.minValue(18))
    }))
    .states(['idle'])
    .view(() => h('div', null, 'Test'));

  const actor = bb.actor(machine);
  const Component = actor.view();
  
  const container1 = document.createElement('div');
  const container2 = document.createElement('div');
  
  // Valid props
  try {
    const validProps = { email: 'john@example.com', age: 25 };
    render(h(Component, validProps), container1);
    assert.ok(true, 'Valid Valibot props do not throw');
    assert.equal(container1.textContent, 'Test', 'Component renders correctly with valid Valibot props');
  } catch (error) {
    assert.ok(false, `Unexpected error with valid props: ${error.message}`);
  }
  
  // Invalid props
  assert.throws(() => {
    const invalidProps = { email: 'invalid-email', age: 16 };
    render(h(Component, invalidProps), container2);
  }, /Props validation failed/, 'Invalid Valibot props throw validation error');
});

QUnit.test('no props schema means no validation', function(assert) {
  const machine = bb
    .states(['idle'])
    .view(() => h('div', null, 'NoValidation'));

  const actor = bb.actor(machine);
  const Component = actor.view();
  
  const container = document.createElement('div');
  
  // Any props should work without validation
  try {
    const anyProps = { anything: 'goes', here: 123, even: { nested: 'objects' } };
    render(h(Component, anyProps), container);
    assert.ok(true, 'Any props work when no schema defined');
    assert.equal(container.textContent, 'NoValidation', 'Component renders correctly without props schema');
  } catch (error) {
    assert.ok(false, `Unexpected error: ${error.message}`);
  }
});

QUnit.test('props are passed to always transitions correctly', function(assert) {
  let receivedData = null;
  let done = assert.async();
  
  const machine = bb
    .model(s.object({ name: s.string() }))
    .props(s.object({ userName: s.string() }))
    .states(['setup', 'idle'])
    .immediate('setup', 'idle', bb.assign('name', () => 'initial'))
    .always('props', bb.assign('name', ({ data }) => {
      receivedData = data;
      return data.userName;
    }))
    .view(({ model }) => h('div', null, model.name));

  const actor = bb.actor(machine);
  const Component = actor.view();
  
  const container = document.createElement('div');
  const props = { userName: 'TestUser' };
  
  render(h(Component, props), container);
  
  // Give the component time to process the props event
  setTimeout(() => {
    assert.ok(receivedData, 'Props data was received in always transition');
    assert.equal(receivedData.userName, 'TestUser', 'Props data has correct value');
    assert.equal(container.textContent, 'TestUser', 'Component displays updated model value from props');
    done();
  }, 10);
});
