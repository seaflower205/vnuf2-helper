// ============================================
// VNUF2 Helper — service-worker.js (Background)
// Grade Notifier + Alarm management
// ============================================

// Tương thích Chrome + Firefox
const storageApi = (typeof browser !== 'undefined' && browser.storage)
  ? browser.storage.local
  : chrome.storage.local;

const ALARM_NAME = 'vnuf2-grade-check';
const CHECK_INTERVAL_MINUTES = 30;

// ============================================
// Alarm Setup
// ============================================
chrome.alarms.create(ALARM_NAME, {
  delayInMinutes: 1,
  periodInMinutes: CHECK_INTERVAL_MINUTES
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  try {
    // Đọc settings
    const data = await new Promise(r => storageApi.get('vnuf2_settings', r));
    const settings = data.vnuf2_settings || {};

    if (!settings.gradeNotifier) return; // Đã tắt tính năng

    await checkForNewGrades();
  } catch (e) {
    console.error('[VNUF2 BG] Grade check error:', e);
  }
});

// ============================================
// Grade Check Logic
// ============================================
async function checkForNewGrades() {
  // Đọc cache cũ
  const cacheData = await new Promise(r => storageApi.get('vnuf2_grade_cache', r));
  const oldGrades = cacheData.vnuf2_grade_cache || [];

  // Thử fetch điểm mới
  // Lưu ý: Cần session cookie còn hiệu lực, nếu không sẽ fail
  try {
    const response = await fetch('https://daotao.vnuf2.edu.vn/api/diem/all', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Session hết hạn hoặc API thay đổi
      console.log('[VNUF2 BG] Fetch điểm thất bại (session hết hạn?):', response.status);
      return;
    }

    const newGrades = await response.json();

    if (!Array.isArray(newGrades) || newGrades.length === 0) return;

    // So sánh: tìm môn mới có điểm mà cache cũ chưa có
    const oldIds = new Set(oldGrades.map(g => g.id || g.maMH || JSON.stringify(g)));
    const newItems = newGrades.filter(g => {
      const gId = g.id || g.maMH || JSON.stringify(g);
      return !oldIds.has(gId);
    });

    if (newItems.length > 0) {
      // Có điểm mới!
      const names = newItems.map(g => g.tenMH || g.tenMonHoc || 'Môn học mới').slice(0, 3);
      const title = `🎓 Bạn có ${newItems.length} điểm mới!`;
      const message = names.join(', ') + (newItems.length > 3 ? '...' : '');

      chrome.notifications.create('vnuf2-grade-' + Date.now(), {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: title,
        message: message,
        priority: 2
      });
    }

    // Cập nhật cache
    await new Promise(r => storageApi.set({ vnuf2_grade_cache: newGrades }, r));

  } catch (e) {
    // Network error hoặc CORS — bình thường nếu user chưa login
    console.log('[VNUF2 BG] Không thể fetch điểm:', e.message);
  }
}

// ============================================
// Notification Click → mở trang điểm
// ============================================
chrome.notifications.onClicked.addListener((notifId) => {
  if (notifId.startsWith('vnuf2-grade-')) {
    chrome.tabs.create({ url: 'https://daotao.vnuf2.edu.vn/#/diem' });
  }
});

// ============================================
// Install / Update
// ============================================
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[VNUF2 Helper] Extension installed!');
    // Mở trang VNUF2 khi cài xong
    chrome.tabs.create({ url: 'https://daotao.vnuf2.edu.vn/#/home' });
  }
});
