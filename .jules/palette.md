## 2024-05-18 - Contextual Aria Labels
**Learning:** When using dynamically generated icon-only buttons (like inside a list of items), just setting an generic aria-label is not enough. Without a contextual identifier (like the username), screen readers will read multiple identical labels, confusing the user about which item is being interacted with.
**Action:** Always include primary identifiers from the iteration context (e.g., account username, project name) inside `aria-label` attributes for dynamically generated elements.
