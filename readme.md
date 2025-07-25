# beepboop

A framework built on Finite State Machines for building reactive web applications.

## Overview

beepboop combines the power of state machines with reactive UI components, providing a structured approach to managing application state and UI updates. Built on top of [Robot](https://thisrobot.life/) for state machine logic and [Preact](https://preactjs.com/) for efficient rendering.

## Installation

```bash
npm install @matthewp/beepboop
```

## Core Concepts

### 1. Models
Define your application state using Standard Schema-compliant validation libraries. BeepBoop accepts any Standard Schema library like [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), or [ArkType](https://arktype.io/):

```typescript
import * as v from 'valibot';

bb.model(v.object({
  count: v.number(),    // number type
  name: v.string(),     // string type
  isDark: v.boolean()   // boolean type
}))
```

For basic types, BeepBoop provides minimal schema types:

```typescript
import * as s from '@matthewp/beepboop/schema';

bb.model(s.object({
  count: s.number(),    // basic number type
  name: s.string(),     // basic string type
  isDark: s.boolean()   // basic boolean type
}))
```

Models start empty and are populated using immediate transitions from a setup state.

### 2. Initialization

Use `.init()` to initialize your model properties when the machine starts:

```typescript
bb.model(v.object({
  count: v.number(),
  user: v.object({
    name: v.string(),
    profile: v.object({
      age: v.number()
    })
  })
}))
.init(
  bb.assign('count', () => 0),
  bb.assign('user.name', () => 'Anonymous'),
  bb.assign('user.profile.age', () => 18)
)
```

The `.init()` method accepts the same action types as transitions (`bb.assign()`, custom reducers, etc.) but ignores guards since initialization should always happen. Init effects run during the hidden initial state transition before entering your first state.

### 3. States
Define the possible states your machine can be in:

```typescript
.states(['idle', 'loading', 'success', 'error'])
```

### 4. Events
Define events that can trigger state transitions:

```typescript
.events('idle', ['load', 'reset'])
```

### 5. Transitions
Define how your machine moves between states:

```typescript
.transition('idle', 'load', 'loading')
```

### 6. Guards
Add conditions to transitions:

```typescript
.transition(
  'idle',
  'decrement',
  'decrementing',
  bb.guard(({ model }) => model.count > 0)
)
```

### 7. Actions
Update your model or perform side effects:

```typescript
.immediate(
  'incrementing',
  'idle',
  bb.assign('count', ({ model }) => model.count + 1)
)
```

### 8. Props
Define and validate props passed to your components:

```typescript
import * as v from 'valibot';

bb.props(v.object({
  userId: v.string(),
  theme: v.pipe(v.string(), v.picklist(['light', 'dark'])),
  isAdmin: v.boolean()
}))
```

Props are automatically validated and can be handled with always transitions:

```typescript
.always('props', bb.assign('userId', ({ data }) => data.userId))
```

### 8. Always Transitions
Handle events that can occur in any state without transitioning:

```typescript
.always('props', bb.assign('connected', ({ data }) => data.connected))
```

### 9. Views
Render UI based on current state and model:

```typescript
.view(({ model, send }) => {
  return (
    <div>
      <span>Count: {model.count}</span>
      <button onClick={() => send('increment')}>+</button>
    </div>
  );
})
```

## Quick Example

Here's a simple counter application using Valibot for validation:

```typescript
import { bb } from '@matthewp/beepboop';
import * as v from 'valibot';

const counterMachine = bb
  .model(v.object({
    count: v.number()
  }))
  .states(['setup', 'idle', 'increment', 'decrement'])
  .immediate('setup', 'idle', bb.assign('count', () => 0))
  .events('idle', ['increment', 'decrement'])
  .transition('idle', 'increment', 'increment')
  .transition(
    'idle',
    'decrement', 
    'decrement',
    bb.guard(({ model }) => model.count > 0)
  )
  .immediate(
    'increment',
    'idle',
    bb.assign('count', ({ model }) => model.count + 1)
  )
  .immediate(
    'decrement',
    'idle',
    bb.assign('count', ({ model }) => model.count - 1)
  )
  .view(({ model, send }) => {
    return (
      <>
        <h2>Counter: {model.count}</h2>
        <button onClick={() => send('increment')}>+</button>
        <button 
          onClick={() => send('decrement')}
          disabled={model.count <= 0}
        >
          -
        </button>
      </>
    );
  });

// Create an actor and mount to DOM
const actor = bb.actor(counterMachine);
actor.mount(document.querySelector('#app'));
```

## Advanced Usage

### Composing Multiple Machines

You can compose multiple machines together by creating view components from each machine:

```typescript
// counter.tsx - Export view component directly
const machine = bb./* machine definition */.view(/* view function */);
export default bb.view(machine);

// profile.tsx - Export view component directly  
const machine = bb./* machine definition */.view(/* view function */);
export default bb.view(machine);

// main.tsx - Import and use components directly
import Counter from './counter';
import Profile from './profile';
import DarkMode from './darkmode';

const appMachine = bb
  .states(['idle'])
  .view(() => {
    return (
      <>
        <DarkMode />
        <Counter />
        <Profile />
      </>
    );
  });

bb.actor(appMachine).mount(document.querySelector('main'));
```

## API Reference

### `bb`
The main entry point for creating state machines. This is the starting point for building your application logic.

```typescript
import { bb } from '@matthewp/beepboop';

const machine = bb.model({ /* ... */ });
```

### `bb.model(schema)`
Define the shape of your application state using any Standard Schema-compliant validation library. BeepBoop requires object schemas.

## Recommended Validation Libraries

We recommend using robust validation libraries for production applications:

### [Valibot](https://valibot.dev/) (Recommended)
A modular and type-safe schema library:

```typescript
import * as v from 'valibot';

bb.model(v.object({
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.minValue(18)),
  role: v.picklist(['admin', 'user', 'guest'])
}))
```

### [Zod](https://zod.dev/)
The most popular TypeScript-first schema validation library:

```typescript
import { z } from 'zod';

bb.model(z.object({
  email: z.string().email(),
  age: z.number().min(18),
  role: z.enum(['admin', 'user', 'guest'])
}))
```

### [ArkType](https://arktype.io/)
Runtime validation with TypeScript syntax:

```typescript
import { type } from 'arktype';

bb.model(type({
  email: 'string>5',
  age: 'number>=18',
  role: "'admin'|'user'|'guest'"
}))
```

### Mixing Libraries
You can mix different Standard Schema libraries:

```typescript
import * as v from 'valibot';
import { z } from 'zod';

bb.model(v.object({
  name: v.string(),                    // Valibot
  email: z.string().email(),           // Zod  
  age: v.pipe(v.number(), v.minValue(18)) // Valibot with validation
}))
```

## Basic Schema Types

For simple use cases, BeepBoop provides minimal schema types:

```typescript
import * as s from '@matthewp/beepboop/schema';
```

### `s.string()`, `s.number()`, `s.boolean()`, `s.type()`
Basic primitive types without validation:

```typescript
bb.model(s.object({
  name: s.string(),      // Basic string
  count: s.number(),     // Basic number  
  active: s.boolean(),   // Basic boolean
  data: s.type()         // Any type
}))
```

### `s.object(properties)` and `s.array(elementSchema?)`
Basic composite types:

```typescript
bb.model(s.object({
  user: s.object({
    name: s.string(),
    age: s.number()
  }),
  tags: s.array(s.string()),
  items: s.array() // Array of any type
}))
```

**Note:** BeepBoop's built-in schema types are minimal and provide only basic type checking. For validation, transformations, and robust type safety, use external libraries like Valibot, Zod, or ArkType.

### `bb.props(schema)`
Define and validate props passed to your components using any Standard Schema-compliant validation library. Props are automatically validated when the component mounts and updates.

```typescript
import * as v from 'valibot';

bb.props(v.object({
  userId: v.string(),
  theme: v.pipe(v.string(), v.picklist(['light', 'dark'])),
  isAdmin: v.boolean(),
  settings: v.object({
    notifications: v.boolean(),
    language: v.string()
  })
}))
```

**Key Features:**
- **Automatic validation**: Props are validated on component mount and updates
- **Error handling**: Invalid props throw descriptive validation errors  
- **Type safety**: TypeScript provides proper typing for props in event handlers
- **Standard Schema support**: Works with any Standard Schema library (Valibot, Zod, ArkType)
- **Optional**: If no props schema is defined, props remain unvalidated (`any` type)

**Handling Props in State Machines:**
Props are passed through the special `'props'` event and are typically handled with always transitions:

```typescript
bb.props(v.object({
  userId: v.string(),
  theme: v.string()
}))
.always('props', 
  bb.assign('userId', ({ data }) => data.userId),    // data.userId is typed as string
  bb.assign('theme', ({ data }) => data.theme)       // data.theme is typed as string  
)
```

**Usage with Components:**
```typescript
const UserProfile = bb.view(machine);

// Valid props - renders successfully
render(h(UserProfile, { 
  userId: '123', 
  theme: 'dark',
  isAdmin: true,
  settings: { notifications: true, language: 'en' }
}), container);

// Invalid props - throws validation error
render(h(UserProfile, { 
  userId: 123,        // Error: Expected string, got number
  theme: 'purple',    // Error: Expected 'light' or 'dark'
  isAdmin: 'yes'      // Error: Expected boolean, got string
}), container);
```

### `.states(stateArray)`
Define all possible states your machine can be in. States represent different modes or phases of your application.

```typescript
.states(['idle', 'loading', 'success', 'error'])
```

### `.events(state, eventArray)`
Define which events can be triggered when the machine is in a specific state. This creates a clear contract of what actions are available in each state.

```typescript
.states(['idle', 'loading', 'success'])
.events('idle', ['fetch'])
.events('loading', ['cancel'])
.events('success', ['reset', 'fetch'])
```

### `.transition(fromState, event, toState, ...actions)`
Define how your machine moves from one state to another in response to an event. You can optionally include guards and actions.

```typescript
// Simple transition
.transition('idle', 'submit', 'processing')

// Transition with guard
.transition('idle', 'delete', 'deleting',
  bb.guard(({ model }) => model.items.length > 0)
)

// Transition with action
.transition('idle', 'increment', 'idle',
  bb.assign('count', ({ model }) => model.count + 1)
)
```

### `.immediate(fromState, toState, ...actions)`
Define a transition that happens automatically without waiting for an event. Useful for intermediate states that perform actions and immediately move to another state.

```typescript
.immediate('validating', 'success',
  bb.assign('isValid', () => true)
)

// With a guard to conditionally transition
.immediate('checking', 'error',
  bb.guard(({ model }) => !model.isValid)
)
```

### `.invoke(state, asyncFunction)`
Define an async function that runs when entering a state. The function receives the event context and can return a promise. When the promise resolves, a 'done' event is automatically sent with the result. If the promise rejects, an 'error' event is sent.

```typescript
.invoke('loading', async ({ model }) => {
  const response = await fetch(`/api/users/${model.userId}`);
  return response.json();
})
.transition('loading', 'done', 'success', 
  bb.assign('user', ({ data }) => data)
)
.transition('loading', 'error', 'error',
  bb.assign('errorMessage', ({ data }) => data.message)
)
```

### `.always(event, ...actions)`
Define an event that can be handled in any state without transitioning. The machine stays in the current state and runs the provided actions.

```typescript
// Handle props updates in any state
.always('props', bb.assign('connected', ({ domEvent }) => domEvent.detail.connected))

// Handle multiple always events
.always('increment', bb.assign('count', ({ model }) => model.count + 1))
.always('reset', bb.assign('count', () => 0))
```

### `.init(...actions)`
Define initialization actions that run once when the machine starts. Use this for setting up external resources like event listeners, timers, or WebSocket connections, as well as initializing model properties.

```typescript
// Setup external event listeners
.init(
  bb.action((event) => {
    const onOnline = () => event.send('connect');
    const onOffline = () => event.send('disconnect');
    
    addEventListener('online', onOnline);
    addEventListener('offline', onOffline);
    
    // Return cleanup function
    return () => {
      removeEventListener('online', onOnline);
      removeEventListener('offline', onOffline);
    };
  })
)

// Setup timers
.init(
  bb.action((event) => {
    const interval = setInterval(() => event.send('tick'), 1000);
    return () => clearInterval(interval);
  })
)

// Initialize model properties
.init(
  bb.assign('count', () => 0),
  bb.assign('user', () => ({ name: '', email: '' }))
)
```

### `bb.guard(predicateFn)`
Create a condition that must be true for a transition to occur. The predicate function receives an event object with access to the model and other context.

```typescript
bb.guard(({ model }) => model.age >= 18)

// Can access the full event object
bb.guard(({ model, domEvent, state }) => {
  return model.count > 0 && state === 'idle';
})
```

### `bb.assign(property, updateFn)`
Create an action that updates a specific property in your model. The update function receives the event object and should return the new value.

```typescript
// Update based on current model value
bb.assign('count', ({ model }) => model.count + 1)

// Update based on DOM event
bb.assign('name', ({ domEvent }) => 
  (domEvent.target as HTMLInputElement).value
)

// Update based on multiple factors
bb.assign('message', ({ model, state }) => 
  `Count is ${model.count} in ${state} state`
)
```

#### Nested Property Assignment
BeepBoop supports assigning to nested properties using dot notation. This provides type-safe access to deeply nested model data:

```typescript
import * as v from 'valibot';

const machine = bb
  .model(v.object({
    user: v.object({
      name: v.string(),
      profile: v.object({
        bio: v.string(),
        settings: v.object({
          theme: v.picklist(['light', 'dark'])
        })
      })
    })
  }))
  .states(['idle'])
  .always('updateUser',
    // Update nested properties with full type safety
    bb.assign('user.name', ({ data }) => data.name),
    bb.assign('user.profile.bio', ({ data }) => data.bio),
    bb.assign('user.profile.settings.theme', ({ data }) => data.theme)
  );
```

**Key Features:**
- **Type Safety**: TypeScript will error if you try to assign to invalid paths like `'user.nonexistent'`
- **Auto-completion**: Your editor will provide intelligent suggestions for available nested paths
- **Runtime Efficiency**: Only the specific nested property is mutated, not the entire object tree
- **Standard Schema Support**: Works with any Standard Schema library (Valibot, Zod, ArkType, etc.)

**Valid Assignment Patterns:**
```typescript
bb.assign('user', ({ data }) => data.user)              // Assign entire object
bb.assign('user.name', ({ data }) => data.name)         // Assign nested property
bb.assign('user.profile.bio', ({ data }) => data.bio)   // Assign deeply nested property

// TypeScript will catch invalid paths at compile time:
bb.assign('user.invalid', ({ data }) => data.value)     // ❌ TypeScript error
bb.assign('user.name.length', ({ data }) => 5)          // ❌ TypeScript error (string has no assignable properties)
```

### `.effect(key, fn)`
Create a model effect that runs when a specific model property changes.

```typescript
// Log when count changes
.effect('count', (event) => {
  console.log('Count changed to:', event.model.count);
})

// Save to localStorage when user changes
.effect('user', (event) => {
  localStorage.setItem('user', JSON.stringify(event.model.user));
})
```

### `.view(componentFn)`
Define the UI component that renders based on the current state and model. The component function receives props with model data and methods to send events.

```typescript
.view(({ model, send, deliver }) => {
  return (
    <div>
      <h1>{model.title}</h1>
      <button onClick={() => send('increment')}>
        Count: {model.count}
      </button>
      {/* deliver returns an event handler function */}
      <input onInput={deliver('change')} />
    </div>
  );
})
```

#### The `deliver()` Function
The `deliver()` function returns an event handler that can be directly attached to DOM events. It automatically passes the DOM event through the state machine where it becomes available as `domEvent` in transitions, guards, and invoke functions.

```typescript
// ✅ Preferred pattern - deliver returns event handler
.view(({ deliver }) => (
  <form onSubmit={deliver('submit')}>
    <input name="email" />
    <button type="submit">Submit</button>
  </form>
))

// Access the DOM event in invoke functions
.invoke('submitting', ({ domEvent }) => {
  domEvent.preventDefault();
  const formData = new FormData(domEvent.target);
  const email = formData.get('email');
  return fetch('/api/submit', { method: 'POST', body: formData });
})
```

**Key Benefits:**
- **Declarative**: Views stay pure and declarative 
- **Event Flow**: DOM events flow naturally through the state machine
- **Type Safety**: `domEvent` is properly typed in event handlers
- **Less Boilerplate**: Eliminates custom event handler functions in views

### `bb.actor(machine)`
Create an actor instance from your machine definition. Actors are the runtime instances that manage state and handle events.

```typescript
import * as v from 'valibot';

const machine = bb
  .model(v.object({ count: v.number() }))
  .states(['setup', 'idle'])
  .immediate('setup', 'idle', bb.assign('count', () => 0))
  .view(({ model }) => <div>{model.count}</div>);

const actor = bb.actor(machine);
```

### `actor.mount(element)`
Mount the actor to a DOM element, starting the application and rendering the view.

```typescript
// Mount to a selector
actor.mount('#app');

// Mount to an element
actor.mount(document.getElementById('app'));

// Mount to document.body
actor.mount(document.body);
```

### `bb.view(machine)`
Create a view component directly from a machine. This is the primary way to create components from BeepBoop machines.

```typescript
const Counter = bb.view(counterMachine);

// Use directly or in another machine's view
.view(() => {
  return (
    <div>
      <h1>My App</h1>
      <Counter />
    </div>
  );
})
```

## Form Handling Patterns

BeepBoop provides elegant patterns for handling forms that emphasize declarative views and state machine-driven logic. Forms are handled by delivering DOM events to the state machine where they can be processed in invoke functions and transitions.

### Basic Form Submission

```typescript
import * as v from 'valibot';

const formMachine = bb
  .model(v.object({
    email: v.string(),
    submitting: v.boolean(),
    error: v.string()
  }))
  .states(['idle', 'submitting', 'success', 'error'])
  .init(
    bb.assign('submitting', () => false),
    bb.assign('error', () => '')
  )
  .events('idle', ['submit'])
  .events('error', ['submit', 'reset'])
  .events('success', ['reset'])
  .transition('idle', 'submit', 'submitting')
  .transition('error', 'submit', 'submitting') 
  .transition('error', 'reset', 'idle')
  .transition('success', 'reset', 'idle')
  .invoke('submitting', ({ domEvent }) => {
    domEvent.preventDefault();
    const formData = new FormData(domEvent.target);
    const email = formData.get('email');
    
    return fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  })
  .transition('submitting', 'done', 'success',
    bb.assign('email', ({ data }) => data.email)
  )
  .transition('submitting', 'error', 'error',
    bb.assign('error', ({ data }) => data.message || 'Submission failed')
  )
  .view(({ model, deliver }) => (
    <form onSubmit={deliver('submit')}>
      <input 
        type="email" 
        name="email"
        placeholder="Enter your email"
        required 
      />
      <button type="submit" disabled={model.submitting}>
        {model.submitting ? 'Submitting...' : 'Subscribe'}
      </button>
      {model.error && <p style="color: red">{model.error}</p>}
      {model.state === 'success' && (
        <p style="color: green">Subscribed successfully!</p>
      )}
    </form>
  ));
```

### Form Validation with Guards

Use guards to validate form data before allowing state transitions:

```typescript
.transition('idle', 'submit', 'submitting',
  bb.guard(({ domEvent }) => {
    const formData = new FormData(domEvent.target);
    const email = formData.get('email');
    return email && email.includes('@');
  })
)
.transition('idle', 'submit', 'error',
  bb.assign('error', () => 'Please enter a valid email address')
)
```

### Multiple Form Fields

Access individual form fields in invoke functions and transitions:

```typescript
.invoke('processing', ({ domEvent }) => {
  const formData = new FormData(domEvent.target);
  
  const userData = {
    name: formData.get('name'),
    email: formData.get('email'),
    age: parseInt(formData.get('age')),
    newsletter: formData.has('newsletter')
  };
  
  return fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
})
```

### Real-time Input Handling

Handle input changes for real-time validation or updates:

```typescript
.events('idle', ['input', 'submit'])
.always('input', 
  bb.assign('searchQuery', ({ domEvent }) => 
    (domEvent.target as HTMLInputElement).value
  )
)
.view(({ model, deliver }) => (
  <div>
    <input 
      type="text"
      onInput={deliver('input')}
      placeholder="Search..."
    />
    <p>Searching for: {model.searchQuery}</p>
  </div>
))
```

### Common Anti-Patterns to Avoid

#### ❌ Don't Store Form Data in State
```typescript
// Avoid storing ephemeral form data in model state
.model(v.object({ formData: v.any() }))
.transition('idle', 'submit', 'loading', 
  bb.assign('formData', ({ domEvent }) => new FormData(domEvent.target))
)
```

#### ❌ Don't Write Custom Event Handlers in Views
```typescript
// Avoid custom event handling logic in views
.view(({ deliver }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    deliver('submit', formData);
  };
  return <form onSubmit={handleSubmit}>;
})
```

#### ❌ Don't Mix Async Logic with View Logic
```typescript
// Avoid async operations in views
.view(({ model, send }) => {
  const handleSubmit = async (e) => {
    const result = await fetch('/api');
    send('result', result);
  };
})
```

### ✅ Preferred Patterns

#### Store Only Persistent State
```typescript
// Store only what needs to persist across renders
.model(v.object({
  submitting: v.boolean(),
  error: v.string(), 
  lastSubmittedEmail: v.string()
}))
```

#### Use deliver() Directly
```typescript
// Let deliver() handle DOM events automatically
.view(({ deliver }) => (
  <form onSubmit={deliver('submit')}>
))
```

#### Keep Views Declarative
```typescript
// Views should only describe UI, not contain logic
.view(({ model, deliver }) => (
  <form onSubmit={deliver('submit')}>
    <input type="email" name="email" />
    <button disabled={model.submitting}>Submit</button>
  </form>
))
```

#### Handle Logic in State Machine
```typescript
// All business logic belongs in the state machine
.invoke('submitting', ({ domEvent }) => {
  // Form processing, validation, API calls happen here
  domEvent.preventDefault();
  const formData = new FormData(domEvent.target);
  return processForm(formData);
})
```

## License

BSD-2-Clause
