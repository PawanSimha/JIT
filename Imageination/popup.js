'use strict';

// ---- ZipWriter (inlined for popup context) ----
class ZipWriter {
  constructor() {
    this.files = [];
    this._table = this._makeCRC32Table();
  }
  _makeCRC32Table() {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  }
  _crc32(data) {
    const t = this._table;
    let c = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) c = t[(c ^ data[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  get fileCount() { return this.files.length; }
  add(name, data) {
    if (data instanceof ArrayBuffer) data = new Uint8Array(data);
    const enc = new TextEncoder().encode(name);
    this.files.push({ name: enc, data, crc: this._crc32(data) });
  }
  _fileHeader(name, crc, size) {
    const b = new Uint8Array(30 + name.length);
    const d = new DataView(b.buffer);
    d.setUint32(0, 0x04034b50, true);
    d.setUint16(4, 20, true);
    d.setUint16(6, 0x0800, true);
    d.setUint16(8, 0, true);
    d.setUint16(10, 0, true);
    d.setUint16(12, 0, true);
    d.setUint32(14, crc, true);
    d.setUint32(18, size, true);
    d.setUint32(22, size, true);
    d.setUint16(26, name.length, true);
    d.setUint16(28, 0, true);
    b.set(name, 30);
    return b;
  }
  _cdEntry(name, crc, size, off) {
    const b = new Uint8Array(46 + name.length);
    const d = new DataView(b.buffer);
    d.setUint32(0, 0x02014b50, true);
    d.setUint16(4, 20, true);
    d.setUint16(6, 20, true);
    d.setUint16(8, 0x0800, true);
    d.setUint16(10, 0, true);
    d.setUint16(12, 0, true);
    d.setUint16(14, 0, true);
    d.setUint32(16, crc, true);
    d.setUint32(20, size, true);
    d.setUint32(24, size, true);
    d.setUint16(28, name.length, true);
    d.setUint16(30, 0, true);
    d.setUint16(32, 0, true);
    d.setUint16(34, 0, true);
    d.setUint16(36, 0, true);
    d.setUint32(38, 0, true);
    d.setUint32(42, off, true);
    b.set(name, 46);
    return b;
  }
  generate() {
    const parts = [];
    let off = 0;
    const offsets = [];
    for (const f of this.files) {
      offsets.push(off);
      parts.push(this._fileHeader(f.name, f.crc, f.data.length));
      parts.push(f.data);
      off += 30 + f.name.length + f.data.length;
    }
    const cdStart = off;
    const cd = [];
    for (let i = 0; i < this.files.length; i++) {
      const f = this.files[i];
      cd.push(this._cdEntry(f.name, f.crc, f.data.length, offsets[i]));
      off += 46 + f.name.length;
    }
    const cdSize = off - cdStart;
    const eocd = new Uint8Array(22);
    const d = new DataView(eocd.buffer);
    d.setUint32(0, 0x06054b50, true);
    d.setUint16(4, 0, true);
    d.setUint16(6, 0, true);
    d.setUint16(8, this.files.length, true);
    d.setUint16(10, this.files.length, true);
    d.setUint32(12, cdSize, true);
    d.setUint32(16, cdStart, true);
    d.setUint16(20, 0, true);
    return new Blob([...parts, ...cd, eocd], { type: 'application/zip' });
  }
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').substring(0, 200);
}

function zipFilenameFromUrl(url, ext, index) {
  if (url.startsWith('data:')) {
    const prefix = ['mp4','webm','mov','flv'].includes(ext) ? 'video' : ['mp3','m4a','wav','ogg','aac','weba'].includes(ext) ? 'audio' : 'image';
    return `${prefix}_${index}.${ext === 'jpeg' ? 'jpg' : ext}`;
  }
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    let name = parts[parts.length - 1] || `media_${index}`;
    if (!name.includes('.')) name += `.${ext}`;
    return sanitizeFilename(name);
  } catch {
    return `media_${index}.${ext}`;
  }
}

async function downloadBatch(items, imageType) {
  const zip = new ZipWriter();
  let errors = 0;
  const MAX_SIZE = 50 * 1024 * 1024;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const resp = await fetch(item.src);
      if (!resp.ok) { errors++; continue; }
      const buf = await resp.arrayBuffer();
      if (buf.byteLength > MAX_SIZE) { errors++; continue; }
      const fn = zipFilenameFromUrl(item.src, item.type || 'img', i + 1);
      zip.add(fn, new Uint8Array(buf));
    } catch {
      errors++;
    }
  }
  if (zip.fileCount === 0) {
    throw new Error(`Could not fetch any files (${errors} failed)`);
  }
  const blob = zip.generate();
  const url = URL.createObjectURL(blob);
  const ext = imageType && imageType !== 'all' ? `_${imageType}` : '';
  const zipName = `Imageination${ext}.zip`;
  await chrome.downloads.download({ url, filename: zipName, saveAs: false });
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

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

async function doBatchDownload(items, imageType, btn, doneText) {
  if (!items.length) return;
  btn.disabled = true;
  btn.textContent = `Downloading ${items.length}...`;
  try {
    await downloadBatch(items, imageType);
    btn.textContent = doneText;
  } catch (e) {
    btn.textContent = 'Failed';
  }
  setTimeout(() => { btn.textContent = btn.dataset.restore || 'Download All'; btn.disabled = false; }, 2000);
}

function renderAll() {
  const total = allItems.all?.length||0;
  const dlAll = $('#dlAllBtn');
  dlAll.hidden = false;
  dlAll.textContent = `\u2193 All (${total})`;
  dlAll.dataset.restore = `\u2193 All (${total})`;
  dlAll.onclick = () => doBatchDownload(allItems.all||[], 'all', dlAll, `Done ${total}`);
  activeType = 'all';
  renderSidebar();
  renderGrid();
  const pBtn = $('#panelDlAll');
  pBtn.dataset.restore = 'Download All';
  pBtn.onclick = () => {
    const type = pBtn.dataset.type;
    const items = allItems[type]||[];
    doBatchDownload(items, type, pBtn, `Done ${items.length}`);
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
