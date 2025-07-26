---
"@matthewp/beepboop": minor
---

Add bb.action() method and remove lifecycle effects

Added bb.action() as a thin wrapper around robot3's action function for consistent API. Removed lifecycle effects (.effect(fn)) in favor of using bb.init() with bb.action(). Updated documentation to show the new initialization pattern. Also optimized view rendering to only trigger once per transition instead of once per assign.