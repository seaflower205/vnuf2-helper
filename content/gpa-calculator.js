// ============================================
// VNUF2 Helper — gpa-calculator.js
// Tính GPA giả định (What-if Grades)
// ============================================

const VNUF2GPA = (() => {
  let initialized = false;
  let observer = null;
  let injectTimeout = null;

  // Bảng quy đổi điểm 10 → điểm hệ 4
  function toGPA4(score) {
    if (score >= 8.5) return 4.0;
    if (score >= 8.0) return 3.5;
    if (score >= 7.0) return 3.0;
    if (score >= 6.5) return 2.5;
    if (score >= 5.5) return 2.0;
    if (score >= 5.0) return 1.5;
    if (score >= 4.0) return 1.0;
    return 0;
  }

  function toLetterGrade(score) {
    if (score >= 8.5) return 'A';
    if (score >= 8.0) return 'B+';
    if (score >= 7.0) return 'B';
    if (score >= 6.5) return 'C+';
    if (score >= 5.5) return 'C';
    if (score >= 5.0) return 'D+';
    if (score >= 4.0) return 'D';
    return 'F';
  }

  async function init() {
    if (initialized) return;
    initialized = true;

    // Observe document.body để luôn theo dõi khi bảng điểm được cập nhật (ví dụ chuyển học kỳ)
    observer = new MutationObserver(() => {
      if (initialized && VNUF2DOM.getCurrentRoute().includes('diem')) {
        if (injectTimeout) clearTimeout(injectTimeout);
        injectTimeout = setTimeout(() => {
          checkAndInject();
        }, 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Chạy thử lần đầu tiên
    await checkAndInject();
  }

  async function checkAndInject() {
    const table = document.querySelector('table');
    if (!table) return;

    // Tránh inject trùng nếu đã có input mục tiêu hoặc bảng panel
    const firstInput = document.querySelector('.vnuf2-gpa-input');
    const panel = document.getElementById('vnuf2-gpa-panel');
    if (!panel || !firstInput) {
      injectGPA(table);
    }
  }

  function injectGPA(table) {
    // Tìm header để xác định cột điểm tổng kết và tín chỉ
    const headers = [];
    table.querySelectorAll('thead th, thead td').forEach(th => {
      headers.push(th.textContent.trim().toLowerCase());
    });

    // Tìm index cột tín chỉ và điểm tổng kết
    let colTC = -1;
    let colDiem = -1;

    headers.forEach((h, i) => {
      if (h.includes('tín chỉ') || h.includes('số tc') || h === 'tc') colTC = i;
      if (h.includes('tổng kết') || h.includes('tk') || h.includes('đtb')) colDiem = i;
    });

    // Nếu không tìm thấy cột chính xác, thử scan lại
    if (colTC === -1 || colDiem === -1) {
      const allHeaders = table.querySelectorAll('tr th, tr td');
      allHeaders.forEach((th, i) => {
        const t = th.textContent.trim().toLowerCase();
        if (t.includes('số tín chỉ') && colTC === -1) colTC = i;
        if ((t.includes('tb') || t.includes('tổng')) && colDiem === -1) colDiem = i;
      });
    }

    if (colTC === -1) {
      console.log('[VNUF2] Không tìm thấy cột tín chỉ');
      return;
    }

    // Thêm cột "Điểm mục tiêu" vào header
    const thead = table.querySelector('thead tr:last-child') || table.querySelector('tr:first-child');
    if (thead && !thead.querySelector('.vnuf2-gpa-header')) {
      const th = document.createElement('th');
      th.className = 'vnuf2-gpa-header';
      th.textContent = '🎯 Mục tiêu';
      th.style.cssText = 'background:#28a745; color:#fff; text-align:center; min-width:80px; font-size:12px;';
      thead.appendChild(th);
    }

    // Thêm input vào mỗi hàng
    const bodyRows = table.querySelectorAll('tbody tr');
    const rowData = [];

    bodyRows.forEach(tr => {
      // Bỏ qua hàng nếu đã có input vnuf2-gpa-input
      if (tr.querySelector('.vnuf2-gpa-input')) {
        const input = tr.querySelector('.vnuf2-gpa-input');
        const tc = parseFloat(input.dataset.tc) || 0;
        const diemHienTai = parseFloat(input.dataset.actual) || 0;
        rowData.push({ tc, diemHienTai, input });
        return;
      }

      const cells = tr.querySelectorAll('td');
      if (cells.length < 3) return;

      // Lấy tín chỉ
      const tcCell = cells[colTC];
      const tc = tcCell ? parseFloat(tcCell.textContent.trim()) : 0;

      // Lấy điểm hiện tại
      let diemHienTai = 0;
      if (colDiem >= 0 && cells[colDiem]) {
        diemHienTai = parseFloat(cells[colDiem].textContent.trim()) || 0;
      }

      // Tạo input mục tiêu
      const td = document.createElement('td');
      td.className = 'vnuf2-gpa-cell';
      td.style.cssText = 'text-align:center; padding:2px;';
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '10';
      input.step = '0.1';
      input.style.cssText = 'width:60px; text-align:center; border:1px solid #28a745; border-radius:3px; padding:2px; font-size:12px;';
      input.placeholder = diemHienTai > 0 ? diemHienTai.toFixed(1) : '--';
      input.dataset.tc = tc;
      input.dataset.actual = diemHienTai;
      input.className = 'vnuf2-gpa-input';
      
      const uniqueSuffix = `row-${tr.rowIndex || Math.random().toString(36).substring(2, 9)}`;
      input.id = `vnuf2-gpa-target-${uniqueSuffix}`;
      input.name = `vnuf2-gpa-target-${uniqueSuffix}`;

      td.appendChild(input);
      tr.appendChild(td);

      rowData.push({ tc, diemHienTai, input });
    });

    // Tạo hoặc tái sử dụng panel GPA
    let gpaPanel = document.getElementById('vnuf2-gpa-panel');
    if (!gpaPanel) {
      gpaPanel = document.createElement('div');
      gpaPanel.id = 'vnuf2-gpa-panel';
      gpaPanel.style.cssText = `
        background: #f0fff4;
        border: 2px solid #28a745;
        border-radius: 6px;
        padding: 12px 16px;
        margin: 10px 0;
        font-size: 13px;
        font-family: Arial, sans-serif;
      `;
      gpaPanel.innerHTML = `
        <div style="font-weight:bold; font-size:14px; margin-bottom:8px;">📊 VNUF2 Helper — Tính GPA</div>
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
          <div>GPA hiện tại (hệ 4): <strong id="vnuf2-gpa-current">--</strong></div>
          <div>GPA mục tiêu (hệ 4): <strong id="vnuf2-gpa-target" style="color:#28a745;">--</strong></div>
          <div>Tổng tín chỉ: <strong id="vnuf2-gpa-tc">--</strong></div>
        </div>
      `;
      table.parentElement.insertBefore(gpaPanel, table);
    }

    // Tính GPA hiện tại
    calculateGPA(rowData);

    // Lắng nghe input thay đổi
    document.querySelectorAll('.vnuf2-gpa-input').forEach(input => {
      input.removeEventListener('input', input._listener);
      input._listener = () => calculateGPA(rowData);
      input.addEventListener('input', input._listener);
    });
  }

  function calculateGPA(rowData) {
    let sumActual = 0, sumTarget = 0, sumTC = 0;

    rowData.forEach(({ tc, diemHienTai, input }) => {
      if (tc <= 0) return;
      sumTC += tc;

      // GPA hiện tại
      sumActual += toGPA4(diemHienTai) * tc;

      // GPA mục tiêu
      const targetVal = parseFloat(input.value);
      if (!isNaN(targetVal) && targetVal >= 0) {
        sumTarget += toGPA4(targetVal) * tc;
      } else {
        sumTarget += toGPA4(diemHienTai) * tc;
      }
    });

    const gpaCurrent = sumTC > 0 ? (sumActual / sumTC).toFixed(2) : '--';
    const gpaTarget = sumTC > 0 ? (sumTarget / sumTC).toFixed(2) : '--';

    const elCurrent = document.getElementById('vnuf2-gpa-current');
    const elTarget = document.getElementById('vnuf2-gpa-target');
    const elTC = document.getElementById('vnuf2-gpa-tc');

    if (elCurrent) elCurrent.textContent = gpaCurrent;
    if (elTarget) elTarget.textContent = gpaTarget;
    if (elTC) elTC.textContent = sumTC;
  }

  function reset() {
    initialized = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (injectTimeout) {
      clearTimeout(injectTimeout);
      injectTimeout = null;
    }
    const panel = document.getElementById('vnuf2-gpa-panel');
    if (panel) panel.remove();

    // Xóa cột mục tiêu và header mục tiêu
    document.querySelectorAll('.vnuf2-gpa-cell').forEach(el => el.remove());
    document.querySelectorAll('.vnuf2-gpa-header').forEach(el => el.remove());
  }

  return { init, reset };
})();

