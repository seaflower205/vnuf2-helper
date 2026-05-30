## 2025-05-16 - Remove Hardcoded Cryptographic Key
**Vulnerability:** Hardcoded master key 'VNUF2Helper2026' was used to encrypt/decrypt sensitive user passwords in the browser extension.
**Learning:** Hardcoding keys in client-side code provides no real security, as the key is easily accessible to anyone examining the extension's source code or CRX file. It violates the core security principle of not embedding secrets in code.
**Prevention:** Generate a random cryptographic key dynamically on first use, store it securely, and use it for subsequent encryption operations. Always ensure backward compatibility (e.g., using 'v2:' prefixes) when migrating legacy cryptographic implementations to prevent user data loss, and cache key retrieval promises to avoid race conditions.
