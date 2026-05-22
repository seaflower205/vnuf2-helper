// ============================================
// VNUF2 Helper — export-calendar.js
// Xuất TKB tuần ra file .ics (Google Calendar)
// ============================================

const VNUF2ExportCalendar = (() => {
  let initialized = false;

  // Mapping Tiết → Giờ bắt đầu (HH:MM) - theo quy định phổ biến
  const TIET_MAP = {
    1:  { start: '07:00', end: '07:50' },
    2:  { start: '07:55', end: '08:45' },
    3:  { start: '08:50', end: '09:40' },
    4:  { start: '09:45', end: '10:35' },
    5:  { start: '10:40', end: '11:30' },
    6:  { start: '12:30', end: '13:20' },
    7:  { start: '13:25', end: '14:15' },
    8:  { start: '14:20', end: '15:10' },
    9:  { start: '15:15', end: '16:05' },
    10: { start: '16:10', end: '17:00' },
    11: { start: '17:05', end: '17:55' },
    12: { start: '18:00', end: '18:50' },
    13: { start: '18:55', end: '19:45' },
    14: { start: '19:50', end: '20:40' },
    15: { start: '20:45', end: '21:35' },
    16: { start: '21:40', end: '22:30' }
  };

  async function init() {
    if (initialized) return;
    initialized = true;
    // VNUF2CopyTKB manages the UI container and button injection on the tkb-tuan page.
  }

  function exportICS() {
    const table = VNUF2DOM.getTimetableTable();
    if (!table) {
      VNUF2DOM.showToast('❌ Không tìm thấy bảng TKB!', 'error');
      return;
    }

    // Parse các ngày từ header
    const headerRow = table.querySelector('tr.text-center');
    const dayDates = [];
    if (headerRow) {
      headerRow.querySelectorAll('td').forEach((td, idx) => {
        if (idx === 0) return; // Skip corner cell
        const text = td.textContent.trim().replace(/\s+/g, ' ');
        // Parse "Thứ 2 (18/05)" → { text: text, dateStr: '18/05' }
        const match = text.match(/(\d{2}\/\d{2})/);
        if (match) {
          dayDates.push({
            text: text,
            dateStr: match[1] // dd/MM
          });
        }
      });
    }

    // Parse các sự kiện từ cells
    const events = [];
    const currentYear = new Date().getFullYear();
    const tbodyRows = Array.from(table.querySelectorAll('tbody tr'));
    if (tbodyRows.length === 0) {
      VNUF2DOM.showToast('❌ Không tìm thấy dòng dữ liệu nào trong bảng!', 'error');
      return;
    }

    // Tính số cột tối đa trong bảng dựa trên dòng đầu tiên của tbody
    const firstRowCells = tbodyRows.at(0).querySelectorAll('td');
    let numCols = 0;
    firstRowCells.forEach(td => {
      numCols += parseInt(td.getAttribute('colspan') || '1', 10);
    });

    if (numCols === 0) {
      numCols = 1 + dayDates.length; // Fallback
    }

    // Tạo 2D grid để đánh dấu các ô đã bị chiếm bởi rowspan
    const grid = [];
    for (let r = 0; r < tbodyRows.length; r++) {
      grid.push(new Array(numCols).fill(false));
    }

    for (let r = 0; r < tbodyRows.length; r++) {
      const tr = tbodyRows.at(r);
      const cells = Array.from(tr.querySelectorAll('td'));
      
      let cellIdx = 0;
      
      for (let c = 0; c < numCols; c++) {
        // Nếu ô này đã bị chiếm bởi rowspan từ dòng trên, skip
        if (grid.at(r).at(c)) {
          continue;
        }

        const td = cells.at(cellIdx);
        if (!td) break;
        cellIdx++;

        const rowspan = parseInt(td.getAttribute('rowspan') || '1', 10);
        const colspan = parseInt(td.getAttribute('colspan') || '1', 10);

        // Đánh dấu các ô bị chiếm ở dòng hiện tại và các dòng tiếp theo
        for (let dr = 0; dr < rowspan; dr++) {
          for (let dc = 0; dc < colspan; dc++) {
            if (r + dr < tbodyRows.length && c + dc < numCols) {
              grid.at(r + dr).splice(c + dc, 1, true);
            }
          }
        }

        // Nếu là ô có lịch học
        if (td.classList.contains('table-warning') && td.textContent.trim()) {
          const tooltipSpan = td.querySelector('.tooltip-fix');
          if (tooltipSpan) {
            const paras = tooltipSpan.querySelectorAll('p');
            let tenMon = '', nhom = '', phong = '', gv = '';
            paras.forEach(p => {
              const txt = p.textContent.trim();
              if (p.classList.contains('font-weight-bold') && !txt.startsWith('Nhóm') && !txt.startsWith('Phòng') && !txt.startsWith('GV')) {
                tenMon = txt;
              } else if (txt.startsWith('Nhóm:')) {
                nhom = txt.replace('Nhóm:', '').trim();
              } else if (txt.startsWith('Phòng:')) {
                phong = txt.replace('Phòng:', '').trim();
              } else if (txt.startsWith('GV:')) {
                gv = txt.replace('GV:', '').trim();
              }
            });

            // Quét ngược dòng từ r lên 0 để tìm text của cột tiết đầu tiên
            let tietText = '';
            for (let trScan = r; trScan >= 0; trScan--) {
              const firstTdOfRow = tbodyRows.at(trScan).querySelector('td.bg-primary, td:first-child');
              if (firstTdOfRow) {
                const text = firstTdOfRow.textContent.trim();
                if (text.includes('Tiết') || /^\d+$/.test(text)) {
                  tietText = text;
                  break;
                }
              }
            }

            const tietStart = tietText ? parseInt(tietText.replace(/\D/g, '')) : 1;
            const tietEnd = tietStart + rowspan - 1;

            // Xác định ngày tương ứng (cột c trong grid)
            const dayIdx = c - 1;
            const dayInfo = (dayIdx >= 0 && dayIdx < dayDates.length) ? dayDates[dayIdx] : null;

            if (dayInfo && tenMon) {
              const [dd, mm] = dayInfo.dateStr.split('/').map(Number);
              const startTime = TIET_MAP[tietStart]?.start || '07:00';
              const endTime = TIET_MAP[tietEnd]?.end || '08:00';

              events.push({
                title: tenMon,
                date: `${currentYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
                startTime,
                endTime,
                location: phong,
                description: `Nhóm: ${nhom}\\nGV: ${gv}\\nTiết: ${tietStart}-${tietEnd}`
              });
            }
          }
        }
      }
    }

    if (events.length === 0) {
      VNUF2DOM.showToast('❌ Không tìm thấy sự kiện nào trong TKB!', 'error');
      return;
    }

    // Tạo file .ics
    const icsContent = generateICS(events);
    downloadFile('tkb-vnuf2.ics', icsContent, 'text/calendar');
    VNUF2DOM.showToast(`✅ Đã tải file .ics (${events.length} sự kiện)!`, 'success');
  }

  function generateICS(events) {
    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//VNUF2 Helper//TKB Export//VI\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';
    ics += 'METHOD:PUBLISH\r\n';
    ics += 'X-WR-CALNAME:TKB VNUF2\r\n';
    ics += 'X-WR-TIMEZONE:Asia/Ho_Chi_Minh\r\n';

    events.forEach((evt, i) => {
      const dtStart = `${evt.date.replace(/-/g, '')}T${evt.startTime.replace(':', '')}00`;
      const dtEnd = `${evt.date.replace(/-/g, '')}T${evt.endTime.replace(':', '')}00`;
      const uid = `vnuf2-${evt.date}-${i}@vnuf2helper`;

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${uid}\r\n`;
      ics += `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}\r\n`;
      ics += `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}\r\n`;
      ics += `SUMMARY:${evt.title}\r\n`;
      ics += `LOCATION:${evt.location}\r\n`;
      ics += `DESCRIPTION:${evt.description}\r\n`;
      ics += 'STATUS:CONFIRMED\r\n';
      ics += 'BEGIN:VALARM\r\n';
      ics += 'TRIGGER:-PT15M\r\n';
      ics += 'ACTION:DISPLAY\r\n';
      ics += 'DESCRIPTION:Sắp tới giờ học!\r\n';
      ics += 'END:VALARM\r\n';
      ics += 'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR\r\n';
    return ics;
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    initialized = false;
    const container = document.getElementById('vnuf2-addon-buttons-container');
    if (container) container.remove();
  }

  return { init, reset, exportICS };
})();
