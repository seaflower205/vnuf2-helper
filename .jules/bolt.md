## 2024-05-24 - Replace MutationObserver on body with polling in Angular SPA
**Learning:** Using MutationObserver on document.body with attributes: true inside an Angular SPA triggers excessively during Angular's change detection cycles. This blocks the main thread and severely degrades performance.
**Action:** Prefer lightweight setInterval polling for specific DOM state changes (like waiting for a spinner to hide) instead of broad MutationObservers on the body in Angular applications.
