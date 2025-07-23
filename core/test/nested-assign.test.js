import { bb } from '../lib/bb.js';
import * as s from '../lib/schema.js';
import * as v from 'valibot';
import { h, render } from 'preact';

QUnit.module('BeepBoop Nested Assignment Tests');

QUnit.test('nested assignment works with simple nested objects', function(assert) {
  const machine = bb
    .model(s.object({
      user: s.object({
        name: s.string(),
        age: s.number()
      }),
      settings: s.object({
        theme: s.string()
      })
    }))
    .states(['setup', 'idle'])
    .immediate('setup', 'idle',
      bb.assign('user.name', () => 'John'),
      bb.assign('user.age', () => 30),
      bb.assign('settings.theme', () => 'dark')
    )
    .view(({ model }) => h('div', null, `${model.user.name}-${model.user.age}-${model.settings.theme}`));

  const Component = bb.view(machine);
  const container = document.createElement('div');
  
  render(h(Component, {}), container);
  
  // Give component time to process setup
  setTimeout(() => {
    assert.equal(container.textContent, 'John-30-dark', 'Nested assignments work correctly');
  }, 10);
});

QUnit.test('nested assignment works with deep nesting', function(assert) {
  const machine = bb
    .model(s.object({
      config: s.object({
        ui: s.object({
          colors: s.object({
            primary: s.string()
          })
        })
      })
    }))
    .states(['setup', 'idle'])
    .immediate('setup', 'idle',
      bb.assign('config.ui.colors.primary', () => 'blue')
    )
    .view(({ model }) => h('div', null, model.config.ui.colors.primary));

  const Component = bb.view(machine);
  const container = document.createElement('div');
  
  render(h(Component, {}), container);
  
  setTimeout(() => {
    assert.equal(container.textContent, 'blue', 'Deep nested assignment works');
  }, 10);
});

QUnit.test('nested assignment updates only the nested property', function(assert) {
  let initialUser = null;
  let updatedUser = null;
  
  const machine = bb
    .model(s.object({
      user: s.object({
        name: s.string(),
        age: s.number()
      })
    }))
    .states(['setup', 'idle'])
    .immediate('setup', 'idle',
      bb.assign('user.name', () => 'John'),
      bb.assign('user.age', () => 30)
    )
    .always('updateName', 
      bb.assign('user.name', ({ data }) => {
        initialUser = JSON.parse(JSON.stringify(machine.user)); // Deep clone for comparison
        return data.newName;
      })
    )
    .view(({ model, send }) => h('div', null, model.user.name));

  const Component = bb.view(machine);
  const container = document.createElement('div');
  
  render(h(Component, {}), container);
  
  setTimeout(() => {
    // Trigger update
    actor.send('updateName', { newName: 'Jane' });
    
    setTimeout(() => {
      assert.equal(container.textContent, 'Jane', 'Name was updated');
      // Note: The user object reference should be the same (mutation), 
      // but we can't easily test that in this context
    }, 10);
  }, 10);
});

QUnit.test('nested assignment with external schema library (Valibot)', function(assert) {
  const machine = bb
    .model(v.object({
      profile: v.object({
        personal: v.object({
          firstName: v.string(),
          lastName: v.string()
        }),
        preferences: v.object({
          theme: v.picklist(['light', 'dark'])
        })
      })
    }))
    .states(['setup', 'idle'])
    .immediate('setup', 'idle',
      bb.assign('profile.personal.firstName', () => 'Alice'),
      bb.assign('profile.personal.lastName', () => 'Smith'),
      bb.assign('profile.preferences.theme', () => 'light')
    )
    .view(({ model }) => 
      h('div', null, `${model.profile.personal.firstName} ${model.profile.personal.lastName} (${model.profile.preferences.theme})`)
    );

  const Component = bb.view(machine);
  const container = document.createElement('div');
  
  render(h(Component, {}), container);
  
  setTimeout(() => {
    assert.equal(container.textContent, 'Alice Smith (light)', 'Nested assignment works with Valibot schemas');
  }, 10);
});

QUnit.test('flat assignment still works alongside nested assignment', function(assert) {
  const machine = bb
    .model(s.object({
      name: s.string(),
      user: s.object({
        email: s.string()
      })
    }))
    .states(['setup', 'idle'])
    .immediate('setup', 'idle',
      bb.assign('name', () => 'App'),          // Flat assignment
      bb.assign('user.email', () => 'test@example.com')  // Nested assignment
    )
    .view(({ model }) => h('div', null, `${model.name}: ${model.user.email}`));

  const Component = bb.view(machine);
  const container = document.createElement('div');
  
  render(h(Component, {}), container);
  
  setTimeout(() => {
    assert.equal(container.textContent, 'App: test@example.com', 'Both flat and nested assignments work together');
  }, 10);
});

QUnit.test('nested assignment handles props correctly', function(assert) {
  const machine = bb
    .model(s.object({
      user: s.object({
        name: s.string(),
        settings: s.object({
          theme: s.string()
        })
      })
    }))
    .props(s.object({
      userName: s.string(),
      userTheme: s.string()
    }))
    .states(['setup', 'idle'])
    .immediate('setup', 'idle',
      bb.assign('user.name', () => 'Default'),
      bb.assign('user.settings.theme', () => 'light')
    )
    .always('props',
      bb.assign('user.name', ({ data }) => data.userName),
      bb.assign('user.settings.theme', ({ data }) => data.userTheme)
    )
    .view(({ model }) => h('div', null, `${model.user.name}:${model.user.settings.theme}`));

  const Component = bb.view(machine);
  const container = document.createElement('div');
  
  const props = { userName: 'PropsUser', userTheme: 'dark' };
  render(h(Component, props), container);
  
  setTimeout(() => {
    assert.equal(container.textContent, 'PropsUser:dark', 'Nested assignment works with props');
  }, 20);
});