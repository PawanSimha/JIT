'use strict';
const STORAGE_KEY = 'refreshner_tabs';

async function loadAll() {
  const r = await chrome.storage.local.get(STORAGE_KEY);
  return r[STORAGE_KEY] || {};
}

async function saveAll(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

async function getTabState(tabId) {
  const all = await loadAll();
  return all[tabId] || null;
}

async function setTabState(tabId, data) {
  const all = await loadAll();
  if (data === null) {
    delete all[tabId];
  } else {
    all[tabId] = data;
  }
  await saveAll(all);
}

async function stopRefresh(tabId) {
  const state = await getTabState(tabId);
  if (!state) return;
  chrome.alarms.clear(`refresh_${tabId}`);
  await setTabState(tabId, null);
}

function computeInterval(state) {
  if (state.intervalType === 'random') {
    const min = state.intervalMin || 5;
    const max = state.intervalMax || 30;
    return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
  }
  return (state.intervalValue || 30) * 1000;
}

async function scheduleNext(tabId, state) {
  const delayMs = computeInterval(state);
  const endTime = Date.now() + delayMs;
  state.endTime = endTime;
  await setTabState(tabId, state);
  chrome.alarms.create(`refresh_${tabId}`, { delayInMinutes: delayMs / 60000 });
}

async function handleRefreshAlarm(tabId) {
  const state = await getTabState(tabId);
  if (!state || !state.isRefreshing) return;

  const hard = state.hardRefresh || false;
  try {
    await chrome.tabs.reload(tabId, { bypassCache: hard });
  } catch {
    await setTabState(tabId, null);
    return;
  }

  state.matched = false;
  await scheduleNext(tabId, state);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith('refresh_')) return;
  const tabId = parseInt(alarm.name.slice(8), 10);
  if (isNaN(tabId)) return;
  handleRefreshAlarm(tabId);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = handlers[msg.type];
  if (handler) {
    handler(msg, sender, sendResponse);
    return true;
  }
});

const handlers = {
  async startRefresh(msg, sender, sendResponse) {
    const { tabId, intervalType, intervalValue, intervalMin, intervalMax, hardRefresh } = msg;
    await stopRefresh(tabId);
    const state = {
      isRefreshing: true,
      intervalType,
      intervalValue: intervalValue || null,
      intervalMin: intervalMin || null,
      intervalMax: intervalMax || null,
      hardRefresh: !!hardRefresh,
      keywords: msg.keywords || [],
      keywordMode: msg.keywordMode || 'appear',
      endTime: null,
      matched: false,
    };
    await scheduleNext(tabId, state);
    sendResponse({ ok: true });
  },

  async stopRefresh(msg, sender, sendResponse) {
    await stopRefresh(msg.tabId);
    sendResponse({ ok: true });
  },

  async getState(msg, sender, sendResponse) {
    const state = await getTabState(msg.tabId);
    sendResponse(state ? { ...state } : null);
  },

  async pageReady(msg, sender, sendResponse) {
    const tabId = sender.tab ? sender.tab.id : msg.tabId;
    const state = await getTabState(tabId);
    if (state && state.isRefreshing && state.keywords && state.keywords.length > 0) {
      sendResponse({
        monitoring: true,
        keywords: state.keywords,
        keywordMode: state.keywordMode,
      });
    } else {
      sendResponse({ monitoring: false });
    }
  },

  async keywordMatch(msg, sender, sendResponse) {
    const tabId = sender.tab ? sender.tab.id : msg.tabId;
    const state = await getTabState(tabId);
    if (!state || state.matched) {
      sendResponse({ action: 'ignored' });
      return;
    }
    state.matched = true;
    await setTabState(tabId, state);

    chrome.alarms.clear(`refresh_${tabId}`);

    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.title) {
        chrome.notifications.create(`match_${tabId}_${Date.now()}`, {
          type: 'basic',
          iconUrl: 'icons/Refreshner.png',
          title: 'Keyword Matched!',
          message: `"${msg.keyword}" found on "${tab.title}"`,
          priority: 2,
        });
      }
    } catch { }

    try {
      chrome.tabs.sendMessage(tabId, { type: 'playAlert' });
    } catch { }

    sendResponse({ action: 'stopped' });
  },
};

chrome.tabs.onRemoved.addListener(async (tabId) => {
  chrome.alarms.clear(`refresh_${tabId}`);
  await setTabState(tabId, null);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ [STORAGE_KEY]: {} });
});
