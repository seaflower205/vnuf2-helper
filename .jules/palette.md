## 2024-03-05 - Add context-aware ARIA labels to dynamic lists
**Learning:** When adding ARIA labels to dynamically generated lists with repeated icon-only buttons, it's crucial to include a primary identifier (like username) in the label for context. Otherwise, screen readers will announce ambiguous, repetitive labels (e.g., repeatedly saying just 'Xóa' without specifying what is being deleted).
**Action:** Always interpolate unique row/item identifiers into ARIA labels for action buttons inside lists/tables.
