---
"@matthewp/beepboop": minor
---

Add invoke() method and Standard Schema support

Adds `.invoke()` method for async operations using Robot3's invoke functionality. Implements full Standard Schema integration with BeepBoop's own minimal schema types. Supports external Standard Schema libraries like Valibot, Zod, and ArkType. Models now start empty and are populated via immediate transitions from setup states.