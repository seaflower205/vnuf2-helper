## 2025-05-31 - Weak Cryptography in Extension Storage
**Vulnerability:** Passwords in the extension's local storage were weakly obfuscated using a static XOR key (`VNUF2Helper2026`) and Base64 encoding instead of proper encryption.
**Learning:** This likely existed because XOR is synchronous and easy to implement in local extensions where there are no backend keys, but it provides no real security against reverse engineering.
**Prevention:** Always use the Web Crypto API (`crypto.subtle`) to generate dynamic, secure keys (e.g., AES-GCM) for local data encryption, and implement versioning (like a `v2:` prefix) to allow backward compatibility during migration.
