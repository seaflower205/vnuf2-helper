// ============================================
// VNUF2 Helper — popup.js
// Logic quản lý tài khoản và cài đặt trong Popup
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // --- Tab switching ---
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // --- Load & Render Accounts ---
  // --- Quick Login Handler ---
  async function doQuickLogin(acc) {
    if (!acc) return;

    // Lưu credentials tạm vào storage
    await VNUF2Storage.setPendingLogin(acc.username, acc.password);

    const targetUrl = 'https://daotao.vnuf2.edu.vn';
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes('daotao.vnuf2.edu.vn')) {
      // Nếu đang ở cổng đào tạo VNUF2, reload để kích hoạt lại toàn bộ content scripts
      chrome.tabs.reload(tab.id);
    } else {
      // Nếu ở trang khác, mở tab mới
      chrome.tabs.create({ url: targetUrl });
    }
    window.close();
  }

  // --- Load & Render Accounts ---
  async function renderAccounts() {
    const accounts = await VNUF2Storage.getAccounts();
    const list = document.getElementById('account-list');
    list.innerHTML = '';

    // Khởi tạo nút đăng nhập nhanh
    const defaultAcc = await VNUF2Storage.getDefaultAccount();
    const btnQuick = document.getElementById('btn-quick-login');
    if (defaultAcc) {
      btnQuick.style.display = 'block';
      btnQuick.textContent = `⚡ Đăng nhập nhanh (${defaultAcc.username})`;
      btnQuick.onclick = () => doQuickLogin(defaultAcc);
    } else {
      btnQuick.style.display = 'none';
    }

    if (accounts.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:#999;padding:10px;">Chưa có tài khoản nào</div>';
      return;
    }

    accounts.forEach(acc => {
      const div = document.createElement('div');
      div.className = 'account-item' + (acc.isDefault ? ' default' : '');

      const spanUser = document.createElement('span');
      spanUser.className = 'acc-user';
      spanUser.textContent = acc.username;

      const spanPass = document.createElement('span');
      spanPass.className = 'acc-pass';
      spanPass.dataset.hidden = 'true';
      spanPass.textContent = '••••••';

      const btnEye = document.createElement('button');
      btnEye.className = 'btn-eye';
      btnEye.title = 'Hiện/Ẩn MK';
      btnEye.setAttribute('aria-label', `Hiện/Ẩn mật khẩu của ${acc.username}`);
      btnEye.textContent = '👁';

      const btnStar = document.createElement('button');
      btnStar.className = 'btn-star';
      btnStar.title = 'Đặt mặc định';
      btnStar.setAttribute('aria-label', acc.isDefault ? `Bỏ mặc định cho ${acc.username}` : `Đặt mặc định cho ${acc.username}`);
      btnStar.textContent = acc.isDefault ? '★' : '☆';

      const btnLogin = document.createElement('button');
      btnLogin.className = 'btn-login';
      btnLogin.title = 'Đăng nhập';
      btnLogin.setAttribute('aria-label', `Đăng nhập bằng ${acc.username}`);
      btnLogin.textContent = '▶';

      const btnDel = document.createElement('button');
      btnDel.className = 'btn-del';
      btnDel.title = 'Xóa';
      btnDel.setAttribute('aria-label', `Xóa tài khoản ${acc.username}`);
      btnDel.textContent = '✕';

      div.appendChild(spanUser);
      div.appendChild(spanPass);
      div.appendChild(btnEye);
      div.appendChild(btnStar);
      div.appendChild(btnLogin);
      div.appendChild(btnDel);

      // Toggle hiện/ẩn mật khẩu
      div.querySelector('.btn-eye').addEventListener('click', () => {
        const span = div.querySelector('.acc-pass');
        if (span.dataset.hidden === 'true') {
          span.textContent = acc.password;
          span.dataset.hidden = 'false';
        } else {
          span.textContent = '••••••';
          span.dataset.hidden = 'true';
        }
      });

      // Đặt mặc định
      div.querySelector('.btn-star').addEventListener('click', async () => {
        const all = await VNUF2Storage.getAccounts();
        all.forEach(a => a.isDefault = (a.username === acc.username));
        await VNUF2Storage.saveAccounts(all);
        renderAccounts();
      });

      // Đăng nhập tài khoản này
      div.querySelector('.btn-login').addEventListener('click', async () => {
        await doQuickLogin(acc);
      });

      // Xóa
      div.querySelector('.btn-del').addEventListener('click', async () => {
        await VNUF2Storage.removeAccount(acc.username);
        renderAccounts();
      });

      list.appendChild(div);
    });
  }

  // --- Add Account ---
  document.getElementById('btn-add-account').addEventListener('click', async () => {
    const username = document.getElementById('inp-username').value.trim();
    const password = document.getElementById('inp-password').value;
    const isDefault = document.getElementById('inp-default').checked;

    if (!username || !password) {
      alert('Vui lòng nhập đầy đủ Mã SV và Mật khẩu!');
      return;
    }

    await VNUF2Storage.addAccount(username, password, isDefault);
    document.getElementById('inp-username').value = '';
    document.getElementById('inp-password').value = '';
    renderAccounts();
  });

  // --- Load & Render Settings ---
  async function renderSettings() {
    const s = await VNUF2Storage.getSettings();
    document.getElementById('set-autoLogin').checked = s.autoLogin;
    document.getElementById('set-darkMode').checked = s.darkMode;
    document.getElementById('set-gradeNotifier').checked = s.gradeNotifier;
    document.getElementById('set-courseSnipperEnabled').checked = s.courseSnipperEnabled;
    document.getElementById('set-courseSnipperCodes').value = s.courseSnipperCodes || '';
    document.getElementById('set-courseSnipperDelay').value = s.courseSnipperDelay || 5;

    // Auto-fill mode
    document.querySelectorAll('input[name="autoFillMode"]').forEach(r => {
      r.checked = (r.value === s.autoFillMode);
    });
  }

  // --- Save Settings ---
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const settings = {
      autoLogin: document.getElementById('set-autoLogin').checked,
      darkMode: document.getElementById('set-darkMode').checked,
      gradeNotifier: document.getElementById('set-gradeNotifier').checked,
      courseSnipperEnabled: document.getElementById('set-courseSnipperEnabled').checked,
      courseSnipperCodes: document.getElementById('set-courseSnipperCodes').value.trim(),
      courseSnipperDelay: parseInt(document.getElementById('set-courseSnipperDelay').value) || 5,
      autoFillMode: document.querySelector('input[name="autoFillMode"]:checked')?.value || 'full'
    };

    await VNUF2Storage.saveSettings(settings);

    // Thông báo content script cập nhật settings
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.startsWith('http')) {
      chrome.tabs.sendMessage(tab.id, { action: 'SETTINGS_UPDATED', settings }).catch(err => {
        console.warn('[VNUF2] Không thể gửi message SETTINGS_UPDATED (trang chưa nạp):', err.message);
      });
    }

    const btn = document.getElementById('btn-save-settings');
    btn.textContent = '✅ Đã lưu!';
    setTimeout(() => { btn.textContent = '💾 Lưu Cài đặt'; }, 1500);
  });

  // --- Init ---
  renderAccounts();
  renderSettings();
});
