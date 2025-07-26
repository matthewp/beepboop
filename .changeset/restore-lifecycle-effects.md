---
"@matthewp/beepboop": minor
---

Restore lifecycle effects and improve init() behavior

Restored .effect(fn) for setting up external event sources like WebSocket connections, timers, and browser event listeners. Made init() additive so multiple calls merge actions instead of overwriting. Clarified documentation to distinguish between .effect(fn) for external event sources and .init() for initial data setup.