## 2024-06-03 - Replaced Hardcoded Encryption Key with Dynamic Storage-Bound Key
**Vulnerability:** Passwords in the extension were encrypted using a hardcoded XOR key (`VNUF2Helper2026`), allowing anyone inspecting the source to easily decrypt the local storage contents.
**Learning:** Browser extensions cannot securely hide hardcoded keys. Any cryptographic mechanism needing to run autonomously on the client should generate and persist a unique, randomized key in local storage rather than sharing a static secret across all installations.
**Prevention:** Generate a unique `crypto.getRandomValues` key on the first run, cache it via Promise, and use versioned prefixes (`v2:`) for stored ciphertext to safely migrate legacy encrypted data without breaking backward compatibility.
