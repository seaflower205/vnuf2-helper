// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu đơn giản (XOR + Base64)
// ============================================

const VNUF2Crypto = (() => {
  // 🛡️ Sentinel: Removed hardcoded key. Added v2 prefix for backwards compatibility.
  let secretKey = null, initPromise = null;
  function getKey() {
    if (secretKey) return secretKey;
    if (initPromise) return initPromise;
    return initPromise = new Promise(res => chrome.storage.local.get('vnuf2_key', d => {
      if (d.vnuf2_key) return res(secretKey = d.vnuf2_key);
      const k = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
      chrome.storage.local.set({vnuf2_key: k}, () => res(secretKey = k));
    }));
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
    return 'v2:' + btoa(unescape(encodeURIComponent(xorEncrypt(password, await getKey()))));
  }

  async function decode(encoded) {
    if (!encoded) return '';
    try {
      if (encoded.startsWith('v2:')) return xorEncrypt(decodeURIComponent(escape(atob(encoded.substring(3)))), await getKey());
      return xorEncrypt(decodeURIComponent(escape(atob(encoded))), 'VNUF2Helper2026'); // Legacy v1 fallback
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã:', e);
      return '';
    }
  }

  return { encode, decode };
})();
