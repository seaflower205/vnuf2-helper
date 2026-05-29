// ============================================
// VNUF2 Helper — copy-tkb.js
// Copy Thời khóa biểu & Lịch thi (Text + Ảnh)
// ============================================

const VNUF2CopyTKB = (() => {
  let initialized = false;
  let observer = null;

  let injectTimeout = null;

  async function init(route) {
    if (initialized) return;
    initialized = true;

    // Luôn observe document.body để tránh việc Angular thay thế container (như main.right-content) làm mất observer
    observer = new MutationObserver(() => {
      if (initialized && VNUF2DOM.getCurrentRoute() === route) {
        if (injectTimeout) clearTimeout(injectTimeout);
        injectTimeout = setTimeout(() => {
          checkAndInject(route);
        }, 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Chạy thử lần đầu tiên
    await checkAndInject(route);
  }

  async function checkAndInject(route) {
    const table = VNUF2DOM.getTimetableTable();
    if (!table) return;

    const container = document.getElementById('vnuf2-addon-buttons-container');
    // Kiểm tra nếu container chưa có, hoặc không nằm đúng vị trí trước table
    if (!container || container.parentNode !== table.parentNode || table.previousElementSibling !== container) {
      injectButtons(route);
    }
  }

  function injectButtons(route) {
    const table = VNUF2DOM.getTimetableTable();
    if (!table) return;

    let container = document.getElementById('vnuf2-addon-buttons-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vnuf2-addon-buttons-container';
      container.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
        margin-bottom: 12px;
        padding: 8px 12px;
        background-color: #f8f9fa;
        border: 1px dashed #28a745;
        border-radius: 6px;
        align-items: center;
      `;
    }

    // Đảm bảo container nằm đúng vị trí ngay trước table
    if (table.previousElementSibling !== container) {
      table.parentNode.insertBefore(container, table);
    }

    const type = route.includes('tkb-tuan') ? 'tkb-tuan' : (route.includes('tkb-hocky') ? 'tkb-hocky' : 'lichthi');

    // Nút Copy Text
    VNUF2DOM.injectButton('📋 Copy Text', () => copyAsText(type), container, 'vnuf2-btn-copy-text');

    // Nút Copy Ảnh
    VNUF2DOM.injectButton('📷 Copy Ảnh', () => copyAsImage(type), container, 'vnuf2-btn-copy-image');

    // Nút Xuất Calendar (.ics) (chỉ trên tkb-tuan)
    if (type === 'tkb-tuan') {
      VNUF2DOM.injectButton('📅 Xuất Calendar (.ics)', () => {
        if (typeof VNUF2ExportCalendar !== 'undefined' && typeof VNUF2ExportCalendar.exportICS === 'function') {
          VNUF2ExportCalendar.exportICS();
        } else {
          console.error('[VNUF2] VNUF2ExportCalendar.exportICS is not available');
        }
      }, container, 'vnuf2-btn-export-ics');
    }
  }

  // ===========================
  // COPY AS TEXT
  // ===========================
  function copyAsText(type) {
    let text = '';

    if (type === 'tkb-tuan') {
      text = parseTKBTuan();
    } else if (type === 'tkb-hocky') {
      text = parseTKBHocKy();
    } else if (type === 'lichthi') {
      text = parseLichThi();
    }

    if (!text) {
      VNUF2DOM.showToast('❌ Không tìm thấy dữ liệu!', 'error');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      VNUF2DOM.showToast('✅ Đã copy text vào clipboard!', 'success');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.id = 'vnuf2-temp-clipboard';
      ta.name = 'vnuf2-temp-clipboard';
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      VNUF2DOM.showToast('✅ Đã copy text!', 'success');
    });
  }

  function parseTKBTuan() {
    const table = VNUF2DOM.getTimetableTable();
    if (!table) return '';

    // Lấy header (các ngày trong tuần)
    const headerRow = table.querySelector('tr.text-center');
    const days = [];
    if (headerRow) {
      headerRow.querySelectorAll('td').forEach((td, idx) => {
        if (idx === 0) return; // Skip corner cell
        const dayText = td.textContent.trim().replace(/\s+/g, ' ');
        if (dayText) days.push(dayText);
      });
    }

    let weekInfo = '=== THỜI KHÓA BIỂU TUẦN ===\n';
    const results = new Map();
    const tbodyRows = Array.from(table.querySelectorAll('tbody tr'));
    if (tbodyRows.length === 0) return '';

    // Tính số cột tối đa trong bảng dựa trên dòng đầu tiên của tbody
    const firstRowCells = tbodyRows[0].querySelectorAll('td');
    let numCols = 0;
    firstRowCells.forEach(td => {
      numCols += parseInt(td.getAttribute('colspan') || '1', 10);
    });

    if (numCols === 0) {
      numCols = 1 + days.length + 1; // Fallback
    }

    // Tạo 2D grid để đánh dấu các ô đã bị chiếm bởi rowspan
    const grid = [];
    for (let r = 0; r < tbodyRows.length; r++) {
      grid.push(new Array(numCols).fill(false));
    }

    for (let r = 0; r < tbodyRows.length; r++) {
      const tr = tbodyRows[r];
      const cells = Array.from(tr.querySelectorAll('td'));
      
      let cellIdx = 0;
      
      for (let c = 0; c < numCols; c++) {
        // Nếu ô này đã bị chiếm bởi rowspan từ dòng trên, skip
        if (grid[r][c]) {
          continue;
        }

        const td = cells[cellIdx];
        if (!td) break;
        cellIdx++;

        const rowspan = parseInt(td.getAttribute('rowspan') || '1', 10);
        const colspan = parseInt(td.getAttribute('colspan') || '1', 10);

        // Đánh dấu các ô bị chiếm ở dòng hiện tại và các dòng tiếp theo
        for (let dr = 0; dr < rowspan; dr++) {
          for (let dc = 0; dc < colspan; dc++) {
            if (r + dr < tbodyRows.length && c + dc < numCols) {
              grid[r + dr][c + dc] = true;
            }
          }
        }

        // Nếu là ô có lịch học
        if (td.classList.contains('table-warning') && td.textContent.trim()) {
          const tooltipSpan = td.querySelector('.tooltip-fix');
          if (tooltipSpan) {
            const paras = tooltipSpan.querySelectorAll('p');
            let info = [];
            paras.forEach(p => info.push(p.textContent.trim()));
            const infoText = info.join(' | ');

            // Quét ngược dòng từ r lên 0 để tìm text của cột tiết đầu tiên
            let tietText = '';
            for (let trScan = r; trScan >= 0; trScan--) {
              const firstTdOfRow = tbodyRows[trScan].querySelector('td.bg-primary, td:first-child');
              if (firstTdOfRow) {
                const text = firstTdOfRow.textContent.trim();
                if (text.includes('Tiết') || /^\d+$/.test(text)) {
                  tietText = text;
                  break;
                }
              }
            }

            const tietRange = tietText ? `${tietText}` + (rowspan > 1 ? ` - Tiết ${parseInt(tietText.replace('Tiết ', ''), 10) + rowspan - 1}` : '') : '';
            
            // Xác định ngày tương ứng (cột c trong grid)
            const dayIdx = c - 1;
            const dayName = (dayIdx >= 0 && dayIdx < days.length) ? days[dayIdx] : ('Cột ' + c);

            if (!results.has(dayName)) {
              results.set(dayName, []);
            }
            results.get(dayName).push(`${tietRange}: ${infoText}`);
          }
        }
      }
    }

    let output = weekInfo;
    days.forEach(day => {
      if (results.has(day)) {
        output += `\n📅 ${day}\n`;
        results.get(day).forEach(item => { output += `  ${item}\n`; });
      }
    });

    return output.trim() || parseTKBTuanSimple();
  }

  // Fallback đơn giản: lấy text content từ các ô có data
  function parseTKBTuanSimple() {
    const table = VNUF2DOM.getTimetableTable();
    if (!table) return '';

    let output = '=== THỜI KHÓA BIỂU TUẦN ===\n\n';
    const cells = table.querySelectorAll('td.table-warning');
    cells.forEach(td => {
      const text = td.textContent.trim().replace(/\s+/g, ' ');
      if (text) output += `• ${text}\n\n`;
    });
    return output.trim();
  }

  function parseTKBHocKy() {
    const rows = VNUF2DOM.scrapeTable('table');
    if (rows.length === 0) return '';

    let output = '=== THỜI KHÓA BIỂU HỌC KỲ ===\n\n';
    rows.forEach((row, i) => {
      const parts = Object.values(row).filter(v => v);
      output += `${i + 1}. ${parts.join(' | ')}\n`;
    });
    return output.trim();
  }

  function parseLichThi() {
    const table = document.querySelector('table');
    if (!table) return '';

    let output = '=== LỊCH THI ===\n\n';
    const rows = table.querySelectorAll('tbody tr');
    let index = 0;

    rows.forEach(tr => {
      // Skip header rows
      if (tr.querySelector('th')) return;
      const cells = tr.querySelectorAll('td');
      if (cells.length < 5) return;

      index++;
      const data = Array.from(cells).map(td => td.textContent.trim());
      // Format: STT | Mã MH | Tên | Sĩ số | Ngày | Giờ | Phút | Phòng | Cơ sở | ... | Hình thức
      const tenMon = data[2] || '';
      const ngayThi = data[4] || '';
      const gioBD = data[5] || '';
      const phut = data[6] || '';
      const phong = data[7] || '';
      const hinhThuc = (data.length > 0) ? data.at(-1) : '';

      output += `${index}. ${tenMon}\n`;
      output += `   📅 Ngày: ${ngayThi} | ⏰ Giờ: ${gioBD} (${phut} phút)\n`;
      output += `   🏫 Phòng: ${phong} | 📝 ${hinhThuc}\n\n`;
    });

    return output.trim();
  }

  // ===========================
  // COPY AS IMAGE (html2canvas)
  // ===========================
  async function copyAsImage(type) {
    let tableEl = null;

    if (type === 'tkb-tuan') {
      tableEl = VNUF2DOM.getTimetableTable();
    } else {
      tableEl = document.querySelector('table');
    }

    if (!tableEl) {
      VNUF2DOM.showToast('❌ Không tìm thấy bảng!', 'error');
      return;
    }

    VNUF2DOM.showToast('📸 Đang chụp ảnh bảng...', 'info');

    try {
      // Dùng html2canvas đã load sẵn, hoặc fallback bằng canvas tự render
      if (typeof html2canvas !== 'undefined') {
        const canvas = await html2canvas(tableEl, {
          backgroundColor: '#ffffff',
          scale: 2, // Chất lượng cao
          useCORS: true,
          logging: false
        });
        await canvasToClipboard(canvas);
      } else {
        // Fallback: tự render bằng cách tạo canvas từ DOM
        await captureTableFallback(tableEl);
      }
    } catch (e) {
      console.error('[VNUF2] Lỗi chụp ảnh:', e);
      // Fallback cuối: dùng SVG foreignObject
      await captureTableFallback(tableEl);
    }
  }

  /**
   * Fallback: Chuyển HTML table thành ảnh bằng SVG foreignObject + Canvas
   */
  async function captureTableFallback(tableEl) {
    try {
      // Clone table và lấy computed styles
      const clone = tableEl.cloneNode(true);

      // Tính kích thước thực
      const rect = tableEl.getBoundingClientRect();
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);

      // Lấy tất cả computed styles và inline chúng vào clone
      inlineStyles(tableEl, clone);

      // Tạo wrapper HTML
      const html = clone.outerHTML;
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 13px;">
              ${html}
            </div>
          </foreignObject>
        </svg>
      `;

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);

        await canvasToClipboard(canvas);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        VNUF2DOM.showToast('❌ Không thể chụp ảnh. Hãy dùng Copy Text.', 'error');
      };
      img.src = url;
    } catch (e) {
      console.error('[VNUF2] Fallback capture error:', e);
      VNUF2DOM.showToast('❌ Lỗi chụp ảnh bảng.', 'error');
    }
  }

  /**
   * Inline computed styles vào clone (để SVG foreignObject render đúng)
   */
  function inlineStyles(source, target) {
    const computed = window.getComputedStyle(source);
    const important = ['background-color', 'color', 'border', 'border-color',
      'border-width', 'border-style', 'font-size', 'font-weight', 'font-family',
      'text-align', 'padding', 'margin', 'width', 'height', 'vertical-align',
      'line-height', 'display', 'white-space'];

    important.forEach(prop => {
      target.style.setProperty(prop, computed.getPropertyValue(prop));
    });

    const sourceChildren = source.children;
    const targetChildren = target.children;
    for (let i = 0; i < sourceChildren.length && i < targetChildren.length; i++) {
      inlineStyles(sourceChildren.item(i), targetChildren.item(i));
    }
  }

  /**
   * Copy canvas lên Clipboard dạng PNG
   */
  async function canvasToClipboard(canvas) {
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      VNUF2DOM.showToast('✅ Đã copy ảnh vào clipboard! Ctrl+V để dán.', 'success');
    } catch (e) {
      console.warn('[VNUF2] Clipboard API không hỗ trợ, tải file thay thế:', e);
      // Fallback: download file ảnh
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vnuf2-tkb.png';
        a.click();
        URL.revokeObjectURL(url);
        VNUF2DOM.showToast('📥 Đã tải ảnh xuống (trình duyệt không hỗ trợ copy ảnh)', 'info');
      }, 'image/png');
    }
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
    const container = document.getElementById('vnuf2-addon-buttons-container');
    if (container) container.remove();
  }

  return { init, reset };
})();
