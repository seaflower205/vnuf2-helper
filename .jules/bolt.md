## 2024-05-18 - MutationObserver Bottleneck in Angular SPAs
**Learning:** Using `MutationObserver` on `document.body` with `attributes: true` in an Angular SPA causes severe performance degradation because Angular's frequent change detection cycles trigger the observer excessively, blocking the main thread.
**Action:** Replace `MutationObserver` with lightweight `setInterval` polling (e.g., checking every 100ms) to detect specific DOM state changes (like a spinner hiding) in Angular applications.
