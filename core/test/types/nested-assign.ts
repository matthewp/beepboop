// TypeScript type checking tests for nested assignment
import { bb } from '../../lib/bb.js';
import * as s from '../../lib/schema.js';
import * as v from 'valibot';
import { expectTypeOf } from 'expect-type';

// Test nested paths with BeepBoop schemas
const nestedSchema = s.object({
  user: s.object({
    name: s.string(),
    age: s.number(),
    profile: s.object({
      bio: s.string()
    })
  }),
  settings: s.object({
    theme: s.string(),
    notifications: s.boolean()
  })
});

const machine1 = bb
  .model(nestedSchema)
  .states(['idle'])
  .always('test',
    // These should be valid assignments with correct types
    bb.assign('user.name', ({ data }) => {
      expectTypeOf<string>(data);
      return 'John';
    }),
    bb.assign('user.age', ({ data }) => {
      expectTypeOf<number>(data);
      return 30;
    }),
    bb.assign('user.profile.bio', ({ data }) => {
      expectTypeOf<string>(data);
      return 'Bio';
    }),
    bb.assign('settings.theme', ({ data }) => {
      expectTypeOf<string>(data);
      return 'dark';
    }),
    bb.assign('settings.notifications', ({ data }) => {
      expectTypeOf<boolean>(data);
      return true;
    }),
    
    // Top-level assignments should still work
    bb.assign('user', ({ data }) => {
      expectTypeOf<{ name: string; age: number; profile: { bio: string } }>(data);
      return { name: 'Alice', age: 25, profile: { bio: 'Alice bio' } };
    }),
    bb.assign('settings', ({ data }) => {
      expectTypeOf<{ theme: string; notifications: boolean }>(data);
      return { theme: 'light', notifications: false };
    })
  );

// Test with external schema library (Valibot)
const valibotSchema = v.object({
  profile: v.object({
    personal: v.object({
      firstName: v.string(),
      lastName: v.string()
    }),
    preferences: v.object({
      theme: v.picklist(['light', 'dark'])
    })
  })
});

const machine2 = bb
  .model(valibotSchema)
  .states(['idle'])
  .always('test',
    bb.assign('profile.personal.firstName', ({ data }) => {
      expectTypeOf<string>(data);
      return 'Jane';
    }),
    bb.assign('profile.personal.lastName', ({ data }) => {
      expectTypeOf<string>(data);
      return 'Doe';
    }),
    bb.assign('profile.preferences.theme', ({ data }) => {
      expectTypeOf<'light' | 'dark'>(data);
      return 'dark';
    })
  );

// Test error cases - these should cause TypeScript errors
const machine3 = bb
  .model(nestedSchema)
  .states(['idle'])
  .always('test',
    // @ts-expect-error - 'user.invalid' should not exist
    bb.assign('user.invalid', ({ data }) => 'error'),
    
    // @ts-expect-error - 'nonexistent.path' should not exist  
    bb.assign('nonexistent.path', ({ data }) => 'error'),
    
    // @ts-expect-error - 'user.name.extra' - name is string, not object
    bb.assign('user.name.extra', ({ data }) => 'error'),
    
    // @ts-expect-error - 'settings.theme.nested' - theme is string, not object
    bb.assign('settings.theme.nested', ({ data }) => 'error')
  );

// Test that return types are correctly inferred
const machine4 = bb
  .model(nestedSchema)
  .states(['idle'])
  .always('test',
    bb.assign('user.name', ({ data }) => {
      // @ts-expect-error - should return string, not number
      return 42;
    }),
    bb.assign('user.age', ({ data }) => {
      // @ts-expect-error - should return number, not string
      return 'thirty';
    }),
    bb.assign('settings.notifications', ({ data }) => {
      // @ts-expect-error - should return boolean, not string
      return 'yes';
    })
  );

// Test mixed schemas
const mixedSchema = s.object({
  beepboop: s.object({
    name: s.string()
  }),
  valibot: v.object({
    email: v.string()
  })
});

const machine5 = bb
  .model(mixedSchema)
  .states(['idle'])
  .always('test',
    bb.assign('beepboop.name', ({ data }) => {
      expectType<string>(data);
      return 'BeepBoop';
    }),
    bb.assign('valibot.email', ({ data }) => {
      expectType<string>(data);
      return 'test@example.com';
    })
  );

export {};
