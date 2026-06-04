// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu đơn giản (XOR + Base64)
// ============================================

const VNUF2Crypto = (() => {
  const LEGACY_KEY = 'VNUF2Helper2026';
  let keyPromise = null;

  // Generate or retrieve a secure random key per installation
  function getKey() {
    if (keyPromise) return keyPromise;
    const api = (typeof browser !== 'undefined' && browser.storage)
      ? browser.storage.local
      : chrome.storage.local;

    keyPromise = new Promise(resolve => {
      api.get('vnuf2_crypto_key', data => {
        if (data.vnuf2_crypto_key) {
          resolve(data.vnuf2_crypto_key);
        } else {
          // Generate new secure random key instead of hardcoded secret
          const array = new Uint8Array(16);
          crypto.getRandomValues(array);
          const newKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
          api.set({ 'vnuf2_crypto_key': newKey }, () => resolve(newKey));
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

  async function encode(password) {
    if (!password) return '';
    const key = await getKey();
    const xored = xorEncrypt(password, key);
    return 'v2:' + btoa(unescape(encodeURIComponent(xored)));
  }

  async function decode(encoded) {
    if (!encoded) return '';
    try {
      if (encoded.startsWith('v2:')) {
        const key = await getKey();
        const actualEncoded = encoded.substring(3);
        const xored = decodeURIComponent(escape(atob(actualEncoded)));
        return xorEncrypt(xored, key);
      } else {
        // Fallback to legacy hardcoded key for backward compatibility
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
