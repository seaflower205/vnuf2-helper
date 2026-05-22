// ============================================
// VNUF2 Helper — auto-login.js
// Tự động đăng nhập khi phát hiện form login
// ============================================

const VNUF2AutoLogin = (() => {
  let initialized = false;
  let loginInProgress = false;

  async function init() {
    if (loginInProgress) return;

    // 1. Kiểm tra có yêu cầu đăng nhập nhanh (pending login) không trước tiên
    const pending = await VNUF2Storage.getPendingLogin();
    if (pending) {
      loginInProgress = true;
      // Nếu có pending login, ta xoá session hiện tại để bắt buộc đăng nhập tài khoản mới
      sessionStorage.clear();
      await VNUF2Storage.clearPendingLogin();
      
      const route = VNUF2DOM.getCurrentRoute();
      if (!route.includes('login')) {
        window.location.hash = '#/login';
      }
      
      try {
        await tryAutoLogin(pending);
      } catch (e) {
        console.warn('[VNUF2] Lỗi đăng nhập nhanh:', e.message);
      } finally {
        loginInProgress = false;
      }
      return;
    }

    // 2. Nếu không có pending login, kiểm tra trạng thái đăng nhập bình thường
    const currentUser = sessionStorage.getItem('CURRENT_USER');
    if (currentUser) {
      return;
    }

    // 3. Chỉ chạy tự động đăng nhập thông thường nếu đang ở trang login hoặc có input password
    const route = VNUF2DOM.getCurrentRoute();
    const hasPasswordInput = document.querySelector('input[type="password"]');
    if (!route.includes('login') && !hasPasswordInput) {
      return;
    }

    if (initialized) return;
    initialized = true;

    // 4. Đăng nhập tự động thông thường (nếu bật cài đặt)
    const settings = await VNUF2Storage.getSettings();
    if (!settings.autoLogin) return;

    loginInProgress = true;
    try {
      await tryAutoLogin();
    } catch (e) {
      console.log('[VNUF2] Không tìm thấy form login hoặc đã login:', e.message);
    } finally {
      loginInProgress = false;
    }
  }

  async function tryAutoLogin(credentials = null) {
    // Lấy credentials
    let username, password;
    if (credentials) {
      username = credentials.username;
      password = credentials.password;
    } else {
      const account = await VNUF2Storage.getDefaultAccount();
      if (!account) return;
      username = account.username;
      password = account.password;
    }

    // Đợi input password xuất hiện
    try {
      await VNUF2DOM.waitForElement('input[type="password"]', 5000);
    } catch (e) {
      console.log('[VNUF2] Không tìm thấy form đăng nhập:', e.message);
      return;
    }

    // Tìm input username và password
    const inputs = document.querySelectorAll('input');
    let usernameInput = null;
    let passwordInput = null;

    for (const input of inputs) {
      const type = input.getAttribute('type') || 'text';
      const formcontrol = input.getAttribute('formcontrolname') || '';
      if (type === 'password' || formcontrol.toLowerCase().includes('pass')) {
        passwordInput = input;
      } else if (type === 'text' || formcontrol.toLowerCase().includes('user') || formcontrol.toLowerCase().includes('name')) {
        if (!usernameInput) usernameInput = input;
      }
    }

    if (!usernameInput || !passwordInput) {
      console.log('[VNUF2] Không tìm thấy đủ các ô nhập liệu');
      return;
    }

    // Điền thông tin
    VNUF2DOM.setAngularValue(usernameInput, username);
    await new Promise(r => setTimeout(r, 200));
    VNUF2DOM.setAngularValue(passwordInput, password);
    await new Promise(r => setTimeout(r, 200));

    // Tìm và click nút đăng nhập
    const loginBtn = document.querySelector('button[type="submit"], button.btn-primary');
    if (loginBtn) {
      loginBtn.click();
      VNUF2DOM.showToast('🔑 Đã tự động đăng nhập!', 'success');
    }
  }

  function reset() {
    initialized = false;
    loginInProgress = false;
  }

  return { init, tryAutoLogin, reset };
})();
