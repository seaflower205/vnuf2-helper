## 2024-05-18 - [Fix Hardcoded Cryptography Secret]
**Vulnerability:** [The codebase used a hardcoded string `VNUF2Helper2026` as a key for a weak XOR encryption method to store user passwords in extension storage.]
**Learning:** [Hardcoded secrets make encryption trivial to bypass if the source code is accessible. Simple XOR ciphers provide minimal security compared to standard algorithms.]
**Prevention:** [Generate unique cryptographic keys per installation and store them securely using native APIs like Web Crypto API (AES-GCM). Implement backwards compatibility (e.g., prefixes like `v2:`) to avoid data loss when migrating legacy cryptography.]
