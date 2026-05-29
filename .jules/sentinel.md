## 2026-05-29 - [XSS via innerHTML in extension popup and gpa calculator]
**Vulnerability:** innerHTML used without sanitization to render user accounts in popup, and target GPA values in gpa-calculator.js
**Learning:** innerHTML is used out of convenience to render data to the DOM but it introduces XSS vulnerabilities if user data is processed.
**Prevention:** Avoid innerHTML where possible. Use DOM APIs like createElement and textContent instead.
