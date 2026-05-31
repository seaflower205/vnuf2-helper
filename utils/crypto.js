// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu an toàn (AES-GCM)
// Có hỗ trợ tương thích ngược (XOR)
// ============================================

const VNUF2Crypto = (() => {
  const OLD_KEY = 'VNUF2Helper2026';
  const V2_PREFIX = 'v2:';

  // Tương thích Chrome + Firefox
  const storageApi = (typeof browser !== 'undefined' && browser.storage)
    ? browser.storage.local
    : chrome.storage.local;

  let keyPromise = null;

  // --- Legacy XOR (V1) ---
  function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  function legacyEncode(password) {
    if (!password) return '';
    const xored = xorEncrypt(password, OLD_KEY);
    return btoa(unescape(encodeURIComponent(xored)));
  }

  function legacyDecode(encoded) {
    if (!encoded) return '';
    try {
      const xored = decodeURIComponent(escape(atob(encoded)));
      return xorEncrypt(xored, OLD_KEY);
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã V1:', e);
      return '';
    }
  }

  // --- AES-GCM (V2) ---

  // Lấy hoặc tạo khoá AES-GCM (lưu trong storage)
  async function getOrGenerateKey() {
    if (keyPromise) return keyPromise;

    keyPromise = (async () => {
      try {
        const data = await new Promise(resolve => storageApi.get('vnuf2_crypto_key', resolve));

        if (data.vnuf2_crypto_key) {
          // Khôi phục khoá từ dạng exported (JWK hoặc ArrayBuffer tùy cách lưu)
          // Đơn giản hơn: lưu ArrayBuffer dước dạng chuỗi hex / base64
          // Hoặc sử dụng JWK
          const jwk = data.vnuf2_crypto_key;
          return await crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
        } else {
          // Tạo khoá mới
          const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          // Xuất và lưu trữ
          const jwk = await crypto.subtle.exportKey('jwk', key);
          await new Promise(resolve => storageApi.set({ vnuf2_crypto_key: jwk }, resolve));
          return key;
        }
      } catch (e) {
        console.error('[VNUF2] Lỗi lấy/tạo khoá:', e);
        throw e;
      }
    })();

    return keyPromise;
  }

  // Chuyển string thành ArrayBuffer
  function str2ab(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  // Chuyển ArrayBuffer thành string
  function ab2str(buf) {
    const decoder = new TextDecoder();
    return decoder.decode(buf);
  }

  // Chuyển ArrayBuffer thành base64
  function ab2base64(buf) {
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Chuyển base64 thành ArrayBuffer
  function base642ab(base64) {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function encode(password) {
    if (!password) return '';
    try {
      const key = await getOrGenerateKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedText = str2ab(password);

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedText
      );

      // Ghép IV và Ciphertext để lưu chung
      const ivBase64 = ab2base64(iv.buffer);
      const cipherBase64 = ab2base64(ciphertext);

      return V2_PREFIX + ivBase64 + ':' + cipherBase64;
    } catch (e) {
      console.error('[VNUF2] Lỗi mã hóa V2:', e);
      // Fallback về cách cũ nếu có lỗi (để đảm bảo không bị crash hoàn toàn)
      return legacyEncode(password);
    }
  }

  async function decode(encoded) {
    if (!encoded) return '';

    // Tương thích ngược: nếu không có prefix v2:, dùng cách cũ
    if (!encoded.startsWith(V2_PREFIX)) {
      return legacyDecode(encoded);
    }

    try {
      const key = await getOrGenerateKey();
      // Bỏ 'v2:'
      const dataStr = encoded.substring(V2_PREFIX.length);
      const parts = dataStr.split(':');

      if (parts.length !== 2) throw new Error('Dữ liệu mã hoá không hợp lệ');

      const iv = base642ab(parts[0]);
      const ciphertext = base642ab(parts[1]);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        ciphertext
      );

      return ab2str(decrypted);
    } catch (e) {
      console.error('[VNUF2] Lỗi giải mã V2:', e);
      return '';
    }
  }

  return { encode, decode };
})();
