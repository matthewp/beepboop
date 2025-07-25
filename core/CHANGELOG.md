# @matthewp/beepboop

## 0.6.0

### Minor Changes

- a20118b: Add bb.action() method and remove lifecycle effects

  Added bb.action() as a thin wrapper around robot3's action function for consistent API. Removed lifecycle effects (.effect(fn)) in favor of using bb.init() with bb.action(). Updated documentation to show the new initialization pattern. Also optimized view rendering to only trigger once per transition instead of once per assign.

### Patch Changes

- 8c1c7de: Fix bb.init() state handling bugs

  Fixed two issues with bb.init() method: ensured BEEPBOOP_INITIAL_STATE is always available by creating it in states() method, and corrected the destination state from invalid '\*' to the proper initial state.

## 0.5.1

### Patch Changes

- 837c2bb: Fix deliver property types and improve form handling documentation

  - Add missing `deliver` property to view() method TypeScript types
  - Add comprehensive Form Handling Patterns section with complete examples
  - Enhance deliver() documentation with event flow explanations
  - Include anti-patterns and preferred patterns for form handling
  - Address migration guidance for developers coming from React patterns

## 0.5.0

### Minor Changes

- ed6f025: Add bb.init() method for clean model initialization

  Adds `.init()` method to provide a clean way to initialize model properties when the machine starts. This method accepts the same action types as transitions (`bb.assign()`, custom reducers, etc.) but filters out guards since initialization should always happen.

  Key features:

  - Clean initialization API: `bb.init(bb.assign('count', () => 0))`
  - Supports nested property assignment: `bb.assign('user.profile.name', () => 'John')`
  - Filters out guards automatically (they are ignored, not errored)
  - Runs during the hidden initial state transition before entering the first user state
  - Full TypeScript support with proper type inference

  Example usage:

  ```typescript
  const machine = bb
    .model(
      v.object({
        count: v.number(),
        user: v.object({
          name: v.string(),
          profile: v.object({
            age: v.number(),
          }),
        }),
      })
    )
    .init(
      bb.assign("count", () => 0),
      bb.assign("user.name", () => "Anonymous"),
      bb.assign("user.profile.age", () => 18)
    )
    .states(["idle", "loading"]);
  // ... rest of machine
  ```

  This provides a much cleaner alternative to the previous pattern of using immediate transitions from setup states for model initialization.

## 0.4.0

### Minor Changes

- cdcdf6c: Add nested property assignment support with bb.assign()

  BeepBoop now supports assigning to nested properties using dot notation with full TypeScript type safety. This allows you to update deeply nested model data efficiently and safely.

  Key features:

  - Type-safe nested property paths (e.g., `bb.assign('user.profile.name', ...)`)
  - TypeScript errors for invalid paths like `'user.nonexistent'`
  - Editor auto-completion for available nested paths
  - Runtime efficiency - only the specific nested property is mutated
  - Works with all Standard Schema libraries (Valibot, Zod, ArkType, etc.)

  Example usage:

  ```typescript
  const machine = bb
    .model(
      v.object({
        user: v.object({
          name: v.string(),
          profile: v.object({
            bio: v.string(),
          }),
        }),
      })
    )
    .always(
      "updateUser",
      bb.assign("user.name", ({ data }) => data.name),
      bb.assign("user.profile.bio", ({ data }) => data.bio)
    );
  ```

- febe888: Add bb.props(schema) for component props validation

  Adds `.props()` method for defining and validating component props using Standard Schema. Props are automatically validated on component mount and updates, throwing descriptive errors for invalid props. Supports all Standard Schema libraries like Valibot, Zod, and ArkType. Props are handled through the 'props' event with proper TypeScript typing. Backward compatible - no props schema means no validation.

- 70417f8: Remove actor.view() method and add bb.view(machine) for cleaner API

  This is a breaking change that removes the awkward `bb.actor(machine).view()` pattern in favor of a cleaner `bb.view(machine)` API.

  **BREAKING CHANGES:**

  - Removed `actor.view()` method - actors no longer have a `.view()` method
  - Added `bb.view(machine)` method - creates view components directly from machines
  - Updated component composition pattern - export `bb.view(machine)` instead of actors

  **Migration:**

  Before:

  ```typescript
  // Old pattern
  const machine = bb./* machine definition */;
  export default bb.actor(machine);

  // Usage
  import counter from './counter';
  const Counter = counter.view();
  ```

  After:

  ```typescript
  // New pattern
  const machine = bb./* machine definition */;
  export default bb.view(machine);

  // Usage
  import Counter from './counter';
  // Counter is already a component, use directly
  ```

  **Benefits:**

  - Much cleaner API: `bb.view(machine)` vs `bb.actor(machine).view()`
  - Better separation of concerns: actors for headless logic, views for UI
  - More intuitive component composition
  - Maintains proper actor-based instantiation internally

- 78d6463: Add invoke() method and Standard Schema support

  Adds `.invoke()` method for async operations using Robot3's invoke functionality. Implements full Standard Schema integration with BeepBoop's own minimal schema types. Supports external Standard Schema libraries like Valibot, Zod, and ArkType. Models now start empty and are populated via immediate transitions from setup states.

## 0.3.0

### Minor Changes

- 86f17ef: Adds the invoke() method

## 0.2.4

### Patch Changes

- 5ff240c: Fix calling the initial effects

## 0.2.3

### Patch Changes

- 323b97d: Fix sending event

## 0.2.2

### Patch Changes

- a562f58: Allow more variations of send

## 0.2.1

### Patch Changes

- e0681a8: Add send and sendEvent as separate methods

## 0.2.0

### Minor Changes

- 7e1cc4b: Adds .effect() and .always()

## 0.1.0

### Minor Changes

- 65d526e: First release

## 0.0.15

### Patch Changes

- 389f3aa: Support the :scope selector

## 0.0.14

### Patch Changes

- 2746611: Add .prop() helper

  Adds a new helper for props.

## 0.0.13

### Patch Changes

- 7197f2e: Make selectors and events constants

## 0.0.12

### Patch Changes

- 4c11434: Implement actors

## 0.0.11

### Patch Changes

- 6f0d7b8: First changeset usage
