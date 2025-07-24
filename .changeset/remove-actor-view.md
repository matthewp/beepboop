---
"@matthewp/beepboop": minor
---

Remove actor.view() method and add bb.view(machine) for cleaner API

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