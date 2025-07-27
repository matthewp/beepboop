---
"@matthewp/beepboop": patch
---

Improve component props typing

Fixed bb.view(machine) to return proper Preact Component<Props> type with correct props schema typing instead of generic Component. This provides better TypeScript support and IDE integration when using BeepBoop components.