// ============================================
// VNUF2 Helper — crypto.js
// Mã hoá/giải mã mật khẩu an toàn (AES-GCM qua Web Crypto API)
// ============================================

const VNUF2Crypto = (() => {
  const LEGACY_KEY = 'VNUF2Helper2026';
  const SECURE_KEY_STORAGE = 'vnuf2_secure_key';

  // Cache promise để tránh race conditions khi nhiều component gọi cùng lúc
  let keyPromise = null;

  // Lấy hoặc tạo key an toàn mới
  async function getSecureKey() {
    if (keyPromise) return keyPromise;

    keyPromise = (async () => {
      const api = (typeof browser !== 'undefined' && browser.storage)
        ? browser.storage.local
        : chrome.storage.local;

      return new Promise((resolve) => {
        api.get(SECURE_KEY_STORAGE, async (data) => {
          if (data[SECURE_KEY_STORAGE]) {
            try {
              // Import key từ raw bytes đã lưu
              const rawKey = new Uint8Array(data[SECURE_KEY_STORAGE]);
              const key = await crypto.subtle.importKey(
                'raw',
                rawKey,
                'AES-GCM',
                true,
                ['encrypt', 'decrypt']
              );
              resolve(key);
              return;
            } catch (e) {
              console.warn('[VNUF2] Lỗi import secure key, tạo mới:', e);
            }
          }

          // Tạo key mới nếu chưa có hoặc lỗi
          try {
            const key = await crypto.subtle.generateKey(
              { name: 'AES-GCM', length: 256 },
              true,
              ['encrypt', 'decrypt']
            );

            // Lưu lại dưới dạng raw
            const rawKeyBuffer = await crypto.subtle.exportKey('raw', key);
            const rawKeyArray = Array.from(new Uint8Array(rawKeyBuffer));

            api.set({ [SECURE_KEY_STORAGE]: rawKeyArray }, () => {
              resolve(key);
            });
          } catch (e) {
            console.error('[VNUF2] Không thể tạo secure key:', e);
            resolve(null);
          }
        });
      });
    })();

    return keyPromise;
  }

  // --- Legacy XOR (để đọc dữ liệu cũ) ---
  function legacyXorEncrypt(text, key) {
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
      return legacyXorEncrypt(xored, LEGACY_KEY);
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã legacy:', e);
      return '';
    }
  }

  // --- Secure AES-GCM ---
  async function encode(password) {
    if (!password) return '';
    try {
      const key = await getSecureKey();
      if (!key) throw new Error('No key available');

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedText = new TextEncoder().encode(password);

      const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedText
      );

      // Kết hợp IV và cipher text, mã hoá Base64
      const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(cipherBuffer), iv.length);

      let binary = '';
      for (let i = 0; i < combined.byteLength; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return 'v2:' + btoa(binary);
    } catch (e) {
      console.error('[VNUF2] Lỗi mã hoá mới:', e);
      // Fallback cho an toàn nếu không thể mã hoá (không nên lưu plain)
      return '';
    }
  }

  async function decode(encoded) {
    if (!encoded) return '';

    // Xử lý backward compatibility
    if (!encoded.startsWith('v2:')) {
      return legacyDecode(encoded);
    }

    try {
      const key = await getSecureKey();
      if (!key) throw new Error('No key available');

      const b64Data = encoded.substring(3); // Bỏ prefix 'v2:'
      const binaryString = atob(b64Data);

      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }

      const iv = combined.slice(0, 12);
      const cipherText = combined.slice(12);

      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherText
      );

      return new TextDecoder().decode(plainBuffer);
    } catch (e) {
      console.warn('[VNUF2] Lỗi giải mã mới:', e);
      return '';
    }
  }

  return { encode, decode };
})();
