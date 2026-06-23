'use strict';

let allItems = {};
let activeType = 'all';
const typeOrder = [
  'all','favicon','video','audio',
  'png','jpeg','jpg','webp','svg','gif','avif','ico',
  'mp4','webm','mov','flv',
  'mp3','m4a','wav','ogg','aac','weba'
];
const typeLabels = {
  all:'All Media',favicon:'Favicon',video:'Video',audio:'Audio',
  png:'PNG',jpeg:'JPEG',jpg:'JPG',webp:'WebP',svg:'SVG',gif:'GIF',avif:'AVIF',ico:'ICO',
  mp4:'MP4',webm:'WebM',mov:'MOV',flv:'FLV',
  mp3:'MP3',m4a:'M4A',wav:'WAV',ogg:'OGG',aac:'AAC',weba:'WebA'
};
const typeColors = {
  all:'#8ab4f8',favicon:'#ff5722',video:'#e91e63',audio:'#8bc34a',
  png:'#4caf50',jpeg:'#2196f3',jpg:'#2196f3',webp:'#ff9800',svg:'#e91e63',gif:'#ff9800',avif:'#00bcd4',ico:'#9c27b0',
  mp4:'#ff5722',webm:'#4caf50',mov:'#9c27b0',flv:'#f44336',
  mp3:'#2196f3',m4a:'#00bcd4',wav:'#ff9800',ogg:'#607d8b',aac:'#e91e63',weba:'#795548'
};

const VID_EXTS = ['mp4','webm','mov','flv'];
const AUD_EXTS = ['mp3','m4a','wav','ogg','aac','weba'];

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

async function getTab() {
  const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  return tab||null;
}

function nameFrom(url, idx, type) {
  try {
    const parts = new URL(url).pathname.split('/');
    const last = parts[parts.length-1];
    if (last && last.includes('.')) return last.substring(0,80);
  } catch {}
  const prefix = VID_EXTS.includes(type) ? 'video' : AUD_EXTS.includes(type) ? 'audio' : 'image';
  return `${prefix}_${idx}.${type === 'jpeg' ? 'jpg' : type}`;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function getTypes() {
  const out = [];
  typeOrder.forEach(t => { if (allItems[t]?.length) out.push(t); });
  Object.keys(allItems).forEach(t => {
    if (t !== 'all' && !typeOrder.includes(t) && allItems[t]?.length) out.push(t);
  });
  return out;
}

function renderSidebar() {
  const nav = $('#sidebarItems');
  nav.innerHTML = '';
  getTypes().forEach(type => {
    const a = type === activeType;
    const el = document.createElement('button');
    el.className = 'nav-it' + (a ? ' a' : '');
    el.innerHTML = `<span class="nav-dot" style="background:${typeColors[type]||'#8ab4f8'}"></span><span class="nav-lb">${esc(typeLabels[type]||type.toUpperCase())}</span><span class="nav-cn">${allItems[type].length}</span>`;
    el.addEventListener('click', () => { activeType = type; renderSidebar(); renderGrid(); });
    nav.appendChild(el);
  });
}

function renderGrid() {
  const items = allItems[activeType] || [];
  const label = typeLabels[activeType] || activeType.toUpperCase();
  const color = typeColors[activeType] || '#8ab4f8';
  $('#panelTitle').innerHTML = `<span class="p-dot" style="background:${color}"></span> ${esc(label)} <span class="p-cn">(${items.length})</span>`;
  $('#panelDlAll').dataset.type = activeType;
  const grid = $('#imgGrid');
  grid.innerHTML = '';

  if (!items.length) {
    grid.innerHTML = '<div class="grid-msg">No media found.</div>';
    return;
  }

  items.forEach((item, i) => {
    const isVideo = item.fromType === 'video';
    const isAudio = item.fromType === 'audio';
    const card = document.createElement('div');
    card.className = 'card';
    const prev = document.createElement('div');
    prev.className = 'prev' + (isVideo ? ' vid' : '') + (isAudio ? ' aud' : '');

    if (isVideo && item.poster) {
      const imgEl = document.createElement('img');
      imgEl.alt = item.alt||'';
      imgEl.src = item.poster;
      imgEl.addEventListener('error', function() { this.style.display='none'; });
      prev.appendChild(imgEl);
      const ov = document.createElement('span');
      ov.className = 'ov';
      ov.textContent = '\u25B6';
      prev.appendChild(ov);
    } else if (isVideo) {
      prev.textContent = '\u25B6';
    } else if (isAudio) {
      prev.textContent = '\u266B';
    } else {
      const imgEl = document.createElement('img');
      imgEl.alt = item.alt||'';
      imgEl.src = item.src;
      imgEl.addEventListener('error', function() {
        this.style.display='none';
        prev.classList.add('b');
        if (!prev.querySelector('.ph')) {
          const ph = document.createElement('span');
          ph.className = 'ph';
          ph.textContent = '\u{1F5BC}';
          prev.appendChild(ph);
        }
      });
      prev.appendChild(imgEl);
    }

    const info = document.createElement('div');
    info.className = 'info';
    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = nameFrom(item.src, i+1, item.type);
    nm.title = item.src;
    const mt = document.createElement('div');
    mt.className = 'mt';
    const dims = [];
    if (!isAudio && item.width) dims.push(`${item.width}\u00D7${item.height||'?'}`);
    const bc = typeColors[item.type]||'#8ab4f8';
    const showBadge = activeType === 'all' || activeType === 'favicon' || activeType === 'video' || activeType === 'audio';
    const badge = showBadge ? `<span class="tb" style="background:${bc}20;color:${bc}">${typeLabels[item.type]||item.type.toUpperCase()}</span>` : '';
    mt.innerHTML = dims.join(', ') + ' ' + badge;
    const dl = document.createElement('button');
    dl.className = 'dl';
    dl.textContent = 'Download';
    dl.dataset.url = item.src;
    dl.dataset.filename = nameFrom(item.src, i+1, item.type);
    info.appendChild(nm);
    info.appendChild(mt);
    card.appendChild(prev);
    card.appendChild(info);
    card.appendChild(dl);
    grid.appendChild(card);
  });

  $$('.dl').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '...';
      await chrome.runtime.sendMessage({type:'downloadImage', url:btn.dataset.url, filename:btn.dataset.filename});
      btn.textContent = 'Done';
      setTimeout(() => { btn.textContent='Download'; btn.disabled=false; }, 1500);
    });
  });
}

function renderAll() {
  const total = allItems.all?.length||0;
  const dlAll = $('#dlAllBtn');
  dlAll.hidden = false;
  dlAll.textContent = `\u2193 All (${total})`;
  dlAll.onclick = async () => {
    const all = allItems.all||[];
    if (!all.length) return;
    dlAll.disabled = true;
    dlAll.textContent = `Downloading ${all.length}...`;
    await chrome.runtime.sendMessage({type:'downloadAll', images:all});
    dlAll.textContent = `Done ${all.length}`;
    setTimeout(() => { dlAll.textContent=`\u2193 All (${total})`; dlAll.disabled=false; }, 2000);
  };
  activeType = 'all';
  renderSidebar();
  renderGrid();
  $('#panelDlAll').onclick = async () => {
    const type = $('#panelDlAll').dataset.type;
    const items = allItems[type]||[];
    if (!items.length) return;
    const btn = $('#panelDlAll');
    btn.disabled = true;
    btn.textContent = `Downloading ${items.length}...`;
    await chrome.runtime.sendMessage({type:'downloadAllOfType', images:items, imageType:type});
    btn.textContent = `Done ${items.length}`;
    setTimeout(() => { btn.textContent='Download All'; btn.disabled=false; }, 2000);
  };
}

function showGridMsg(html) {
  const grid = $('#imgGrid');
  grid.innerHTML = `<div class="grid-msg">${html}</div>`;
}

function showGridErr(html) {
  const grid = $('#imgGrid');
  grid.innerHTML = `<div class="grid-msg err">${html}</div>`;
}

async function fetchImages(tabId) {
  for (let i = 0; i < 5; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, {type:'ping'});
    } catch {
      showGridMsg(`<span class="sp"></span> Scanning... (${i+1})`);
      await new Promise(r => setTimeout(r, 300));
      continue;
    }
    return await chrome.tabs.sendMessage(tabId, {type:'getImages'});
  }
  return null;
}

async function load(tab) {
  showGridMsg('<span class="sp"></span> Scanning...');
  $('#countBadge').textContent = '...';

  const res = await fetchImages(tab.id);

  if (!res) {
    showGridErr('Could not reach the page. <button class="gb" id="retryBtn">Retry</button>');
    document.getElementById('retryBtn')?.addEventListener('click', () => load(tab));
    return;
  }

  const keys = Object.keys(res);
  if (!keys.length || !res.all?.length) {
    showGridMsg('No media found.');
    $('#countBadge').textContent = '0';
    return;
  }

  allItems = res;
  renderAll();
}

document.addEventListener('DOMContentLoaded', async () => {
  const tab = await getTab();
  if (!tab) {
    showGridErr('No active tab.');
    return;
  }
  await load(tab);
});
