// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu đơn giản (XOR + Base64)
// ============================================

const VNUF2Crypto = (() => {
  const OLD_KEY = 'VNUF2Helper2026';
  const api = (typeof browser !== 'undefined' && browser.storage)
    ? browser.storage.local
    : (typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null);

  let keyPromise = null;

  async function getKey() {
    if (!api) return 'VNUF2Helper2026Fallback'; // Fallback nếu không có storage API
    if (keyPromise) return keyPromise;

    keyPromise = new Promise((resolve) => {
      api.get(['vnuf2_crypto_key'], (result) => {
        if (result.vnuf2_crypto_key) {
          resolve(result.vnuf2_crypto_key);
        } else {
          // Tạo key ngẫu nhiên
          const array = new Uint8Array(16);
          crypto.getRandomValues(array);
          let newKey = '';
          for (let i = 0; i < array.length; i++) {
            newKey += String.fromCharCode(array[i]);
          }
          api.set({ vnuf2_crypto_key: newKey }, () => {
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
        const data = encoded.substring(3);
        const xored = decodeURIComponent(escape(atob(data)));
        return xorEncrypt(xored, key);
      } else {
        // Fallback for legacy passwords
        const xored = decodeURIComponent(escape(atob(encoded)));
        return xorEncrypt(xored, OLD_KEY);
      }
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã:', e);
      return '';
    }
  }

  return { encode, decode };
})();
