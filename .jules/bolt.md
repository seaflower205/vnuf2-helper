## 2024-05-24 - MutationObserver Performance in Angular SPAs
**Learning:** Using `MutationObserver` on `document.body` with `attributes: true` causes severe performance issues in Angular applications. Angular's frequent change detection cycles trigger the observer excessively and block the main thread.
**Action:** Use lightweight `setInterval` polling for specific DOM state changes (like waiting for a spinner to hide) instead of `MutationObserver` in Angular SPAs.
