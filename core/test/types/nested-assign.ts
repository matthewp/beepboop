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
      expectTypeOf(data).toEqualTypeOf<string>();
      return 'John';
    }),
    bb.assign('user.age', ({ data }) => {
      expectTypeOf(data).toEqualTypeOf<number>();
      return 30;
    }),
    bb.assign('user.profile.bio', ({ data }) => {
      expectTypeOf(data).toEqualTypeOf<string>();
      return 'Bio';
    }),
    bb.assign('settings.theme', ({ data }) => {
      expectTypeOf(data).toEqualTypeOf<string>();
      return 'dark';
    }),
    bb.assign('settings.notifications', ({ data }) => {
      expectTypeOf(data).toEqualTypeOf<boolean>();
      return true;
    }),
    
    // Top-level assignments should still work
    bb.assign('user', ({ data }) => {
      expectTypeOf(data).toEqualTypeOf<{ name: string; age: number; profile: { bio: string } }>();
      return { name: 'Alice', age: 25, profile: { bio: 'Alice bio' } };
    }),
    bb.assign('settings', ({ data }) => {
      expectTypeOf(data).toEqualTypeOf<{ theme: string; notifications: boolean }>();
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
      expectTypeOf(data).toEqualTypeOf<string>();
      return 'Jane';
    }),
    bb.assign('profile.personal.lastName', ({ data }) => {
      expectTypeOf(data).toEqualTypeOf<string>();
      return 'Doe';
    }),
    bb.assign('profile.preferences.theme', ({ data }) => {
      expectTypeOf(data).toEqualTypeOf<'light' | 'dark'>();
      return data;
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
    // @ts-expect-error - should return string, not number
    bb.assign('user.name', ({ data }) => 42),
    // @ts-expect-error - should return number, not string
    bb.assign('user.age', ({ data }) => 'thirty'),
    // @ts-expect-error - should return boolean, not string
    bb.assign('settings.notifications', ({ data }) => 'yes')
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
      expectTypeOf(data).toEqualTypeOf<string>();
      return 'BeepBoop';
    }),
    bb.assign('valibot.email', ({ data }) => {
      expectTypeOf(data).toEqualTypeOf<string>();
      return 'test@example.com';
    })
  );

export {};
