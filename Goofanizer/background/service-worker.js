const STORAGE_KEY = 'rds_emulation_state';

let activeTabId = null;
let debuggerAttached = false;

async function saveState(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

async function loadState() {
  const r = await chrome.storage.local.get(STORAGE_KEY);
  return r[STORAGE_KEY] || null;
}

async function clearState() {
  await chrome.storage.local.remove(STORAGE_KEY);
}

async function attachDebugger(tabId) {
  if (debuggerAttached && activeTabId === tabId) return;
  if (debuggerAttached && activeTabId && activeTabId !== tabId) {
    await detachDebugger(activeTabId);
  }
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    debuggerAttached = true;
    activeTabId = tabId;
  } catch (e) {
    if (e.message && e.message.includes('already attached')) {
      debuggerAttached = true;
      activeTabId = tabId;
      return;
    }
    throw e;
  }
}

async function detachDebugger(tabIdOverride) {
  const tabId = tabIdOverride || activeTabId;
  if (!tabId) return;
  try {
    await chrome.debugger.sendCommand({ tabId }, 'Emulation.clearDeviceMetricsOverride');
  } catch (_) {}
  try {
    await chrome.debugger.detach({ tabId });
  } catch (_) {}
  debuggerAttached = false;
  activeTabId = null;
}

async function applyDeviceMetrics(tabId, width, height, category, orientation) {
  const deviceScaleFactor = 2;
  const mobile = category === 'mobile';
  const isLandscape = orientation === 'landscape';
  const screenOrientation = isLandscape
    ? { type: 'landscapePrimary', angle: 90 }
    : { type: 'portraitPrimary', angle: 0 };

  await chrome.debugger.sendCommand({ tabId }, 'Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor,
    mobile,
    screenWidth: isLandscape ? height : width,
    screenHeight: isLandscape ? width : height,
    positionX: 0,
    positionY: 0,
    screenOrientation
  });
}

async function captureScreenshot(tabId) {
  const result = await chrome.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', {
    format: 'png'
  });
  return result.data;
}

async function handleApplyDevice(msg) {
  const tabId = msg.tabId;
  const device = msg.device;
  const orientation = msg.orientation || 'portrait';

  await attachDebugger(tabId);

  const dims = orientation === 'landscape'
    ? { width: device.height, height: device.width }
    : { width: device.width, height: device.height };

  await applyDeviceMetrics(tabId, dims.width, dims.height, device.category, orientation);

  await saveState({
    activeDeviceId: device.id,
    deviceName: device.name,
    width: dims.width,
    height: dims.height,
    category: device.category,
    orientation,
    isEmulating: true,
    tabId
  });

  return { ok: true, width: dims.width, height: dims.height };
}

async function handleRotate(msg) {
  const tabId = msg.tabId;
  const state = await loadState();
  if (!state || !state.isEmulating) return { ok: false, error: 'No active emulation' };

  const newOrientation = state.orientation === 'landscape' ? 'portrait' : 'landscape';
  const newWidth = state.height;
  const newHeight = state.width;

  await attachDebugger(tabId);
  await applyDeviceMetrics(tabId, newWidth, newHeight, state.category, newOrientation);

  state.orientation = newOrientation;
  state.width = newWidth;
  state.height = newHeight;
  await saveState(state);

  return { ok: true, width: newWidth, height: newHeight, orientation: newOrientation };
}

async function handleReset(msg) {
  const tabId = msg.tabId || activeTabId || (await getStoredTabId());
  await detachDebugger(tabId);
  await clearState();
  return { ok: true };
}

async function getStoredTabId() {
  const state = await loadState();
  return state ? state.tabId : null;
}

async function handleCaptureScreenshot(msg) {
  const tabId = msg.tabId;
  try {
    const data = await captureScreenshot(tabId);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function handleGetState() {
  return await loadState();
}

function crc32(data) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeZipEntry(filename, data) {
  const fn = new TextEncoder().encode(filename);
  const crc = crc32(data);
  const uncompressedSize = data.length;
  const compressedSize = data.length;

  const localHeader = new Uint8Array(30 + fn.length);
  const dv = new DataView(localHeader.buffer);
  dv.setUint32(0, 0x04034b50, true);
  dv.setUint16(4, 20, true);
  dv.setUint16(6, 0, true);
  dv.setUint16(8, 0, true);
  dv.setUint16(10, 0, true);
  dv.setUint16(12, 0, true);
  dv.setUint32(14, crc, true);
  dv.setUint32(18, compressedSize, true);
  dv.setUint32(22, uncompressedSize, true);
  dv.setUint16(26, fn.length, true);
  dv.setUint16(28, 0, true);
  localHeader.set(fn, 30);

  const centralDirEntry = new Uint8Array(46 + fn.length);
  const cdv = new DataView(centralDirEntry.buffer);
  cdv.setUint32(0, 0x02014b50, true);
  cdv.setUint16(4, 20, true);
  cdv.setUint16(6, 20, true);
  cdv.setUint16(8, 0, true);
  cdv.setUint16(10, 0, true);
  cdv.setUint16(12, 0, true);
  cdv.setUint16(14, 0, true);
  cdv.setUint32(16, crc, true);
  cdv.setUint32(20, compressedSize, true);
  cdv.setUint32(24, uncompressedSize, true);
  cdv.setUint16(28, fn.length, true);
  cdv.setUint16(30, 0, true);
  cdv.setUint16(32, 0, true);
  cdv.setUint16(34, 0, true);
  cdv.setUint16(36, 0, true);
  cdv.setUint32(38, 0, true);
  cdv.setUint32(42, 0, true);
  centralDirEntry.set(fn, 46);

  return { localHeader, data, centralDirEntry };
}

function buildZip(entries) {
  const localSections = [];
  const centralSections = [];
  let localOffset = 0;

  for (const entry of entries) {
    localSections.push(entry.localHeader);
    localSections.push(entry.data);

    const cdv = new DataView(entry.centralDirEntry.buffer);
    cdv.setUint32(42, localOffset, true);
    centralSections.push(entry.centralDirEntry);

    localOffset += entry.localHeader.length + entry.data.length;
  }

  const centralDir = concatUint8Arrays(centralSections);
  const centralOffset = concatUint8Arrays(localSections).length;

  const eocd = new Uint8Array(22);
  const eocdV = new DataView(eocd.buffer);
  eocdV.setUint32(0, 0x06054b50, true);
  eocdV.setUint16(4, 0, true);
  eocdV.setUint16(6, 0, true);
  eocdV.setUint16(8, entries.length, true);
  eocdV.setUint16(10, entries.length, true);
  eocdV.setUint32(12, centralDir.length, true);
  eocdV.setUint32(16, centralOffset, true);
  eocdV.setUint16(20, 0, true);

  return concatUint8Arrays([...localSections, centralDir, eocd]);
}

function concatUint8Arrays(arrays) {
  let totalLength = 0;
  for (const arr of arrays) totalLength += arr.length;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function handleExportScreenshots(msg) {
  const tabId = msg.tabId;

  const allDevices = [
    { id: 'android1', name: 'Android', width: 360, height: 800, category: 'mobile' },
    { id: 'iphone1', name: 'iPhone', width: 390, height: 844, category: 'mobile' },
    { id: 'tablet1', name: 'Tablet_S', width: 800, height: 1280, category: 'tablet' },
    { id: 'tablet2', name: 'iPad_Pro', width: 834, height: 1194, category: 'tablet' },
  ];

  try {
    await attachDebugger(tabId);
  } catch (e) {
    return { ok: false, error: 'Failed to attach debugger: ' + e.message };
  }

  const entries = [];

  for (const device of allDevices) {
    await applyDeviceMetrics(tabId, device.width, device.height, device.category, 'portrait');
    await delay(400);
    try {
      const data = await captureScreenshot(tabId);
      const raw = atob(data);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
      }
      const entry = makeZipEntry(`${device.name}.png`, bytes);
      entries.push(entry);
    } catch (e) {
      continue;
    }
  }

  const previousState = await loadState();
  if (previousState && previousState.isEmulating) {
    await applyDeviceMetrics(tabId, previousState.width, previousState.height, previousState.category, previousState.orientation);
  } else {
    try {
      await chrome.debugger.sendCommand({ tabId }, 'Emulation.clearDeviceMetricsOverride');
    } catch (_) {}
    await detachDebugger();
  }

  if (entries.length === 0) {
    return { ok: false, error: 'No screenshots captured' };
  }

  const zipData = buildZip(entries);
  const base64 = uint8ArrayToBase64(zipData);
  return { ok: true, data: base64, count: entries.length };
}

function uint8ArrayToBase64(bytes) {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = handlers[msg.type];
  if (handler) {
    handler(msg, sender).then(sendResponse).catch(e => {
      sendResponse({ ok: false, error: e.message });
    });
    return true;
  }
});

const handlers = {
  applyDevice: handleApplyDevice,
  rotate: handleRotate,
  reset: handleReset,
  captureScreenshot: handleCaptureScreenshot,
  getState: handleGetState,
  exportScreenshots: handleExportScreenshots,
  popupClosed: handlePopupClosed
};

async function handlePopupClosed() {
  try {
    const tabId = activeTabId || (await getStoredTabId());
    if (tabId) {
      await handleReset({ tabId });
    }
  } catch {}
}

let popupWindowId = null;


chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (activeTabId === tabId) {
    debuggerAttached = false;
    activeTabId = null;
    await clearState();
  }
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  if (windowId === popupWindowId) {
    await handlePopupClosed();
    popupWindowId = null;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ [STORAGE_KEY]: null });
});

const BOUNDS_KEY = 'popup_window_bounds';

async function savePopupBounds(windowId) {
  try {
    const win = await chrome.windows.get(windowId);
    if (win && win.type === 'popup') {
      await chrome.storage.local.set({
        [BOUNDS_KEY]: { left: win.left, top: win.top, width: win.width }
      });
    }
  } catch {}
}

async function loadPopupBounds() {
  const r = await chrome.storage.local.get(BOUNDS_KEY);
  return r[BOUNDS_KEY] || null;
}

chrome.windows.onBoundsChanged.addListener(async (windowId) => {
  await savePopupBounds(windowId);
});

chrome.action.onClicked.addListener(() => {
  openPopupWindow();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    openPopupWindow();
  }
});

async function openPopupWindow() {
  const windows = await chrome.windows.getAll();
  for (const w of windows) {
    if (w.type === 'popup') {
      try {
        const tabs = await chrome.tabs.query({ windowId: w.id });
        if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes('popup/popup.html')) {
          await chrome.windows.update(w.id, { focused: true });
          popupWindowId = w.id;
          const saved = await loadPopupBounds();
          if (saved) {
            await chrome.windows.update(w.id, { left: saved.left, top: saved.top, width: saved.width });
          }
          return;
        }
      } catch {}
    }
  }
  const bounds = await loadPopupBounds();
  const win = await chrome.windows.create({
    url: 'popup/popup.html',
    type: 'popup',
    width: bounds ? bounds.width : 320,
    height: 100,
    left: bounds ? bounds.left : undefined,
    top: bounds ? bounds.top : undefined
  });
  popupWindowId = win.id;
}
