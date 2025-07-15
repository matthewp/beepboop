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
Define your application state with typed properties:

```typescript
bb.model({
  count: bb.number(0),      // number with default value
  name: bb.string(''),      // string with default value  
  isDark: bb.boolean(false) // boolean with default value
})
```

### 2. States
Define the possible states your machine can be in:

```typescript
.states(['idle', 'loading', 'success', 'error'])
```

### 3. Events
Define events that can trigger state transitions:

```typescript
.events('idle', ['load', 'reset'])
```

### 4. Transitions
Define how your machine moves between states:

```typescript
.transition('idle', 'load', 'loading')
```

### 5. Guards
Add conditions to transitions:

```typescript
.transition(
  'idle',
  'decrement',
  'decrementing',
  bb.guard(({ model }) => model.count > 0)
)
```

### 6. Actions
Update your model or perform side effects:

```typescript
.immediate(
  'incrementing',
  'idle',
  bb.assign('count', ({ model }) => model.count + 1)
)
```

### 7. Always Transitions
Handle events that can occur in any state without transitioning:

```typescript
.always('props', bb.assign('connected', ({ domEvent }) => domEvent.detail.connected))
```

### 8. Views
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

Here's a simple counter application:

```typescript
import { bb } from '@matthewp/beepboop';

const counterMachine = bb
  .model({
    count: bb.number(0)
  })
  .states(['idle', 'increment', 'decrement'])
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

You can compose multiple machines together:

```typescript
import counter from './counter';
import profile from './profile';
import darkmode from './darkmode';

const appMachine = bb
  .model({
    counter,
    darkmode,
    profile,
  })
  .states(['idle'])
  .view(({ model }) => {
    const DarkMode = darkmode.view();
    const Counter = counter.view();
    const Profile = profile.view();
    
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
Define the shape of your application state. The schema object maps property names to typed values created with `bb.string()`, `bb.number()`, `bb.boolean()`, etc.

```typescript
bb.model({
  username: bb.string('anonymous'),
  score: bb.number(0),
  isActive: bb.boolean(true)
})
```

### `bb.string(initialValue?)` 
Create a string property with an optional initial value. If no initial value is provided, it defaults to `undefined`.

```typescript
bb.model({
  name: bb.string('John'),      // Initial value: 'John'
  email: bb.string()            // Initial value: undefined
})
```

### `bb.number(initialValue?)`
Create a number property with an optional initial value. If no initial value is provided, it defaults to `undefined`.

```typescript
bb.model({
  count: bb.number(0),          // Initial value: 0
  temperature: bb.number()      // Initial value: undefined
})
```

### `bb.boolean(initialValue?)`
Create a boolean property with an optional initial value. If no initial value is provided, it defaults to `undefined`.

```typescript
bb.model({
  isDarkMode: bb.boolean(false), // Initial value: false
  isLoggedIn: bb.boolean()       // Initial value: undefined
})
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

### `.always(event, ...actions)`
Define an event that can be handled in any state without transitioning. The machine stays in the current state and runs the provided actions.

```typescript
// Handle props updates in any state
.always('props', bb.assign('connected', ({ domEvent }) => domEvent.detail.connected))

// Handle multiple always events
.always('increment', bb.assign('count', ({ model }) => model.count + 1))
.always('reset', bb.assign('count', () => 0))
```

### `.effect(fn)`
Define a lifecycle effect that runs once when the machine starts (client-side only). Use this for setting up external resources like event listeners, timers, or WebSocket connections.

```typescript
// Setup external event listeners
.effect((event, send) => {
  const onOnline = () => send('connect');
  const onOffline = () => send('disconnect');
  
  addEventListener('online', onOnline);
  addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    removeEventListener('online', onOnline);
    removeEventListener('offline', onOffline);
  };
})

// Setup timers
.effect((event, send) => {
  const interval = setInterval(() => send('tick'), 1000);
  return () => clearInterval(interval);
})
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

### `bb.actor(machine)`
Create an actor instance from your machine definition. Actors are the runtime instances that manage state and handle events.

```typescript
const machine = bb.model({ count: bb.number(0) })
  .states(['idle'])
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

### `actor.view()`
Get a view component that can be rendered inside another beepboop component. This is used for composing multiple machines.

```typescript
const counterActor = bb.actor(counterMachine);
const Counter = counterActor.view();

// Use in another machine's view
.view(() => {
  return (
    <div>
      <h1>My App</h1>
      <Counter />
    </div>
  );
})
```

## License

BSD-2-Clause
