## 2024-06-08 - MutationObserver in Angular
**Learning:** Using MutationObserver on `document.body` with `attributes: true` in an Angular SPA is a major performance anti-pattern. Angular's change detection triggers attribute updates frequently, causing the observer callback to fire excessively and block the main thread.
**Action:** Replace `MutationObserver` with lightweight `setInterval` polling (e.g., 100ms) when waiting for DOM state changes in Angular applications.
