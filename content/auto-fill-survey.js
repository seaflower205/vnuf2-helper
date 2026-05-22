// ============================================
// VNUF2 Helper — auto-fill-survey.js
// Tự động điền Khảo sát đánh giá & Điểm rèn luyện
// ============================================

const VNUF2AutoFill = (() => {
  let initialized = false;

  async function init(route) {
    if (initialized) return;
    initialized = true;

    await VNUF2DOM.waitForSpinnerHide();
    await new Promise(r => setTimeout(r, 800));

    const settings = await VNUF2Storage.getSettings();
    const mode = settings.autoFillMode || 'full';

    // Tìm container để chèn nút
    const mainContent = document.querySelector('main.right-content') || document.querySelector('main');
    if (!mainContent) return;

    // Tạo panel điều khiển
    const panel = document.createElement('div');
    panel.id = 'vnuf2-autofill-panel';
    panel.style.cssText = `
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-family: Arial, sans-serif;
      flex-wrap: wrap;
    `;

    const label = document.createElement('span');
    label.textContent = '⚡ VNUF2 Helper:';
    label.style.fontWeight = 'bold';
    panel.appendChild(label);

    // Nút Điền Full
    const btnFull = document.createElement('button');
    btnFull.textContent = '✅ Điền Full Điểm';
    btnFull.style.cssText = 'background:#28a745;color:#fff;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-size:12px;';
    btnFull.addEventListener('click', () => fillAll('full'));
    panel.appendChild(btnFull);

    // Nút Điền Ngẫu nhiên
    const btnRandom = document.createElement('button');
    btnRandom.textContent = '🎲 Điền Ngẫu nhiên';
    btnRandom.style.cssText = 'background:#17a2b8;color:#fff;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-size:12px;';
    btnRandom.addEventListener('click', () => fillAll('random'));
    panel.appendChild(btnRandom);

    // Status text
    const status = document.createElement('span');
    status.id = 'vnuf2-autofill-status';
    status.style.cssText = 'color:#666; font-size:11px; margin-left:auto;';
    status.textContent = 'Sẵn sàng';
    panel.appendChild(status);

    // Chèn panel vào đầu main content
    const firstChild = mainContent.querySelector('.container-fluid') || mainContent.firstElementChild;
    if (firstChild) {
      firstChild.parentElement.insertBefore(panel, firstChild);
    } else {
      mainContent.prepend(panel);
    }
  }

  function fillAll(mode) {
    const statusEl = document.getElementById('vnuf2-autofill-status');
    let count = 0;

    // ===============================
    // 1. Xử lý Radio Buttons (Khảo sát)
    // ===============================
    const radioGroups = {};
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      const name = radio.getAttribute('name') || radio.getAttribute('formcontrolname');
      if (!name) return;
      if (!Object.prototype.hasOwnProperty.call(radioGroups, name)) {
        radioGroups[name] = [];
      }
      radioGroups[name].push(radio);
    });

    for (const name of Object.keys(radioGroups)) {
      const radios = radioGroups[name];
      if (radios.length === 0) continue;

      let target;
      if (mode === 'full') {
        // Chọn option cuối cùng (thường là điểm cao nhất hoặc "Hoàn toàn đồng ý")
        target = radios[radios.length - 1];
      } else {
        // Random: chọn từ nửa trên (bỏ option thấp nhất)
        const half = Math.ceil(radios.length / 2);
        const candidates = radios.slice(half - 1); // Nửa trên
        target = candidates[Math.floor(Math.random() * candidates.length)];
      }

      if (target && !target.checked) {
        target.checked = true;
        target.dispatchEvent(new Event('change', { bubbles: true }));
        target.dispatchEvent(new Event('click', { bubbles: true }));
        count++;
      }
    }

    // ===============================
    // 2. Xử lý Input Number (Điểm rèn luyện)
    // ===============================
    document.querySelectorAll('input[type="number"]').forEach(input => {
      // Tìm điểm tối đa từ row hoặc attribute
      let maxScore = parseFloat(input.getAttribute('max')) || 0;

      // Nếu không có attr max, thử tìm từ cột "Điểm tối đa" cùng hàng
      if (maxScore === 0) {
        const tr = input.closest('tr');
        if (tr) {
          const cells = tr.querySelectorAll('td');
          cells.forEach(td => {
            const val = parseFloat(td.textContent.trim());
            if (val > 0 && val > maxScore && td !== input.closest('td')) {
              maxScore = val;
            }
          });
        }
      }

      if (maxScore <= 0) maxScore = 10; // Fallback

      let targetScore;
      if (mode === 'full') {
        targetScore = maxScore;
      } else {
        // Random từ 60% - 100% max
        const minPct = 0.6;
        targetScore = Math.round(maxScore * (minPct + Math.random() * (1 - minPct)));
      }

      VNUF2DOM.setAngularValue(input, String(targetScore));
      count++;
    });

    // ===============================
    // 3. Xử lý Checkboxes
    // ===============================
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      // Bỏ qua các checkbox hệ thống (select all, etc.)
      if (cb.id && cb.id.startsWith('vnuf2')) return;
      if (cb.closest('#vnuf2-autofill-panel')) return;

      if (!cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
        cb.dispatchEvent(new Event('click', { bubbles: true }));
        count++;
      }
    });

    // ===============================
    // 4. Xử lý Select/Dropdown
    // ===============================
    document.querySelectorAll('select').forEach(select => {
      // Bỏ qua dropdown chọn học kỳ / năm học
      if (select.closest('.filter-bar, .form-group')) return;

      const options = select.querySelectorAll('option');
      if (options.length <= 1) return;

      let target;
      if (mode === 'full') {
        target = options[options.length - 1]; // Option cuối
      } else {
        const half = Math.ceil(options.length / 2);
        const candidates = Array.from(options).slice(half);
        target = candidates[Math.floor(Math.random() * candidates.length)] || options[options.length - 1];
      }

      if (target) {
        select.value = target.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        count++;
      }
    });

    // Cập nhật status
    if (statusEl) {
      statusEl.textContent = `✅ Đã điền ${count} mục (${mode === 'full' ? 'Full điểm' : 'Ngẫu nhiên'})`;
      statusEl.style.color = '#28a745';
    }

    VNUF2DOM.showToast(`✅ Đã tự động điền ${count} mục! Nhớ bấm "Lưu" để hoàn tất.`, 'success');

    // Highlight nút Lưu
    highlightSaveButton();
  }

  function highlightSaveButton() {
    // Tìm nút Lưu / Submit
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('lưu') || text.includes('save') || text.includes('gửi') || text.includes('submit')) {
        btn.style.cssText += 'border: 3px solid red !important; animation: vnuf2-blink 0.5s infinite alternate;';

        // Thêm animation CSS
        if (!document.getElementById('vnuf2-blink-css')) {
          const style = document.createElement('style');
          style.id = 'vnuf2-blink-css';
          style.textContent = '@keyframes vnuf2-blink { from { box-shadow: 0 0 5px red; } to { box-shadow: 0 0 15px red; } }';
          document.head.appendChild(style);
        }
      }
    });
  }

  function reset() {
    initialized = false;
    const panel = document.getElementById('vnuf2-autofill-panel');
    if (panel) panel.remove();
  }

  return { init, reset };
})();
