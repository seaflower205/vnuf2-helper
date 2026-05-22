// ============================================
// VNUF2 Helper — dark-mode.js
// Chế độ tối (Dark Mode)
// ============================================

const VNUF2DarkMode = (() => {
  let initialized = false;
  let isActive = false;

  const DARK_CSS = `
    /* === VNUF2 Helper Dark Mode === */
    body,
    .layout-container,
    .right-content,
    main {
      background-color: #1a1a2e !important;
      color: #e0e0e0 !important;
    }

    /* Header */
    header, .header, nav, .nav-bar, .navbar {
      background-color: #16213e !important;
      color: #e0e0e0 !important;
      border-bottom-color: #2a3a5c !important;
    }

    /* Sidebar */
    aside, .left-sidebar, .left-sidebar.active {
      background-color: #0f3460 !important;
      color: #e0e0e0 !important;
    }

    .menu-item, .text-cus, .text-cus a {
      color: #b8c6db !important;
    }

    .menu-item:hover, .text-cus:hover {
      background-color: #1a4a7a !important;
    }

    .menu-item.active, .text-cus.active {
      background-color: #28a745 !important;
      color: #fff !important;
    }

    /* Tables */
    table, .table {
      background-color: #16213e !important;
      color: #e0e0e0 !important;
      border-color: #2a3a5c !important;
    }

    thead, thead th, thead td {
      background-color: #0f3460 !important;
      color: #fff !important;
      border-color: #2a3a5c !important;
    }

    tbody tr {
      background-color: #1a1a2e !important;
      border-color: #2a3a5c !important;
    }

    tbody tr:nth-child(even) {
      background-color: #16213e !important;
    }

    tbody tr:hover {
      background-color: #1e3a5f !important;
    }

    td, th {
      border-color: #2a3a5c !important;
      color: #e0e0e0 !important;
    }

    /* TKB warning cells (giữ nguyên nhận diện) */
    .table-warning, td.table-warning {
      background-color: #3d3200 !important;
      color: #ffc107 !important;
      border-color: #665200 !important;
    }

    /* Cards, panels */
    .card, .panel, .container-fluid, .container {
      background-color: #16213e !important;
      color: #e0e0e0 !important;
      border-color: #2a3a5c !important;
    }

    /* Forms */
    input, select, textarea, .form-control {
      background-color: #1a1a2e !important;
      color: #e0e0e0 !important;
      border-color: #2a3a5c !important;
    }

    input::placeholder {
      color: #6c757d !important;
    }

    /* Buttons - giữ màu xanh lá VNUF2 */
    .btn-primary {
      background-color: #28a745 !important;
      border-color: #28a745 !important;
    }

    .btn-outline-primary {
      color: #28a745 !important;
      border-color: #28a745 !important;
    }

    /* Links */
    a {
      color: #6db3f2 !important;
    }

    /* Dropdown */
    .dropdown-menu {
      background-color: #16213e !important;
      border-color: #2a3a5c !important;
    }

    .dropdown-item {
      color: #e0e0e0 !important;
    }

    .dropdown-item:hover {
      background-color: #1e3a5f !important;
    }

    /* Spinner */
    ngx-spinner .ngx-spinner-overlay {
      background-color: rgba(0, 0, 0, 0.7) !important;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #1a1a2e;
    }
    ::-webkit-scrollbar-thumb {
      background: #2a3a5c;
      border-radius: 4px;
    }

    /* Footer, misc */
    .bg-white {
      background-color: #16213e !important;
    }

    .text-dark {
      color: #e0e0e0 !important;
    }

    .bg-light {
      background-color: #1a1a2e !important;
    }

    .border {
      border-color: #2a3a5c !important;
    }

    /* Modal */
    .modal-content {
      background-color: #16213e !important;
      color: #e0e0e0 !important;
      border-color: #2a3a5c !important;
    }

    .modal-header, .modal-footer {
      border-color: #2a3a5c !important;
    }

    /* Alert */
    .alert {
      background-color: #1e3a5f !important;
      color: #e0e0e0 !important;
      border-color: #2a3a5c !important;
    }

    /* Primary bg override */
    .bg-primary {
      background-color: #0f3460 !important;
    }

    /* Addon buttons container */
    #vnuf2-addon-buttons-container {
      background-color: #16213e !important;
      border-color: #28a745 !important;
    }
  `;

  async function init() {
    if (initialized) return;
    initialized = true;

    const settings = await VNUF2Storage.getSettings();
    if (settings.darkMode) {
      enable();
    }

    // Inject toggle button vào header
    injectToggle();

    // Lắng nghe settings update
    const msgApi = (typeof browser !== 'undefined') ? browser.runtime : chrome.runtime;
    msgApi.onMessage.addListener((msg) => {
      if (msg.action === 'SETTINGS_UPDATED' && msg.settings) {
        if (msg.settings.darkMode) {
          enable();
        } else {
          disable();
        }
      }
    });
  }

  function enable() {
    if (document.getElementById('vnuf2-darkmode-css')) return;
    const style = document.createElement('style');
    style.id = 'vnuf2-darkmode-css';
    style.textContent = DARK_CSS;
    document.head.appendChild(style);
    isActive = true;
    updateToggleBtn();
  }

  function disable() {
    const style = document.getElementById('vnuf2-darkmode-css');
    if (style) style.remove();
    isActive = false;
    updateToggleBtn();
  }

  function toggle() {
    if (isActive) {
      disable();
      VNUF2Storage.saveSettings({ darkMode: false });
    } else {
      enable();
      VNUF2Storage.saveSettings({ darkMode: true });
    }
  }

  function injectToggle() {
    const header = document.querySelector('header') || document.querySelector('.header');
    if (!header) return;
    if (document.getElementById('vnuf2-darkmode-toggle')) return;

    const btn = document.createElement('button');
    btn.id = 'vnuf2-darkmode-toggle';
    btn.style.cssText = `
      background: none;
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 10px;
    `;
    btn.textContent = isActive ? '☀️' : '🌙';
    btn.title = 'Bật/Tắt Dark Mode';
    btn.addEventListener('click', toggle);

    // Chèn vào cuối header
    const navBar = header.querySelector('.d-flex') || header.querySelector('nav') || header;
    navBar.appendChild(btn);
  }

  function updateToggleBtn() {
    const btn = document.getElementById('vnuf2-darkmode-toggle');
    if (btn) {
      btn.textContent = isActive ? '☀️' : '🌙';
    }
  }

  function reset() {
    initialized = false;
  }

  return { init, reset, enable, disable, toggle };
})();
