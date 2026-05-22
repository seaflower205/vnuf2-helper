// ============================================
// VNUF2 Helper — course-snipper.js
// Tool "Săn" Môn Học tự động
// ============================================

const VNUF2CourseSniper = (() => {
  let initialized = false;
  let sniperInterval = null;
  let isRunning = false;

  async function init() {
    if (initialized) return;
    initialized = true;

    await VNUF2DOM.waitForSpinnerHide();
    await new Promise(r => setTimeout(r, 800));

    const settings = await VNUF2Storage.getSettings();
    if (!settings.courseSnipperEnabled) return;

    // Tạo panel Snipper
    const mainContent = document.querySelector('main.right-content') || document.querySelector('main');
    if (!mainContent) return;

    const panel = document.createElement('div');
    panel.id = 'vnuf2-snipper-panel';
    panel.style.cssText = `
      background: #f8d7da;
      border: 2px solid #dc3545;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 8px 16px;
      font-size: 13px;
      font-family: Arial, sans-serif;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'font-weight:bold; font-size:14px; margin-bottom:8px; color:#dc3545;';
    header.textContent = '🎯 VNUF2 Course Snipper';
    panel.appendChild(header);

    // Input mã MH
    const inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap;';

    const labelCode = document.createElement('label');
    labelCode.textContent = 'Mã MH:';
    labelCode.style.fontWeight = 'bold';
    inputRow.appendChild(labelCode);

    const inputCode = document.createElement('input');
    inputCode.id = 'vnuf2-snipper-codes';
    inputCode.name = 'vnuf2-snipper-codes';
    inputCode.type = 'text';
    inputCode.value = settings.courseSnipperCodes || '';
    inputCode.placeholder = 'VD: XQGIS21, DAQHD';
    inputCode.style.cssText = 'flex:1; padding:4px 8px; border:1px solid #dc3545; border-radius:4px; font-size:12px; min-width:150px;';
    inputRow.appendChild(inputCode);

    const labelDelay = document.createElement('label');
    labelDelay.textContent = 'Delay:';
    labelDelay.style.fontWeight = 'bold';
    inputRow.appendChild(labelDelay);

    const inputDelay = document.createElement('input');
    inputDelay.id = 'vnuf2-snipper-delay';
    inputDelay.name = 'vnuf2-snipper-delay';
    inputDelay.type = 'number';
    inputDelay.min = '3';
    inputDelay.max = '30';
    inputDelay.value = settings.courseSnipperDelay || 5;
    inputDelay.style.cssText = 'width:50px; padding:4px; border:1px solid #dc3545; border-radius:4px; font-size:12px;';
    inputRow.appendChild(inputDelay);

    const sLabel = document.createElement('span');
    sLabel.textContent = 'giây';
    inputRow.appendChild(sLabel);

    panel.appendChild(inputRow);

    // Buttons
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:8px; align-items:center;';

    const btnStart = document.createElement('button');
    btnStart.id = 'vnuf2-snipper-start';
    btnStart.textContent = '🎯 Bắt đầu Săn';
    btnStart.style.cssText = 'background:#dc3545;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;';
    btnStart.addEventListener('click', toggleSniping);
    btnRow.appendChild(btnStart);

    const statusText = document.createElement('span');
    statusText.id = 'vnuf2-snipper-status';
    statusText.style.cssText = 'color:#666; font-size:11px;';
    statusText.textContent = '⏸ Đang chờ...';
    btnRow.appendChild(statusText);

    panel.appendChild(btnRow);

    // Log area
    const logArea = document.createElement('div');
    logArea.id = 'vnuf2-snipper-log';
    logArea.style.cssText = `
      margin-top: 8px;
      max-height: 120px;
      overflow-y: auto;
      font-size: 11px;
      font-family: monospace;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 6px;
      display: none;
    `;
    panel.appendChild(logArea);

    // Chèn vào trang
    const firstChild = mainContent.querySelector('.container-fluid') || mainContent.firstElementChild;
    if (firstChild) {
      firstChild.parentElement.insertBefore(panel, firstChild);
    } else {
      mainContent.prepend(panel);
    }
  }

  function toggleSniping() {
    if (isRunning) {
      stopSniping();
    } else {
      startSniping();
    }
  }

  function startSniping() {
    const codesInput = document.getElementById('vnuf2-snipper-codes');
    const delayInput = document.getElementById('vnuf2-snipper-delay');
    const btnStart = document.getElementById('vnuf2-snipper-start');
    const statusEl = document.getElementById('vnuf2-snipper-status');
    const logArea = document.getElementById('vnuf2-snipper-log');

    if (!codesInput || !codesInput.value.trim()) {
      VNUF2DOM.showToast('❌ Vui lòng nhập mã môn học cần săn!', 'error');
      return;
    }

    const codes = codesInput.value.trim().split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    const delay = Math.max(3, parseInt(delayInput.value) || 5) * 1000;

    isRunning = true;
    btnStart.textContent = '⏹ Dừng Săn';
    btnStart.style.background = '#6c757d';
    statusEl.textContent = '🔴 Đang săn...';
    statusEl.style.color = '#dc3545';
    logArea.style.display = 'block';

    addLog(`Bắt đầu săn: ${codes.join(', ')} | Delay: ${delay / 1000}s`);

    // Bắt đầu vòng lặp
    checkAndRegister(codes);
    sniperInterval = setInterval(() => checkAndRegister(codes), delay);
  }

  function stopSniping() {
    clearInterval(sniperInterval);
    sniperInterval = null;
    isRunning = false;

    const btnStart = document.getElementById('vnuf2-snipper-start');
    const statusEl = document.getElementById('vnuf2-snipper-status');

    if (btnStart) {
      btnStart.textContent = '🎯 Bắt đầu Săn';
      btnStart.style.background = '#dc3545';
    }
    if (statusEl) {
      statusEl.textContent = '⏸ Đã dừng';
      statusEl.style.color = '#666';
    }
    addLog('⏹ Đã dừng săn.');
  }

  function checkAndRegister(targetCodes) {
    // Tìm bảng "Danh sách môn học mở cho đăng ký"
    const tables = document.querySelectorAll('table');
    let targetTable = null;

    for (const table of tables) {
      const headerText = table.textContent || '';
      if (headerText.includes('Còn lại') || headerText.includes('Số lượng')) {
        targetTable = table;
        break;
      }
    }

    if (!targetTable) {
      addLog('⚠ Không tìm thấy bảng danh sách môn.');
      return;
    }

    const rows = targetTable.querySelectorAll('tbody tr');
    let found = false;

    rows.forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length < 5) return;

      // Tìm mã MH trong row
      const rowText = tr.textContent.toUpperCase();
      const matchedCode = targetCodes.find(code => rowText.includes(code));

      if (!matchedCode) return;

      // Tìm cột "Còn lại"
      let remaining = -1;
      cells.forEach(td => {
        const val = parseInt(td.textContent.trim());
        // Tìm cột có số nhỏ (thường là cột Còn lại)
        if (!isNaN(val) && val >= 0 && val < 200) {
          // Heuristic: cột Còn lại thường ở sau cột Số lượng
          remaining = val;
        }
      });

      const now = new Date().toLocaleTimeString('vi-VN');

      if (remaining > 0) {
        addLog(`✅ [${now}] ${matchedCode}: Còn ${remaining} chỗ! Đang đăng ký...`);
        found = true;

        // Tìm và click nút đăng ký trong hàng
        const registerBtn = tr.querySelector('button, a.btn, input[type="button"]');
        if (registerBtn) {
          registerBtn.click();
          addLog(`🎉 [${now}] Đã click đăng ký ${matchedCode}!`);
          VNUF2DOM.showToast(`🎉 Đã đăng ký ${matchedCode}!`, 'success');

          // Chờ và kiểm tra kết quả
          setTimeout(() => {
            addLog(`⏳ Đang kiểm tra kết quả đăng ký ${matchedCode}...`);
          }, 2000);
        } else {
          // Thử click vào row
          tr.click();
          addLog(`⚠ [${now}] Không tìm thấy nút ĐK, đã click vào row.`);
        }
      } else {
        addLog(`⏳ [${now}] ${matchedCode}: Còn lại = ${remaining}. Đợi tiếp...`);
      }
    });

    if (!found) {
      const now = new Date().toLocaleTimeString('vi-VN');
      addLog(`⏳ [${now}] Chưa có chỗ trống. Kiểm tra lại sau...`);
    }
  }

  function addLog(msg) {
    const logArea = document.getElementById('vnuf2-snipper-log');
    if (!logArea) return;
    const line = document.createElement('div');
    line.textContent = msg;
    logArea.appendChild(line);
    logArea.scrollTop = logArea.scrollHeight;
  }

  function reset() {
    if (isRunning) stopSniping();
    initialized = false;
    const panel = document.getElementById('vnuf2-snipper-panel');
    if (panel) panel.remove();
  }

  return { init, reset };
})();
