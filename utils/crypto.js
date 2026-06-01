// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu an toàn (AES-GCM)
// ============================================

const VNUF2Crypto = (() => {
  const LEGACY_KEY = 'VNUF2Helper2026';
  const STORAGE_KEY = 'vnuf2_crypto_key';

  // Detect Chrome vs Firefox
  const api = (typeof browser !== 'undefined' && browser.storage)
    ? browser.storage.local
    : chrome.storage.local;

  let keyPromise = null;

  function getCryptoKey() {
    if (keyPromise) return keyPromise;

    keyPromise = new Promise((resolve) => {
      api.get(STORAGE_KEY, async (data) => {
        if (data[STORAGE_KEY]) {
          // Import existing key
          const rawKey = new Uint8Array(data[STORAGE_KEY]);
          const cryptoKey = await crypto.subtle.importKey(
            'raw',
            rawKey,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
          );
          resolve(cryptoKey);
        } else {
          // Generate new key
          const cryptoKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          // Export and save
          const exportedKey = await crypto.subtle.exportKey('raw', cryptoKey);
          api.set({ [STORAGE_KEY]: Array.from(new Uint8Array(exportedKey)) }, () => {
            resolve(cryptoKey);
          });
        }
      });
    });

    return keyPromise;
  }

  // --- Legacy XOR logic for backward compatibility ---
  function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  function legacyDecode(encoded) {
    if (!encoded) return '';
    try {
      const xored = decodeURIComponent(escape(atob(encoded)));
      return xorEncrypt(xored, LEGACY_KEY);
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã legacy:', e);
      return '';
    }
  }

  // --- Utility functions ---
  function bufferToBase64(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
  }

  function base64ToBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // --- Main API ---
  async function encode(password) {
    if (!password) return '';

    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedPassword = new TextEncoder().encode(password);

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedPassword
    );

    const encryptedBase64 = bufferToBase64(encryptedData);
    const ivBase64 = bufferToBase64(iv);

    return `v2:${ivBase64}:${encryptedBase64}`;
  }

  async function decode(encoded) {
    if (!encoded) return '';

    if (!encoded.startsWith('v2:')) {
      return legacyDecode(encoded);
    }

    try {
      const parts = encoded.split(':');
      if (parts.length !== 3) return '';

      const iv = base64ToBuffer(parts[1]);
      const encryptedData = base64ToBuffer(parts[2]);
      const key = await getCryptoKey();

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        encryptedData
      );

      return new TextDecoder().decode(decryptedData);
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã AES-GCM:', e);
      return '';
    }
  }

  return { encode, decode };
})();
