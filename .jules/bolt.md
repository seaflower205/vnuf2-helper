## 2024-05-28 - MutationObserver Performance Anti-Pattern in SPA

**Learning:** Using `MutationObserver` on `document.body` with `attributes: true` and `subtree: true` (e.g. for checking when an Angular spinner disappears) is a massive performance bottleneck in SPA browser extensions. It triggers the callback for *every* attribute change on *every* element in the DOM tree, locking up the main thread during rendering and navigations.

**Action:** Replace expensive global `MutationObserver` checks with lightweight polling (e.g. `setInterval` every 100ms) when waiting for specific DOM state changes like spinner visibility.
