// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu đơn giản (XOR + Base64)
// ============================================

const VNUF2Crypto = (() => {
  const LEGACY_KEY = 'VNUF2Helper2026';
  let cachedKeyPromise = null;

  function getDynamicKey() {
    if (cachedKeyPromise) return cachedKeyPromise;
    const api = (typeof browser !== 'undefined' && browser.storage) ? browser.storage.local : chrome.storage.local;
    cachedKeyPromise = new Promise(resolve => {
      api.get('vnuf2_crypto_key', data => {
        let key = data.vnuf2_crypto_key;
        if (!key) {
          key = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => String.fromCharCode(b)).join('');
          key = btoa(key);
          api.set({ vnuf2_crypto_key: key });
        }
        resolve(key);
      });
    });
    return cachedKeyPromise;
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
    const key = await getDynamicKey();
    const xored = xorEncrypt(password, key);
    return 'v2:' + btoa(unescape(encodeURIComponent(xored)));
  }

  async function decode(encoded) {
    if (!encoded) return '';
    try {
      if (encoded.startsWith('v2:')) {
        const key = await getDynamicKey();
        const xored = decodeURIComponent(escape(atob(encoded.slice(3))));
        return xorEncrypt(xored, key);
      } else {
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
