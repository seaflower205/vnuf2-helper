## 2024-05-18 - Missing ARIA Labels on Icon Buttons in Popup
**Learning:** Found multiple icon-only buttons (`btn-eye`, `btn-star`, `btn-login`, `btn-del`) in the account list of `popup.js` that rely on the `title` attribute for tooltips but lack semantic `aria-label`s for screen readers. Using only text emojis like `👁` or `▶` without accessible names makes navigation difficult.
**Action:** Always add `aria-label` attributes to dynamically created icon-only buttons, especially in lists.
