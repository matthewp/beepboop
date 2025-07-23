import { bb } from '../lib/bb.js';
import * as s from '../lib/schema.js'; // Import schema functions
import * as v from 'valibot';

QUnit.module('Standard Schema Integration Tests');

QUnit.test('BeepBoop schemas are Standard Schema compliant', function(assert) {
  const stringSchema = s.string();
  const numberSchema = s.number();
  const booleanSchema = s.boolean();
  
  // Check they have the ~standard property
  assert.ok(stringSchema['~standard'], 'string schema has ~standard property');
  assert.ok(numberSchema['~standard'], 'number schema has ~standard property');
  assert.ok(booleanSchema['~standard'], 'boolean schema has ~standard property');
  
  // Check Standard Schema properties
  assert.equal(stringSchema['~standard'].version, 1, 'string schema has correct version');
  assert.equal(stringSchema['~standard'].vendor, 'beepboop', 'string schema has correct vendor');
  assert.equal(typeof stringSchema['~standard'].validate, 'function', 'string schema has validate function');
});

QUnit.test('BeepBoop schemas validate correctly', function(assert) {
  const stringSchema = s.string();
  const numberSchema = s.number();
  const booleanSchema = s.boolean();
  
  // Test string validation
  const stringResult1 = stringSchema['~standard'].validate('hello');
  const stringResult2 = stringSchema['~standard'].validate(123);
  
  assert.deepEqual(stringResult1, { value: 'hello' }, 'string validates correctly');
  assert.ok('issues' in stringResult2, 'string rejects non-string');
  
  // Test number validation
  const numberResult1 = numberSchema['~standard'].validate(42);
  const numberResult2 = numberSchema['~standard'].validate('not a number');
  
  assert.deepEqual(numberResult1, { value: 42 }, 'number validates correctly');
  assert.ok('issues' in numberResult2, 'number rejects non-number');
  
  // Test boolean validation
  const booleanResult1 = booleanSchema['~standard'].validate(true);
  const booleanResult2 = booleanSchema['~standard'].validate('not a boolean');
  
  assert.deepEqual(booleanResult1, { value: true }, 'boolean validates correctly');
  assert.ok('issues' in booleanResult2, 'boolean rejects non-boolean');
});

QUnit.test('BeepBoop object schema works', function(assert) {
  const objectSchema = s.object({
    name: s.string(),
    age: s.number(),
    active: s.boolean()
  });
  
  assert.ok(objectSchema['~standard'], 'object schema has ~standard property');
  
  // Test valid object
  const validResult = objectSchema['~standard'].validate({
    name: 'John',
    age: 30,
    active: true
  });
  
  assert.ok('value' in validResult, 'valid object passes validation');
  assert.deepEqual(validResult.value, {
    name: 'John',
    age: 30,
    active: true
  }, 'valid object returns correct value');
  
  // Test invalid object
  const invalidResult = objectSchema['~standard'].validate({
    name: 123, // Wrong type
    age: 'thirty', // Wrong type
    active: true
  });
  
  assert.ok('issues' in invalidResult, 'invalid object fails validation');
  assert.equal(invalidResult.issues.length, 2, 'reports 2 validation issues');
});

QUnit.test('Valibot schemas work with bb.model()', function(assert) {
  const valibotSchema = v.object({
    username: v.string(),
    score: v.number()
  });
  
  // This should not throw - bb.model accepts any Standard Schema
  const machine = bb
    .model(valibotSchema)
    .states(['idle']);
  
  assert.ok(machine, 'machine created with Valibot schema');
  assert.ok(typeof machine.view === 'function', 'machine has view method');
});

QUnit.test('Mixed BeepBoop and Valibot schemas work', function(assert) {
  const mixedSchema = s.object({
    name: s.string(),        // BeepBoop schema
    age: v.number(),          // Valibot schema
    active: s.boolean()      // BeepBoop schema
  });
  
  // Test validation works with mixed schemas
  const result = mixedSchema['~standard'].validate({
    name: 'Alice',
    age: 25,
    active: false
  });
  
  assert.ok('value' in result, 'mixed schema validates successfully');
  assert.deepEqual(result.value, {
    name: 'Alice',
    age: 25,
    active: false
  }, 'mixed schema returns correct value');
});

QUnit.test('s.array() schema works', function(assert) {
  const arraySchema = s.array(s.string());
  
  assert.ok(arraySchema['~standard'], 'array schema has ~standard property');
  
  // Test valid array
  const validResult = arraySchema['~standard'].validate(['hello', 'world']);
  assert.ok('value' in validResult, 'valid array passes validation');
  assert.deepEqual(validResult.value, ['hello', 'world'], 'valid array returns correct value');
  
  // Test invalid array (wrong element type)
  const invalidResult = arraySchema['~standard'].validate(['hello', 123]);
  assert.ok('issues' in invalidResult, 'invalid array fails validation');
  
  // Test array without element schema
  const anyArraySchema = s.array();
  const anyArrayResult = anyArraySchema['~standard'].validate([1, 'two', true]);
  assert.ok('value' in anyArrayResult, 'array without element schema accepts anything');
});