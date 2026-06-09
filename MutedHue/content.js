(() => {
  'use strict';
  const LIGHT_RULE = `::selection{background-color:rgba(211,211,211,0.2)!important;color:inherit!important}`;
  const DARK_RULE = `::selection{background-color:rgba(211,211,211,0.12)!important;color:inherit!important}`;

  let styleTag = null;

  function getRule() {
    if (!document.body) return LIGHT_RULE;
    const bg = getComputedStyle(document.body).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return LIGHT_RULE;
    const lum = 0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3];
    return lum > 128 ? LIGHT_RULE : DARK_RULE;
  }

  function update() {
    if (styleTag) styleTag.textContent = getRule();
  }

  function inject(root) {
    if (!root || root.querySelector('style[data-mutedhue]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-mutedhue', '');
    root.appendChild(s);
    return s;
  }

  styleTag = inject(document.head || document.documentElement);
  if (styleTag) update();

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', update);

  const attrObserver = new MutationObserver(update);
  attrObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme', 'data-color-mode', 'data-bs-theme'],
  });

  const orig = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const sr = orig.call(this, init);
    const s = inject(sr);
    if (s) s.textContent = getRule();
    return sr;
  };
})();
