## 2024-05-24 - Angular Performance Anti-pattern: Global MutationObserver
**Learning:** Using `MutationObserver` on `document.body` with `attributes: true` and `subtree: true` is a massive performance bottleneck in Angular apps (like `daotao.vnuf2.edu.vn`). Angular frequently updates DOM attributes during its change detection cycles, which triggers the observer thousands of times and blocks the main thread.
**Action:** Always prefer targeted observers (on specific containers) or lightweight `setInterval` polling when waiting for specific DOM state changes (like `ngx-spinner` hiding) in Angular applications.

## 2024-05-24 - Array `splice` vs Direct Assignment in 2D Grids
**Learning:** Initializing/updating cells in a 2D grid representation (e.g. `grid.at(r).splice(c, 1, true)`) is extremely slow (O(N) operation to shift elements in the array).
**Action:** Always use direct array indexing/assignment (`grid[r][c] = true`) which is O(1) and orders of magnitude faster.
