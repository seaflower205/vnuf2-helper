## 2024-06-07 - Dynamic Icon Buttons Need Contextual ARIA Labels
**Learning:** When adding ARIA labels to dynamically generated lists (like account lists in a popup) that use identical icon-only buttons (like 👁, ★, ▶, ✕), screen readers will simply read "Show Password", "Show Password" repeatedly if context isn't provided.
**Action:** Always include a unique identifier from the current iteration's context (e.g., the `username` property) directly inside the `aria-label` string (e.g., "Xóa tài khoản 123456") to make the buttons distinct to assistive technologies.
