## 2026-06-03 - Optimize DOM Observation in Angular SPA
**Learning:** Using `MutationObserver` on `document.body` with `attributes: true` in an Angular app causes significant main thread blocking due to frequent change detection cycles.
**Action:** Replace `MutationObserver` with lightweight `setInterval` polling mechanisms when waiting for specific DOM state changes (like spinner hiding) to avoid performance degradation.
