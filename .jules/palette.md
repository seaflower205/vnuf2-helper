## YYYY-MM-DD - Initial Journal
**Learning:** Initial setup
**Action:** Starting exploration
## 2024-05-24 - Dynamic ARIA labels for repeated icon buttons
**Learning:** In dynamically generated lists with repeated icon-only buttons (like the account list), adding an `aria-label` that includes a primary identifier (like the username) is crucial for screen readers to differentiate the buttons. A generic "Delete" label is not sufficient context when there are multiple delete buttons.
**Action:** Always include a unique identifier from the current item's data (e.g., username, ID, title) in the `aria-label` when creating interactive elements within a loop or list rendering function.
