// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu đơn giản (XOR + Base64)
// ============================================

const VNUF2Crypto = (() => {
  const KEY = 'VNUF2Helper2026';

  function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  function encode(password) {
    if (!password) return '';
    const xored = xorEncrypt(password, KEY);
    return btoa(unescape(encodeURIComponent(xored)));
  }

  function decode(encoded) {
    if (!encoded) return '';
    try {
      const xored = decodeURIComponent(escape(atob(encoded)));
      return xorEncrypt(xored, KEY);
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã:', e);
      return '';
    }
  }

  return { encode, decode };
})();
