'use strict';
let currentTabId = null;
let currentState = null;
let countdownInterval = null;
let activeChip = null;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

function formatTime(ms) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  if (h !== '00') return `${h}:${m}:${s}`;
  return `${m}:${s}`;
}

function updateCountdown() {
  if (!currentState || !currentState.isRefreshing || !currentState.endTime) {
    $('#countdownText').textContent = '--:--';
    $('#statusLabel').textContent = 'Idle';
    const ring = $('#progressRing');
    if (ring) ring.style.strokeDashoffset = '163.36';
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    return;
  }

  const remaining = currentState.endTime - Date.now();
  const totalInterval = currentState.endTime - (currentState.endTime - getIntervalMs(currentState));

  if (remaining <= 0) {
    $('#countdownText').textContent = '00:00';
    $('#statusLabel').textContent = 'Refreshing...';
    return;
  }

  const pct = Math.max(0, Math.min(100, (remaining / totalInterval) * 100));
  const offset = (1 - pct / 100) * 163.36;
  const ring = $('#progressRing');
  if (ring) ring.style.strokeDashoffset = String(offset);

  $('#countdownText').textContent = formatTime(remaining);
  $('#statusLabel').textContent = 'Refreshing';
}

function getIntervalMs(state) {
  if (state.intervalType === 'random') {
    const avg = ((state.intervalMin || 5) + (state.intervalMax || 30)) / 2;
    return avg * 1000;
  }
  return (state.intervalValue || 30) * 1000;
}

async function refreshUI() {
  if (!currentTabId) return;
  currentState = await chrome.runtime.sendMessage({ type: 'getState', tabId: currentTabId });

  if (currentState && currentState.isRefreshing) {
    $('#startBtn').disabled = true;
    $('#stopBtn').disabled = false;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdown, 200);
    updateCountdown();

    if (currentState.hardRefresh) $('#hardRefresh').checked = true;

    if (currentState.keywords && currentState.keywords.length > 0) {
      renderTags(currentState.keywords);
    }
    if (currentState.keywordMode === 'disappear') {
      document.querySelector('input[name="kwMode"][value="disappear"]').checked = true;
    }
  } else {
    $('#startBtn').disabled = false;
    $('#stopBtn').disabled = true;
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    currentState = null;
    updateCountdown();
  }
}

function getIntervalType() {
  if (activeChip) return { type: 'preset', value: parseInt(activeChip.dataset.seconds, 10) };
  const h = parseInt($('#customH').value, 10) || 0;
  const m = parseInt($('#customM').value, 10) || 0;
  const s = parseInt($('#customS').value, 10) || 0;
  const total = h * 3600 + m * 60 + s;
  if (total > 0) return { type: 'custom', value: total };

  const rMin = parseInt($('#randomMin').value, 10) || 5;
  const rMax = parseInt($('#randomMax').value, 10) || 15;
  if (rMin > 0 && rMax > 0) return { type: 'random', value: null, min: rMin, max: rMax };

  return { type: 'preset', value: 30 };
}

function renderTags(keywords) {
  const container = $('#tagList');
  container.innerHTML = '';
  (keywords || []).forEach((kw) => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.innerHTML = `${escapeHtml(kw)} <span class="remove" data-kw="${escapeHtml(kw)}">&times;</span>`;
    container.appendChild(el);
  });
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function getKeywords() {
  return Array.from($$('.tag')).map((t) => {
    const span = t.querySelector('span.remove');
    return span ? span.dataset.kw : t.textContent.replace('×', '').trim();
  }).filter(Boolean);
}

async function startRefresh() {
  if (!currentTabId) return;
  const interval = getIntervalType();
  const keywords = getKeywords();
  const keywordMode = document.querySelector('input[name="kwMode"]:checked').value;
  const hardRefresh = $('#hardRefresh').checked;

  await chrome.runtime.sendMessage({
    type: 'startRefresh',
    tabId: currentTabId,
    intervalType: interval.type,
    intervalValue: interval.value,
    intervalMin: interval.min || null,
    intervalMax: interval.max || null,
    hardRefresh,
    keywords,
    keywordMode,
  });

  try {
    await chrome.tabs.sendMessage(currentTabId, {
      type: 'resetMonitoring',
      keywords,
      keywordMode,
    });
  } catch {}

  await refreshUI();
}

async function stopRefresh() {
  if (!currentTabId) return;
  await chrome.runtime.sendMessage({ type: 'stopRefresh', tabId: currentTabId });
  try {
    await chrome.tabs.sendMessage(currentTabId, { type: 'stopMonitoring' });
  } catch {}
  await refreshUI();
}

document.addEventListener('DOMContentLoaded', async () => {
  const tab = await getActiveTab();
  if (!tab) {
    $('#tabDomain').textContent = 'no tab';
    return;
  }
  currentTabId = tab.id;
  try {
    const url = new URL(tab.url || '');
    $('#tabDomain').textContent = url.hostname;
  } catch {
    $('#tabDomain').textContent = tab.url || 'unknown';
  }

  await refreshUI();

  $$('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (activeChip) activeChip.classList.remove('active');
      activeChip = chip;
      chip.classList.add('active');
    });
  });

  $('#addKeywordBtn').addEventListener('click', () => {
    const input = $('#keywordInput');
    const val = input.value.trim();
    if (!val) return;
    const existing = getKeywords();
    if (existing.includes(val)) return;
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${escapeHtml(val)} <span class="remove" data-kw="${escapeHtml(val)}">&times;</span>`;
    $('#tagList').appendChild(tag);
    input.value = '';
    input.focus();
  });

  $('#keywordInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#addKeywordBtn').click();
  });

  $('#tagList').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove')) {
      e.target.parentElement.remove();
    }
  });

  $('#startBtn').addEventListener('click', startRefresh);
  $('#stopBtn').addEventListener('click', stopRefresh);
});
