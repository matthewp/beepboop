---
"@matthewp/beepboop": minor
---

Add bb.init() method for clean model initialization

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
  .model(v.object({
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
  .states(['idle', 'loading'])
  // ... rest of machine
```

This provides a much cleaner alternative to the previous pattern of using immediate transitions from setup states for model initialization.