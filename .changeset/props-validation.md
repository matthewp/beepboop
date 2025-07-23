---
"@matthewp/beepboop": minor
---

Add bb.props(schema) for component props validation

Adds `.props()` method for defining and validating component props using Standard Schema. Props are automatically validated on component mount and updates, throwing descriptive errors for invalid props. Supports all Standard Schema libraries like Valibot, Zod, and ArkType. Props are handled through the 'props' event with proper TypeScript typing. Backward compatible - no props schema means no validation.