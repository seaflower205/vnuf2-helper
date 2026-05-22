// ============================================
// VNUF2 Helper — dom-helper.js
// Các hàm tiện ích thao tác DOM cho Angular SPA
// ============================================

const VNUF2DOM = (() => {

  /**
   * Đợi element xuất hiện trong DOM bằng MutationObserver
   * @param {string} selector - CSS selector
   * @param {number} timeout - ms tối đa chờ (mặc định 10s)
   * @returns {Promise<Element>}
   */
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`[VNUF2] Timeout chờ element: ${selector}`));
      }, timeout);
    });
  }

  /**
   * Đợi ngx-spinner ẩn đi (Angular đã load xong data)
   * @param {number} timeout - ms tối đa
   * @returns {Promise<void>}
   */
  function waitForSpinnerHide(timeout = 15000) {
    return new Promise((resolve) => {
      const check = () => {
        const spinner = document.querySelector('ngx-spinner .ngx-spinner-overlay');
        if (!spinner || spinner.style.display === 'none' || !spinner.offsetParent) {
          resolve();
          return true;
        }
        return false;
      };

      if (check()) return;

      const observer = new MutationObserver(() => {
        if (check()) observer.disconnect();
      });

      observer.observe(document.body, { childList: true, subtree: true, attributes: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(); // resolve anyway sau timeout
      }, timeout);
    });
  }

  /**
   * Gán value cho input Angular + dispatch event để Angular nhận biết
   * @param {HTMLInputElement} input
   * @param {string} value
   */
  function setAngularValue(input, value) {
    if (!input) return;
    // Dùng native setter để bypass Angular getter/setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(input, value);

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Click menu item sidebar bằng ID
   * @param {string} id - VD: 'WEB_DIEM', 'WEB_TKB_1TUAN'
   */
  function clickMenuItem(id) {
    const el = document.getElementById(id);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }

  /**
   * Cào dữ liệu từ HTML table thành mảng object
   * @param {string} tableSelector - CSS selector cho table
   * @returns {Array<Object>} - Mỗi object là 1 row, key là text header
   */
  function scrapeTable(tableSelector) {
    const table = document.querySelector(tableSelector);
    if (!table) return [];

    const headers = [];
    const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td');
    headerCells.forEach((th, i) => {
      headers.push(th.textContent.trim() || `col_${i}`);
    });

    const rows = [];
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length === 0) return;
      const rowMap = new Map();
      cells.forEach((td, i) => {
        let key = 'col_' + i;
        if (i < headers.length) {
          const headerVal = headers.at(i);
          if (headerVal) {
            key = headerVal;
          }
        }
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          key = 'col_' + i;
        }
        rowMap.set(key, td.textContent.trim());
      });
      const row = Object.fromEntries(rowMap);
      rows.push(row);
    });

    return rows;
  }

  /**
   * Tạo và inject nút addon vào DOM
   * @param {string} text - Text hiển thị trên nút
   * @param {Function} onClick - Callback khi click
   * @param {Element} container - Element cha để chèn nút vào
   * @param {string} id - ID duy nhất cho nút
   * @returns {HTMLButtonElement}
   */
  function injectButton(text, onClick, container, id) {
    // Tránh inject trùng
    if (document.getElementById(id)) return document.getElementById(id);

    const btn = document.createElement('button');
    btn.id = id;
    btn.className = 'btn btn-sm btn-outline-success mx-1';
    btn.textContent = text;
    btn.style.cssText = 'font-size: 13px; border-radius: 4px; cursor: pointer;';
    btn.addEventListener('click', onClick);

    if (container) {
      container.appendChild(btn);
    }
    return btn;
  }

  /**
   * Hiển thị toast notification tạm thời
   * @param {string} message
   * @param {string} type - 'success' | 'error' | 'info'
   */
  function showToast(message, type = 'success') {
    // Xóa toast cũ nếu có
    const old = document.getElementById('vnuf2-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'vnuf2-toast';
    
    let backgroundColor = '#17a2b8'; // default info color
    if (type === 'success') {
      backgroundColor = '#28a745';
    } else if (type === 'error') {
      backgroundColor = '#dc3545';
    }

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 99999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: opacity 0.3s;
      font-family: Arial, sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Lấy hash route hiện tại
   * @returns {string} VD: '#/tkb-tuan', '#/home'
   */
  function getCurrentRoute() {
    return window.location.hash || '#/home';
  }

  /**
   * Lấy bảng thời khóa biểu tuần một cách linh hoạt và chính xác
   * @returns {HTMLTableElement|null}
   */
  function getTimetableTable() {
    // 1. Thử tìm bằng class đặc trưng của tuần
    let table = document.querySelector('table.table-sm.user-select-none');
    if (table) return table;

    // 2. Thử tìm table nằm trong thẻ main của content area
    const main = document.querySelector('main.right-content') || document.querySelector('main');
    if (main) {
      table = main.querySelector('table');
      if (table) return table;
    }

    // 3. Fallback: lấy table đầu tiên xuất hiện trên trang
    return document.querySelector('table');
  }

  return {
    waitForElement,
    waitForSpinnerHide,
    setAngularValue,
    clickMenuItem,
    scrapeTable,
    injectButton,
    showToast,
    getCurrentRoute,
    getTimetableTable
  };
})();
