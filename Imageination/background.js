'use strict';

async function downloadSingle(url, filename) {
  try {
    await chrome.downloads.download({ url, filename, saveAs: false });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'downloadImage') {
    downloadSingle(msg.url, msg.filename).then(sendResponse);
    return true;
  }
});
