---
"@matthewp/beepboop": minor
---

Add nested property assignment support with bb.assign()

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
  .model(v.object({
    user: v.object({
      name: v.string(),
      profile: v.object({
        bio: v.string()
      })
    })
  }))
  .always('updateUser',
    bb.assign('user.name', ({ data }) => data.name),
    bb.assign('user.profile.bio', ({ data }) => data.bio)
  );
```