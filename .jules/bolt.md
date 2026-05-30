## 2024-05-18 - Angular MutationObserver Attributes Bottleneck
**Learning:** Using `MutationObserver` on `document.body` with `attributes: true` in an Angular application causes severe main thread blockage due to Angular's frequent change detection cycles triggering it excessively.
**Action:** Prefer lightweight `setInterval` polling for specific DOM state changes (like waiting for a spinner to hide) instead of observing the entire body's attributes.
