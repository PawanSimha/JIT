'use strict';
let monitoringActive = false;
let keywords = [];
let keywordMode = 'appear';
let matched = false;

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1100;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.75);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.75);
  } catch {}
}

function scanForKeywords() {
  if (!monitoringActive || matched || keywords.length === 0) return;
  const bodyText = document.body ? document.body.innerText || '' : '';
  let found = false;
  let matchedKeyword = '';
  for (const kw of keywords) {
    const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const exists = regex.test(bodyText);
    if (keywordMode === 'appear' && exists) {
      found = true;
      matchedKeyword = kw;
      break;
    }
    if (keywordMode === 'disappear' && !exists) {
      found = true;
      matchedKeyword = kw;
      break;
    }
  }
  if (found) {
    matched = true;
    playAlertSound();
    chrome.runtime.sendMessage({ type: 'keywordMatch', keyword: matchedKeyword });
  }
}

function init() {
  chrome.runtime.sendMessage({ type: 'pageReady' }, (response) => {
    if (response && response.monitoring) {
      monitoringActive = true;
      keywords = response.keywords || [];
      keywordMode = response.keywordMode || 'appear';
      matched = false;
      scanForKeywords();
    }
  });
}

const observer = new MutationObserver(() => {
  if (monitoringActive && !matched) {
    scanForKeywords();
  }
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
} else {
  const loadObserver = new MutationObserver(() => {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      loadObserver.disconnect();
    }
  });
  loadObserver.observe(document.documentElement, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'playAlert') {
    playAlertSound();
  }
  if (msg.type === 'resetMonitoring') {
    matched = false;
    monitoringActive = true;
    keywords = msg.keywords || [];
    keywordMode = msg.keywordMode || 'appear';
    scanForKeywords();
  }
  if (msg.type === 'stopMonitoring') {
    monitoringActive = false;
    matched = false;
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
