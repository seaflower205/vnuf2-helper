## 2024-06-02 - Replacing Legacy Cryptography Safely
**Vulnerability:** Weak, legacy XOR cryptography with a hardcoded key (`VNUF2Helper2026`) used to encrypt passwords.
**Learning:** Replacing encryption logic requires backward compatibility to prevent user data loss. Additionally, storing new keys asynchronously in Chrome storage requires caching promises to prevent race conditions during concurrent `getAccounts` calls.
**Prevention:** Always implement backward compatibility (e.g., using prefix versioning like `v2:`) when migrating sensitive data encryption. Use `Web Crypto API` for robust cryptographic operations instead of custom XOR logic.
