// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu đơn giản (XOR + Base64)
// ============================================

const VNUF2Crypto = (() => {
  // 🛡️ Sentinel: Removed hardcoded secret key
  const LEGACY_KEY = 'VNUF2Helper2026';
  const SECURE_KEY_STORAGE = 'vnuf2_secure_master_key';
  const V2_PREFIX = 'v2:';

  // 🛡️ Sentinel: Cache the key promise to prevent race conditions during concurrent access
  let keyPromise = null;

  /**
   * Generates a random base64 key
   */
  function generateRandomKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
  }

  /**
   * Retrieves or generates the dynamic master key
   * Uses browser.storage or chrome.storage
   */
  function getMasterKey() {
    if (keyPromise) return keyPromise;

    keyPromise = new Promise((resolve) => {
      const api = (typeof browser !== 'undefined' && browser.storage) ? browser.storage.local : chrome.storage.local;
      api.get(SECURE_KEY_STORAGE, (data) => {
        if (data && data[SECURE_KEY_STORAGE]) {
          resolve(data[SECURE_KEY_STORAGE]);
        } else {
          // Generate new key on first use
          const newKey = generateRandomKey();
          api.set({ [SECURE_KEY_STORAGE]: newKey }, () => {
            resolve(newKey);
          });
        }
      });
    });

    return keyPromise;
  }

  function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  /**
   * Encodes a password using the secure dynamic key
   * 🛡️ Sentinel: Now async because key retrieval is async
   */
  async function encode(password) {
    if (!password) return '';
    const secureKey = await getMasterKey();
    const xored = xorEncrypt(password, secureKey);
    const base64 = btoa(unescape(encodeURIComponent(xored)));
    return V2_PREFIX + base64;
  }

  /**
   * Decodes a password, falling back to legacy key if needed
   * 🛡️ Sentinel: Backward compatibility implemented to prevent data loss
   */
  async function decode(encoded) {
    if (!encoded) return '';
    try {
      if (encoded.startsWith(V2_PREFIX)) {
        // New secure dynamic key format
        const secureKey = await getMasterKey();
        const base64Data = encoded.substring(V2_PREFIX.length);
        const xored = decodeURIComponent(escape(atob(base64Data)));
        return xorEncrypt(xored, secureKey);
      } else {
        // Legacy hardcoded key format
        const xored = decodeURIComponent(escape(atob(encoded)));
        return xorEncrypt(xored, LEGACY_KEY);
      }
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã:', e);
      return '';
    }
  }

  return { encode, decode };
})();
