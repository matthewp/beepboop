// TypeScript type checking tests for nested assignment
import { bb } from '../../lib/bb.js';
import * as s from '../../lib/schema.js';
import * as v from 'valibot';
import { expectTypeOf } from 'expect-type';

// Test nested paths with BeepBoop schemas
const nestedSchema = s.object({
  title: s.string(),
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
  .events('idle', ['test'])
  .always('test',
    bb.assign('title', ({ model }) => {
      expectTypeOf(model.title).toEqualTypeOf<string>();
      return 'App';
    }),
    // These should be valid assignments with correct types
    bb.assign('user.name', ({ model }) => {
      expectTypeOf(model.user.name).toEqualTypeOf<string>();
      return 'John';
    }),
    bb.assign('user.age', ({ model }) => {
      expectTypeOf(model.user.age).toEqualTypeOf<number>();
      return 30;
    }),
    bb.assign('user.profile.bio', ({ model }) => {
      expectTypeOf(model.user.profile.bio).toEqualTypeOf<string>();
      return 'Bio';
    }),
    bb.assign('settings.theme', ({ model }) => {
      expectTypeOf(model.settings.theme).toEqualTypeOf<string>();
      return 'dark';
    }),
    bb.assign('settings.notifications', ({ model }) => {
      expectTypeOf(model.settings.notifications).toEqualTypeOf<boolean>();
      return true;
    }),
    
    // Top-level assignments should still work
    bb.assign('user', ({ model }) => {
      expectTypeOf(model.user).toEqualTypeOf<{ name: string; age: number; profile: { bio: string } }>();
      return { name: 'Alice', age: 25, profile: { bio: 'Alice bio' } };
    }),
    bb.assign('settings', ({ model }) => {
      expectTypeOf(model.settings).toEqualTypeOf<{ theme: string; notifications: boolean }>();
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
    bb.assign('profile.personal.firstName', ({ model }) => {
      expectTypeOf(model.profile.personal.firstName).toEqualTypeOf<string>();
      return 'Jane';
    }),
    bb.assign('profile.personal.lastName', ({ model }) => {
      expectTypeOf(model.profile.personal.lastName).toEqualTypeOf<string>();
      return 'Doe';
    }),
    bb.assign('profile.preferences.theme', ({ model }) => {
      expectTypeOf(model.profile.preferences.theme).toEqualTypeOf<'light' | 'dark'>();
      return 'light' as const;
    })
  );

// Test error cases - these should cause TypeScript errors
const machine3 = bb
  .model(nestedSchema)
  .states(['idle'])
  .always('test',
    // @ts-expect-error - 'user.invalid' should not exist
    bb.assign('user.invalid', ({ model }) => 'error'),
    
    // @ts-expect-error - 'nonexistent.path' should not exist  
    bb.assign('nonexistent.path', ({ model }) => 'error'),
    
    // @ts-expect-error - 'user.name.extra' - name is string, not object
    bb.assign('user.name.extra', ({ model }) => 'error'),
    
    // @ts-expect-error - 'settings.theme.nested' - theme is string, not object
    bb.assign('settings.theme.nested', ({ model }) => 'error')
  );

// Test that return types are correctly inferred
const machine4 = bb
  .model(nestedSchema)
  .states(['idle'])
  .always('test',
    // @ts-expect-error - should return string, not number
    bb.assign('user.name', ({ model }) => 42),
    // @ts-expect-error - should return number, not string
    bb.assign('user.age', ({ model }) => 'thirty'),
    // @ts-expect-error - should return boolean, not string
    bb.assign('settings.notifications', ({ model }) => 'yes')
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
    bb.assign('beepboop.name', ({ model }) => {
      expectTypeOf(model.beepboop.name).toEqualTypeOf<string>();
      return 'BeepBoop';
    }),
    bb.assign('valibot.email', ({ model }) => {
      expectTypeOf(model.valibot.email).toEqualTypeOf<string>();
      return 'test@example.com';
    })
  );

// Test .props() with 'props' event - should use data parameter
const propsSchema = s.object({
  title: s.string(),
  count: s.number(),
  user: s.object({
    name: s.string(),
    email: s.string()
  })
});

const machineWithProps = bb
  .model(s.object({ internalState: s.string() }))
  .props(propsSchema)
  .states(['idle'])
  .events('idle', ['props'])
  .always('props',
    bb.assign('internalState', ({ data }) => {
      // For 'props' event, data should have the props type
      expectTypeOf(data).toEqualTypeOf<{ title: string; count: number; user: { name: string; email: string } }>();
      expectTypeOf(data.title).toEqualTypeOf<string>();
      expectTypeOf(data.user.name).toEqualTypeOf<string>();
      return data.title;
    })
  );

export {};
