'use strict';

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').substring(0, 200);
}

function getFilenameFromUrl(url, ext, index) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    let name = parts[parts.length - 1] || `image_${index}`;
    if (!name.includes('.')) name += `.${ext}`;
    return sanitizeFilename(name);
  } catch {
    return `media_${index}.${ext}`;
  }
}

async function downloadSingle(url, filename) {
  try {
    await chrome.downloads.download({ url, filename, saveAs: false });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const handlers = {
  async downloadImage(msg, sender, sendResponse) {
    const result = await downloadSingle(msg.url, msg.filename);
    sendResponse(result);
  },

  async downloadAllOfType(msg, sender, sendResponse) {
    const results = [];
    for (let i = 0; i < msg.images.length; i++) {
      const img = msg.images[i];
      const filename = getFilenameFromUrl(img.src, img.type || 'img', i + 1);
      const result = await downloadSingle(img.src, filename);
      results.push(result);
      await new Promise(r => setTimeout(r, 300));
    }
    sendResponse({ ok: true, total: results.length, errors: results.filter(r => !r.ok).length });
  },

  async downloadAll(msg, sender, sendResponse) {
    const results = [];
    for (let i = 0; i < msg.images.length; i++) {
      const img = msg.images[i];
      const filename = getFilenameFromUrl(img.src, img.type || 'img', i + 1);
      const result = await downloadSingle(img.src, filename);
      results.push(result);
      await new Promise(r => setTimeout(r, 300));
    }
    sendResponse({ ok: true, total: results.length, errors: results.filter(r => !r.ok).length });
  },
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = handlers[msg.type];
  if (handler) {
    handler(msg, sender, sendResponse);
    return true;
  }
});
