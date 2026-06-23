(() => {
  'use strict';

  const IMG_EXTS = ['png','jpeg','jpg','webp','svg','ico','gif','bmp','avif'];
  const VID_EXTS = ['mp4','webm','mov','flv'];
  const AUD_EXTS = ['mp3','m4a','wav','ogg','aac','weba'];
  const ALL_EXTS = [...IMG_EXTS, ...VID_EXTS, ...AUD_EXTS];

  function resolve(url) {
    try { return new URL(url).href; } catch {
      try { return new URL(url, location.href).href; } catch { return null; }
    }
  }

  function getType(src) {
    if (src.startsWith('data:image/svg+xml')) return 'svg';
    if (src.startsWith('data:image/png')) return 'png';
    if (src.startsWith('data:image/jpeg')) return 'jpeg';
    if (src.startsWith('data:image/webp')) return 'webp';
    if (src.startsWith('data:image/gif')) return 'gif';
    if (src.startsWith('data:image/')) return 'other';
    const m = src.match(/\.(\w{2,4})(?:[?#]|$)/i);
    if (!m) return 'other';
    const e = m[1].toLowerCase();
    if (ALL_EXTS.includes(e)) return e;
    return 'other';
  }

  function isVideoType(t) { return VID_EXTS.includes(t); }
  function isAudioType(t) { return AUD_EXTS.includes(t); }

  const seen = new Set();

  function collect(src, alt, w, h, from, poster) {
    if (!src) return null;
    const url = resolve(src);
    if (!url || url.startsWith('blob:')) return null;
    const key = url.split('?')[0].split('#')[0];
    if (seen.has(key)) return null;
    seen.add(key);
    const type = getType(url);
    return { src: url, alt: alt || '', width: w || null, height: h || null, type, fromType: from || 'img', poster: poster || null };
  }

  function scan() {
    seen.clear();
    const map = {};

    function add(item) {
      if (!item) return;
      const t = item.type;
      if (!map.all) map.all = [];
      map.all.push(item);
      if (!map[t]) map[t] = [];
      map[t].push(item);
      if (item.fromType === 'icon') {
        if (!map.favicon) map.favicon = [];
        map.favicon.push(item);
      }
      if (item.fromType === 'video') {
        if (!map.video) map.video = [];
        map.video.push(item);
      }
      if (item.fromType === 'audio') {
        if (!map.audio) map.audio = [];
        map.audio.push(item);
      }
    }

    // --- images ---
    try {
      document.querySelectorAll('img[src]').forEach(el => {
        if (el.src) {
          const w = el.naturalWidth || el.width || parseInt(el.getAttribute('width')) || null;
          const h = el.naturalHeight || el.height || parseInt(el.getAttribute('height')) || null;
          add(collect(el.src, el.alt, w, h, 'img'));
        }
      });
    } catch(e) {console.warn('img scan err',e)}

    try {
      document.querySelectorAll('picture source').forEach(el => {
        const srcset = el.getAttribute('srcset');
        if (srcset) srcset.split(',').forEach(p => {
          const u = p.trim().split(/\s+/)[0];
          if (u) add(collect(u, '', null, null, 'picture'));
        });
        if (el.src) add(collect(el.src, '', null, null, 'picture'));
      });
    } catch(e) {console.warn('picture scan err',e)}

    try {
      document.querySelectorAll('link[rel*="icon"], link[rel*="apple-touch"]').forEach(el => {
        if (el.href) add(collect(el.href, 'favicon', null, null, 'icon'));
      });
    } catch(e) {console.warn('icon scan err',e)}

    try {
      document.querySelectorAll('svg:not([data-imgi])').forEach(el => {
        try {
          el.setAttribute('data-imgi','1');
          const r = el.getBoundingClientRect();
          const s = new XMLSerializer().serializeToString(el);
          add(collect('data:image/svg+xml,'+encodeURIComponent(s), el.getAttribute('aria-label')||'', Math.round(r.width)||null, Math.round(r.height)||null, 'svg'));
        } catch(e2) {}
      });
    } catch(e) {console.warn('svg scan err',e)}

    try {
      document.querySelectorAll('[style*="background"]').forEach(el => {
        try {
          const bg = getComputedStyle(el).backgroundImage;
          if (bg && bg !== 'none') {
            bg.replace(/url\(["']?([^"')]+)["']?\)/g, (_, url) => add(collect(url, '', el.offsetWidth||null, el.offsetHeight||null, 'bg')));
          }
        } catch(e2) {}
      });
    } catch(e) {console.warn('bg scan err',e)}

    // --- video ---
    try {
      document.querySelectorAll('video[src]').forEach(el => {
        if (el.src) {
          const w = el.videoWidth || parseInt(el.getAttribute('width')) || null;
          const h = el.videoHeight || parseInt(el.getAttribute('height')) || null;
          const poster = el.poster || null;
          add(collect(el.src, el.title || '', w, h, 'video', poster));
        }
      });
    } catch(e) {console.warn('video[src] scan err',e)}

    try {
      document.querySelectorAll('video source[src]').forEach(el => {
        if (el.src) add(collect(el.src, '', null, null, 'video'));
      });
    } catch(e) {console.warn('video source scan err',e)}

    // extract poster images from video elements
    try {
      document.querySelectorAll('video[poster]').forEach(el => {
        if (el.poster) add(collect(el.poster, el.title || 'poster', null, null, 'poster'));
      });
    } catch(e) {console.warn('poster scan err',e)}

    // --- audio ---
    try {
      document.querySelectorAll('audio[src]').forEach(el => {
        if (el.src) add(collect(el.src, el.title || '', null, null, 'audio'));
      });
    } catch(e) {console.warn('audio[src] scan err',e)}

    try {
      document.querySelectorAll('audio source[src]').forEach(el => {
        if (el.src) add(collect(el.src, '', null, null, 'audio'));
      });
    } catch(e) {console.warn('audio source scan err',e)}

    return map;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'ping') { sendResponse({ok:true}); return false; }
    if (msg.type === 'getImages') { sendResponse(scan()); return false; }
  });
})();
