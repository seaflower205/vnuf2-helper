// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu đơn giản (XOR + Base64)
// ============================================

const VNUF2Crypto = (() => {
  const LEGACY_KEY = 'VNUF2Helper2026';
  const SECURE_PREFIX = 'v2:';
  let initPromise = null;
  let aesKey = null;

  // Initialize secure AES key (cached to prevent race conditions)
  async function initKey() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const api = (typeof browser !== 'undefined' && browser.storage) ? browser.storage.local : chrome.storage.local;
      return new Promise((resolve) => {
        api.get('vnuf2_crypto_key', async (data) => {
          if (data.vnuf2_crypto_key) {
            // Import existing key
            const keyData = new Uint8Array(data.vnuf2_crypto_key);
            aesKey = await crypto.subtle.importKey(
              'raw', keyData, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
            );
          } else {
            // Generate new key
            aesKey = await crypto.subtle.generateKey(
              { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
            );
            const exported = await crypto.subtle.exportKey('raw', aesKey);
            await new Promise(r => api.set({ 'vnuf2_crypto_key': Array.from(new Uint8Array(exported)) }, r));
          }
          resolve();
        });
      });
    })();

    return initPromise;
  }

  // --- Legacy XOR Logic (for backward compatibility) ---
  function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  function legacyDecode(encoded) {
    try {
      const xored = decodeURIComponent(escape(atob(encoded)));
      return xorEncrypt(xored, LEGACY_KEY);
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã legacy:', e);
      return '';
    }
  }

  // --- Secure AES-GCM Logic ---
  async function encode(password) {
    if (!password) return '';
    await initKey();

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedPass = new TextEncoder().encode(password);

    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv }, aesKey, encodedPass
    );

    const encryptedArray = new Uint8Array(encryptedContent);
    const combinedArray = new Uint8Array(iv.length + encryptedArray.length);
    combinedArray.set(iv);
    combinedArray.set(encryptedArray, iv.length);

    const base64 = btoa(String.fromCharCode.apply(null, combinedArray));
    return SECURE_PREFIX + base64;
  }

  async function decode(encoded) {
    if (!encoded) return '';

    // Check if it's securely encrypted (v2)
    if (encoded.startsWith(SECURE_PREFIX)) {
      await initKey();
      try {
        const base64 = encoded.slice(SECURE_PREFIX.length);
        const combinedStr = atob(base64);
        const combinedArray = new Uint8Array(combinedStr.length);
        for (let i = 0; i < combinedStr.length; i++) {
          combinedArray[i] = combinedStr.charCodeAt(i);
        }

        const iv = combinedArray.slice(0, 12);
        const encryptedData = combinedArray.slice(12);

        const decryptedContent = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv }, aesKey, encryptedData
        );

        return new TextDecoder().decode(decryptedContent);
      } catch (e) {
        console.warn('[VNUF2] Lỗi giải mã bảo mật:', e);
        return '';
      }
    }

    // Fallback to legacy decryption
    return legacyDecode(encoded);
  }

  return { encode, decode };
})();
