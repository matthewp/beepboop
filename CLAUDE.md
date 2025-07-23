# BeepBoop Framework - Claude Context

## Overview
BeepBoop is a finite state machine framework for building reactive web applications. It combines state machines with reactive UI components.

## Key Information for Claude

### API Reference
**IMPORTANT**: Always refer to the README.md file for the most up-to-date API documentation and examples. The README contains comprehensive information about:
- Core concepts and API methods
- Complete examples with proper syntax
- Model definitions, states, events, transitions
- Guards, actions, and views
- Composition patterns

### Core API Structure
BeepBoop uses a fluent builder pattern:

```typescript
const machine = bb
  .model({ count: bb.number(0) })
  .states(['idle', 'increment'])
  .events('idle', ['increment'])
  .transition('idle', 'increment', 'increment')
  .immediate('increment', 'idle', bb.assign('count', ({ model }) => model.count + 1))
  .view(({ model, send }) => <div>{model.count}</div>);
```

### Key Points
- **Models**: Define typed application state with `bb.string()`, `bb.number()`, `bb.boolean()`
- **States**: Define with `.states([])` - first state is initial state
- **Events**: Define per-state with `.events(state, [events])`
- **Transitions**: `.transition(from, event, to, ...actions)` 
- **Guards**: `bb.guard(fn)` for conditional transitions
- **Actions**: `bb.assign(property, fn)` for model updates
- **Views**: `.view(fn)` for UI rendering
- **Actors**: `bb.actor(machine)` creates runtime instances

### Important Notes
- The `.state()` method does NOT take a second parameter for events
- Events are defined separately with `.events(state, [events])`
- All actions like `bb.assign()`, `bb.guard()` are composable and can be chained in transitions
- **CRITICAL**: BeepBoop uses a fluent API pattern - NEVER suggest methods that take configuration objects
- All API methods should be chainable method calls, not object-based configuration
- Examples: `.onGlobal('event', action)` ✓, `.globalEvents({ ... })` ✗
- **CRITICAL**: BeepBoop builder methods are "spec collectors" - they only store configuration, they don't process it
- Builder methods like `.states()`, `.events()`, `.transition()` just add to the builder spec
- All processing happens in the `build()` function at the end, not in individual builder methods
- When implementing new builder methods, just collect the configuration and let `build()` handle the processing
- Always check README.md for current API patterns and examples

### Development Commands
- Check README.md for any specific build, test, or development commands
- Look for package.json scripts if development commands are needed

### Creating Changesets
When adding new features or making changes, create a changeset to document the change:

1. **Create a changeset file** in `.changeset/` directory with a descriptive name
2. **Use the changeset format**:
   ```markdown
   ---
   "@matthewp/beepboop": minor
   ---
   
   Brief title of the change
   
   Detailed description of what was added/changed. Include key features and any breaking changes.
   ```
3. **Choose the correct version bump**:
   - `patch`: Bug fixes, small improvements
   - `minor`: New features, non-breaking changes
   - `major`: Breaking changes
4. **Examples of good changeset titles**:
   - "Add invoke() method and Standard Schema support"
   - "Add bb.props(schema) for component props validation"
   - "Fix calling the initial effects"