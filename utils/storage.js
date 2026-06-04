// ============================================
// VNUF2 Helper — storage.js
// Wrapper thống nhất cho chrome.storage / browser.storage
// ============================================

const VNUF2Storage = (() => {
  // Detect Chrome vs Firefox
  const api = (typeof browser !== 'undefined' && browser.storage)
    ? browser.storage.local
    : chrome.storage.local;

  const KEYS = {
    ACCOUNTS: 'vnuf2_accounts',
    SETTINGS: 'vnuf2_settings',
    GRADE_CACHE: 'vnuf2_grade_cache',
    PENDING_LOGIN: 'vnuf2_pending_login'
  };

  const DEFAULT_SETTINGS = {
    autoLogin: true,
    darkMode: false,
    gradeNotifier: true,
    courseSnipperEnabled: false,
    courseSnipperDelay: 5,
    courseSnipperCodes: '',
    autoFillMode: 'full' // 'full' hoặc 'random'
  };

  // --- Accounts ---
  async function getAccounts() {
    return new Promise((resolve) => {
      api.get(KEYS.ACCOUNTS, async (data) => {
        const accounts = data[KEYS.ACCOUNTS] || [];
        // Giải mã mật khẩu khi đọc
        const decodedAccounts = await Promise.all(accounts.map(async acc => ({
          ...acc,
          password: await VNUF2Crypto.decode(acc.password)
        })));
        resolve(decodedAccounts);
      });
    });
  }

  async function saveAccounts(accounts) {
    // Mã hoá mật khẩu trước khi lưu
    const encodedAccounts = await Promise.all(accounts.map(async acc => ({
      ...acc,
      password: await VNUF2Crypto.encode(acc.password)
    })));
    return new Promise((resolve) => {
      api.set({ [KEYS.ACCOUNTS]: encodedAccounts }, resolve);
    });
  }

  async function addAccount(username, password, isDefault = false) {
    const accounts = await getAccounts();
    // Nếu đặt default thì bỏ default cũ
    if (isDefault) {
      accounts.forEach(a => a.isDefault = false);
    }
    // Kiểm tra trùng
    const existing = accounts.findIndex(a => a.username === username);
    if (existing >= 0) {
      accounts[existing].password = password;
      accounts[existing].isDefault = isDefault;
    } else {
      accounts.push({ username, password, isDefault });
    }
    await saveAccounts(accounts);
    return accounts;
  }

  async function removeAccount(username) {
    let accounts = await getAccounts();
    accounts = accounts.filter(a => a.username !== username);
    await saveAccounts(accounts);
    return accounts;
  }

  async function getDefaultAccount() {
    const accounts = await getAccounts();
    return accounts.find(a => a.isDefault) || accounts[0] || null;
  }

  // --- Settings ---
  async function getSettings() {
    return new Promise((resolve) => {
      api.get(KEYS.SETTINGS, (data) => {
        resolve({ ...DEFAULT_SETTINGS, ...(data[KEYS.SETTINGS] || {}) });
      });
    });
  }

  async function saveSettings(settings) {
    const current = await getSettings();
    const merged = { ...current, ...settings };
    return new Promise((resolve) => {
      api.set({ [KEYS.SETTINGS]: merged }, resolve);
    });
  }

  // --- Grade Cache (cho Grade Notifier) ---
  async function getGradeCache() {
    return new Promise((resolve) => {
      api.get(KEYS.GRADE_CACHE, (data) => {
        resolve(data[KEYS.GRADE_CACHE] || []);
      });
    });
  }

  async function saveGradeCache(grades) {
    return new Promise((resolve) => {
      api.set({ [KEYS.GRADE_CACHE]: grades }, resolve);
    });
  }

  // --- Pending Login (cho Đăng nhập nhanh) ---
  async function getPendingLogin() {
    return new Promise((resolve) => {
      api.get(KEYS.PENDING_LOGIN, async (data) => {
        const val = data[KEYS.PENDING_LOGIN] || null;
        if (val) {
          resolve({
            username: val.username,
            password: await VNUF2Crypto.decode(val.password)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async function setPendingLogin(username, password) {
    const val = {
      username,
      password: await VNUF2Crypto.encode(password)
    };
    return new Promise((resolve) => {
      api.set({ [KEYS.PENDING_LOGIN]: val }, resolve);
    });
  }

  async function clearPendingLogin() {
    return new Promise((resolve) => {
      api.remove(KEYS.PENDING_LOGIN, resolve);
    });
  }

  return {
    getAccounts,
    saveAccounts,
    addAccount,
    removeAccount,
    getDefaultAccount,
    getSettings,
    saveSettings,
    getGradeCache,
    saveGradeCache,
    getPendingLogin,
    setPendingLogin,
    clearPendingLogin,
    KEYS,
    DEFAULT_SETTINGS
  };
})();
