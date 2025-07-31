# Child Actors Feature Design

## Overview

Child actors enable hierarchical state management in BeepBoop by allowing machines to spawn and communicate with other machines as subtasks. This creates powerful composition patterns for complex applications.

## Design Philosophy

Child actors are treated as regular model properties rather than special framework constructs. This leverages BeepBoop's existing patterns while avoiding additional complexity.

## Core Concepts

### Child Actor Creation

Child actors are created during machine initialization using `bb.actor()`:

```javascript
const parentMachine = bb
  .model(v.object({
    child: v.type() // Will be Actor type when typing is complete
  }))
  .states(['idle'])
  .init(
    bb.assign('child', () => bb.actor(childMachine))
  );
```

### Props Passing (Planned)

Child actors can receive initial props via a second argument to `bb.actor()`:

```javascript
bb.assign('stoplight', () => bb.actor(stoplightMachine, { duration: 5000 }))
```

The props would be merged into the child's initial model state.

### Bidirectional Communication

**Parent → Child**: Direct method calls on the child actor
```javascript
// In parent machine transition
bb.action(({ model }) => model.child.send('go'))
```

**Child → Parent**: Parent passed as prop to child
```javascript
// Child machine model includes parent reference
const childMachine = bb
  .model(v.object({
    parent: v.instance(Actor), // When typing is complete
    // other child state...
  }))

// Parent passes itself during child creation
bb.assign('child', ({ actor }) => bb.actor(childMachine, { parent: actor }))

// Child can communicate back
bb.action(({ model }) => model.parent.send('childComplete'))
```

## Implementation Status

### ✅ Completed
- **Basic child actor creation**: `bb.actor(childMachine)` works
- **Event sending**: Parent can send events to child via `child.send()`
- **Test framework**: Basic test created and passing

### 🚧 In Progress
- **Design documentation**: This document

### 📋 Planned
- **Props passing**: `bb.actor(machine, props)` implementation
- **TypeScript integration**: Strong typing for child actors
- **Runtime type validation**: Schema validation for actor instances
- **Parent-child communication patterns**: Bidirectional event flow
- **Lifecycle management**: Child cleanup and lifecycle hooks

## Technical Details

### Current Implementation

The basic functionality already works because:
- `bb.actor()` creates Actor instances that can be stored in models
- Actor instances have `send()` methods for event communication
- The existing model system handles actor storage naturally

### Type System Challenges

**Challenge**: Need strongly typed actor references in schemas
**Current**: Using `v.type()` (generic type) as placeholder
**Goal**: Type-safe references like `bb.ActorType<typeof machine>`

**Approaches considered**:
1. **Type-only**: TypeScript helper with runtime fallback to generic Actor check
2. **Runtime branding**: Each machine gets unique symbol for runtime validation
3. **Schema integration**: Machines generate their own schema types

### Runtime Validation

Schema libraries (Valibot, Zod, ArkType) need runtime validation for actor instances:
- Valibot: Likely `v.instance(Actor)` or similar
- Zod: Probably `z.instanceof(Actor)`
- Challenge: Need specific actor type validation, not just generic Actor

## Example Use Cases

### Traffic Light System
```javascript
const stoplightMachine = bb
  .model(v.object({ 
    color: v.string(),
    duration: v.number() 
  }))
  .states(['red', 'yellow', 'green'])
  // ... transitions

const intersectionMachine = bb
  .model(v.object({
    northSouth: v.instance(StoplightActor),
    eastWest: v.instance(StoplightActor)
  }))
  .init(
    bb.assign('northSouth', () => bb.actor(stoplightMachine, { duration: 30 })),
    bb.assign('eastWest', () => bb.actor(stoplightMachine, { duration: 20 }))
  )
  .transition('idle', 'change', 'idle', 
    bb.action(({ model }) => {
      model.northSouth.send('change');
      model.eastWest.send('change');
    })
  );
```

### Task Management
```javascript
const taskMachine = bb
  .model(v.object({
    parent: v.instance(ParentActor),
    task: v.string(),
    status: v.string()
  }))
  .states(['pending', 'running', 'complete'])
  .transition('running', 'finish', 'complete',
    bb.action(({ model }) => model.parent.send('taskComplete'))
  );

const managerMachine = bb
  .model(v.object({
    tasks: v.array(v.instance(TaskActor))
  }))
  .init(
    bb.assign('tasks', ({ actor }) => [
      bb.actor(taskMachine, { parent: actor, task: 'Load data' }),
      bb.actor(taskMachine, { parent: actor, task: 'Process data' })
    ])
  );
```

## Benefits

1. **Natural composition**: Child actors feel like regular model properties
2. **Type safety**: Full TypeScript support for actor communication
3. **Isolation**: Each child has its own state and lifecycle
4. **Communication**: Clean bidirectional event flow
5. **Reusability**: Child machines can be used standalone or as children

## Next Steps

1. Implement props passing functionality
2. Design TypeScript helpers for strong typing
3. Add comprehensive tests for all communication patterns
4. Document best practices and patterns
5. Consider lifecycle management and cleanup strategies