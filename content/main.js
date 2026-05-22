// ============================================
// VNUF2 Helper — main.js
// Entry point / Router cho content scripts
// ============================================

(() => {
  console.log('[VNUF2 Helper] Content script loaded!');

  let currentRoute = '';

  // ============================================
  // Route handler — kích hoạt module tương ứng
  // ============================================
  async function handleRoute() {
    const route = VNUF2DOM.getCurrentRoute();

    // Nếu route không thay đổi, bỏ qua
    if (route === currentRoute) return;

    // Reset modules cũ khi chuyển trang
    resetModules();
    currentRoute = route;

    console.log('[VNUF2] Route:', route);

    // Dark Mode chạy trên mọi trang
    try {
      await VNUF2DarkMode.init();
    } catch (e) {
      console.warn('[VNUF2] Dark mode error:', e);
    }

    // Route-based activation
    try {
      await VNUF2AutoLogin.init();

      if (route.includes('tkb-tuan')) {
        await VNUF2CopyTKB.init(route);
        await VNUF2ExportCalendar.init();
      } else if (route.includes('tkb-hocky')) {
        await VNUF2CopyTKB.init(route);
      } else if (route.includes('lichthi')) {
        await VNUF2CopyTKB.init(route);
      } else if (route.includes('diem')) {
        await VNUF2GPA.init();
      } else if (route.includes('danhgia') || route.includes('ksdg')) {
        await VNUF2AutoFill.init(route);
      } else if (route.includes('danhgiarenluyen')) {
        await VNUF2AutoFill.init(route);
      } else if (route.includes('dangkymonhoc') || route.includes('dkmh')) {
        await VNUF2CourseSniper.init();
      }
    } catch (e) {
      console.error('[VNUF2] Module error:', e);
    }
  }

  function resetModules() {
    // Reset trạng thái các module để tránh inject trùng
    try { VNUF2AutoLogin.reset(); } catch (e) { /* ignore */ }
    try { VNUF2CopyTKB.reset(); } catch (e) { /* ignore */ }
    try { VNUF2ExportCalendar.reset(); } catch (e) { /* ignore */ }
    try { VNUF2GPA.reset(); } catch (e) { /* ignore */ }
    try { VNUF2AutoFill.reset(); } catch (e) { /* ignore */ }
    try { VNUF2CourseSniper.reset(); } catch (e) { /* ignore */ }
  }

  // ============================================
  // Lắng nghe sự kiện chuyển trang (SPA navigation)
  // ============================================
  // 1. Lắng nghe hashchange
  window.addEventListener('hashchange', () => {
    handleRoute();
  });

  // 2. Lắng nghe popstate (trình duyệt back/forward)
  window.addEventListener('popstate', () => {
    handleRoute();
  });

  // 3. Polling dự phòng cho programmatic navigation (như Angular router dùng pushState/replaceState)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      handleRoute();
    }
  }, 250);

  // ============================================
  // Lắng nghe messages từ popup
  // ============================================
  const msgApi = (typeof browser !== 'undefined') ? browser.runtime : chrome.runtime;
  msgApi.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'SETTINGS_UPDATED') {
      console.log('[VNUF2] Settings updated từ popup');
      // Re-init dark mode nếu cần
      if (msg.settings && typeof msg.settings.darkMode !== 'undefined') {
        if (msg.settings.darkMode) {
          VNUF2DarkMode.enable();
        } else {
          VNUF2DarkMode.disable();
        }
      }
      sendResponse({ ok: true });
    }
  });

  // ============================================
  // Init lần đầu
  // ============================================
  // Đợi Angular boot xong
  if (document.readyState === 'complete') {
    setTimeout(handleRoute, 500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(handleRoute, 500);
    });
  }
})();

