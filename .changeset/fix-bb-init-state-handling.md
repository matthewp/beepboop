---
"@matthewp/beepboop": patch
---

Fix bb.init() state handling bugs

Fixed two issues with bb.init() method: ensured BEEPBOOP_INITIAL_STATE is always available by creating it in states() method, and corrected the destination state from invalid '*' to the proper initial state.