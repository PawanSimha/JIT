(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  let currentState = null;
  let activeCardId = null;

  async function getActiveTab() {
    const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
    for (const w of windows) {
      const [tab] = await chrome.tabs.query({ active: true, windowId: w.id });
      if (tab) return tab;
    }
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab || null;
  }

  function getIconPath(icon) {
    const paths = { android: 'Android-OS.svg', apple: 'Apple-IOS.svg', tablet: 'Tablet.svg' };
    return paths[icon] || '';
  }

  function renderCards(devices, gridId) {
    const grid = $(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    devices.forEach(device => {
      const card = document.createElement('div');
      card.className = 'device-card';
      card.dataset.deviceId = device.id;
      card.dataset.deviceName = device.name.toLowerCase();
      const iconPath = getIconPath(device.icon);
      card.innerHTML = `
        <div class="card-check" aria-hidden="true">&#10003;</div>
        <div class="card-icon">
          <img class="card-icon-img" src="../assets/${iconPath}" alt="${escapeHtml(device.icon)}">
        </div>
        <div class="card-name">${escapeHtml(device.name)}</div>
        <div class="card-dims">${device.width} \u00D7 ${device.height}</div>
      `;
      card.addEventListener('click', () => applyDevice(device));
      grid.appendChild(card);
    });
    updateSectionCounts();
  }

  function updateSectionCounts() {
    const mobile = $('#mobileGrid') ? $('#mobileGrid').children.length : 0;
    const tablet = $('#tabletGrid') ? $('#tabletGrid').children.length : 0;
    const mc = $('#mobileCount');
    const tc = $('#tabletCount');
    if (mc) mc.textContent = '(' + mobile + ')';
    if (tc) tc.textContent = '(' + tablet + ')';
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function updateUIState(state) {
    currentState = state;
    const badge = $('#statusBadge');
    const resetBtn = $('#resetBtn');
    const rotateBtn = $('#rotateBtn');
    const dot = $('#deviceDot');
    const nameEl = $('#deviceName');
    const dimsEl = $('#deviceDims');

    if (state && state.isEmulating) {
      const rot = state.orientation === 'landscape' ? ' \u2192' : '';
      badge.textContent = state.deviceName + rot;
      badge.className = 'badge active';
      resetBtn.disabled = false;

      const canRotate = state.category === 'mobile' || state.category === 'tablet';
      rotateBtn.disabled = !canRotate;

      if (dot) dot.className = 'device-dot active';
      if (nameEl) nameEl.textContent = state.deviceName;
      if (dimsEl) dimsEl.textContent = state.width + '\u00D7' + state.height;

      $$('.device-card').forEach(card => {
        const id = card.dataset.deviceId;
        card.classList.toggle('active', id === state.activeDeviceId);
      });
      activeCardId = state.activeDeviceId;
    } else {
      badge.textContent = 'Inactive';
      badge.className = 'badge idle';
      resetBtn.disabled = true;
      rotateBtn.disabled = true;

      if (dot) dot.className = 'device-dot';
      if (nameEl) nameEl.textContent = 'None';
      if (dimsEl) dimsEl.textContent = '';

      $$('.device-card').forEach(card => card.classList.remove('active'));
      activeCardId = null;
    }
  }

  async function applyDevice(device) {
    const tab = await getActiveTab();
    if (!tab) return;
    if (isRestrictedPage(tab.url)) {
      showToast('Cannot emulate on browser pages', 'error');
      return;
    }

    const result = await chrome.runtime.sendMessage({
      type: 'applyDevice',
      tabId: tab.id,
      device: {
        id: device.id,
        name: device.name,
        width: device.width,
        height: device.height,
        category: device.category,
        icon: device.icon
      },
      orientation: 'portrait'
    });

    if (result && result.ok) {
      const state = await chrome.runtime.sendMessage({ type: 'getState' });
      updateUIState(state);
      showToast('Applied ' + device.name, 'success');
    } else if (result && result.error) {
      showToast('Error: ' + result.error, 'error');
    }
  }

  function isRestrictedPage(url) {
    try {
      const u = new URL(url);
      return ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'data:', 'devtools:'].includes(u.protocol);
    } catch {
      return true;
    }
  }

  function showToast(msg, type) {
    const existing = $('#toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'toast';
    el.className = type === 'error' ? 'error' : 'success';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 3000);
  }

  async function handleRotate() {
    const tab = await getActiveTab();
    if (!tab) return;

    const result = await chrome.runtime.sendMessage({
      type: 'rotate',
      tabId: tab.id
    });

    if (result && result.ok) {
      const state = await chrome.runtime.sendMessage({ type: 'getState' });
      updateUIState(state);
    }
  }

  async function handleReset() {
    const tab = await getActiveTab();
    if (!tab) return;

    await chrome.runtime.sendMessage({
      type: 'reset',
      tabId: tab.id
    });

    updateUIState(null);
    showToast('Viewport reset', 'success');
  }

  async function handleScreenshot() {
    const tab = await getActiveTab();
    if (!tab) return;
    if (isRestrictedPage(tab.url)) { showToast('Cannot capture on browser pages', 'error'); return; }

    const btn = $('#screenshotBtn');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="animation:spin 1s linear infinite"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-13h-2v6l5.25 3.15L17 12.23l-4-2.37V7z"/></svg> Capturing';

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'captureScreenshot',
        tabId: tab.id
      });

      if (result && result.ok) {
        const state = await chrome.runtime.sendMessage({ type: 'getState' });
        const label = state && state.deviceName ? state.deviceName.replace(/"/g, '') : 'viewport';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        downloadBase64(result.data, label + '_' + timestamp + '.png');
        showToast('Screenshot saved', 'success');
      } else if (result && result.error) {
        showToast('Screenshot failed: ' + result.error, 'error');
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  }

  async function handleExport() {
    const tab = await getActiveTab();
    if (!tab) return;
    if (isRestrictedPage(tab.url)) { showToast('Cannot export on browser pages', 'error'); return; }

    const btn = $('#exportBtn');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="animation:spin 1s linear infinite"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-13h-2v6l5.25 3.15L17 12.23l-4-2.37V7z"/></svg> Exporting';

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'exportScreenshots',
        tabId: tab.id
      });

      if (result && result.ok) {
        downloadBase64(result.data, 'responsive_screenshots_' + Date.now() + '.zip');
        showToast('Exported ' + result.count + ' screenshots', 'success');
      } else {
        showToast('Export failed: ' + (result.error || 'unknown error'), 'error');
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
      const updated = await chrome.runtime.sendMessage({ type: 'getState' });
      updateUIState(updated);
    }
  }

  function downloadBase64(base64, filename) {
    const chars = atob(base64);
    const bytes = new Uint8Array(chars.length);
    for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    $$('.device-card').forEach(card => {
      const name = card.dataset.deviceName || '';
      const dims = card.querySelector('.card-dims');
      const dimText = dims ? dims.textContent : '';
      const match = name.includes(q) || dimText.includes(q);
      card.style.display = match ? '' : 'none';
    });
    updateSectionCounts();
  }

  function handleResetOnClose() {
    if (currentState && currentState.isEmulating) {
      chrome.runtime.sendMessage({ type: 'popupClosed' });
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    renderCards(DEVICES.filter(d => d.category === 'mobile'), '#mobileGrid');
    renderCards(DEVICES.filter(d => d.category === 'tablet'), '#tabletGrid');

    const state = await chrome.runtime.sendMessage({ type: 'getState' });
    updateUIState(state);

    $('#rotateBtn').addEventListener('click', handleRotate);
    $('#resetBtn').addEventListener('click', handleReset);
    $('#screenshotBtn').addEventListener('click', handleScreenshot);
    $('#exportBtn').addEventListener('click', handleExport);
    $('#searchInput').addEventListener('input', handleSearch);

    window.addEventListener('pagehide', handleResetOnClose);

    // Auto-size popup height to fit content
    requestAnimationFrame(async () => {
      const win = await chrome.windows.getCurrent();
      const contentH = document.body.scrollHeight;
      const chromeH = window.outerHeight - window.innerHeight;
      const totalH = contentH + chromeH;
      if (win && win.height !== totalH && totalH > 50) {
        await chrome.windows.update(win.id, { height: totalH });
      }
    });
  });
})();
