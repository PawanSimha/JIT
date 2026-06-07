# JIT — Browser Extension Studio · Context Map

---

## 1. System Overview & Strategic Intent

**What it is:** JIT is a small studio brand with a marketing website and two Chrome Manifest V3 extensions. The website serves as landing page, extension showcase, developer portfolio, and contact gateway. The extensions (MutedHue, Refreshner) are privacy-first tools that do one thing well.

**Who it's for:** End-users who want minimal, respectful browser extensions. Developers evaluating open-source Chrome extension patterns.

**Core operational goals:**
- Zero data collection across all surfaces (website + extensions)
- Static-first website — no backend, no build step, deployable by pushing to any static host
- Extensions that require no accounts, no sign-ups, no telemetry
- Brand presence with Google-inspired dark UI design system

---

## 2. Production Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Markup** | HTML5 | — | Semantic HTML5, aria-labels, JSON-LD structured data |
| **Styling** | CSS3 (custom design system) | — | 30+ custom properties, `clamp()` fluid typography, CSS Grid, 5 breakpoints |
| **Font** | Google Sans / Google Sans Text | woff2 | Self-hosted `@font-face` declarations via `fonts.css` from gstatic CDN |
| **Logic** | Vanilla JavaScript (ES6) | — | IIFE strict mode, `IntersectionObserver`, `MutationObserver`, `localStorage` |
| **Forms** | FormSubmit.io | — | Serverless POST, forwards to pawansimha.pc@gmail.com |
| **Icons** | Inline SVG + Unicode symbols | — | No icon library dependency |
| **Chrome Ext** | Manifest V3 | MV3 | content_scripts, service_worker (`background.js`), action popup |
| **Hosting** | GitHub Pages | — | Static HTML at root, no build step |
| **Security** | `_headers` (GitHub Pages) | — | CSP, HSTS, X-Frame-Options, Permissions-Policy |
| **SEO** | robots.txt + sitemap.xml + JSON-LD | — | AI crawler separation, 4-node `@graph` schema |

---

## 3. Core Architectural Design Patterns

### Website (Static Site)
- **Rendering paradigm:** Pure static (no SSR, no SSG framework). Served as flat HTML/CSS/JS.
- **Routing:** File-based, manual. `index.html` = home, `extension.html` = extensions catalog. In-page anchor navigation (`#about`, `#faq`, etc.) via native `scroll-behavior: smooth`.
- **State management:** None. No frameworks, no stores, no reactive state. Cookie consent preference persisted in `localStorage` key `jit_cookie_consent`.
- **Data flow (contact form):** Browser → POST to FormSubmit.io → email to pawansimha.pc@gmail.com. No database, no storage on our end.
- **Header/Footer:** Inlined directly in each HTML page (no partials, no JS fetch). Both pages share identical nav/footer markup.
- **Scroll reveal:** `IntersectionObserver` with `threshold: 0.08`, adds `.visible` class, unobserve after reveal.
- **FAQ accordion:** Single-open pattern. Closes other items on open, manages `aria-expanded`.

### MutedHue Extension (MV3)
- **Pattern:** Content script injection (`run_at: document_start`). No popup, no background service worker.
- **Logic:** Injects a `<style data-mutedhue>` element into the page. Switches between light/dark `::selection` rules based on computed background luminance. Uses `MutationObserver` on `<html>` attributes for theme changes, and monkeypatches `Element.prototype.attachShadow` to inject into shadow DOMs.
- **Permissions:** None (no `permissions` key in manifest).

### Refreshner Extension (MV3)
- **Pattern:** Background service worker + content script + popup. State persisted via `chrome.storage.local`.
- **Background (`background.js`):** Event-driven message router. Handlers: `startRefresh`, `stopRefresh`, `getState`, `pageReady`, `keywordMatch`. Uses `chrome.alarms` for scheduling tab refreshes. Computes fixed or random intervals. Notifies via `chrome.notifications` on keyword match.
- **Content script (`content.js`):** Scans page text for keywords on load, reports back to background via `chrome.runtime.sendMessage`. Plays audio alert on match.
- **Popup (`popup.html/popup.js/popup.css`):** Timer UI with countdown ring (SVG `stroke-dashoffset` animation), interval preset chips, keyword input, hard-refresh toggle, status indicator.
- **Permissions:** `storage`, `alarms`, `notifications`, `tabs`. Host permissions: `<all_urls>`.

---

## 4. Folder Architecture & Mapping

```
JIT/
├── index.html                  # Main landing page — hero, about, extensions, FAQ, developer, contact, footer
├── extension.html              # Extensions catalog — all extensions listed with details + Chrome store links
├── 404.html                    # Branded error page — dark theme, Google Sans, "Back to Home" CTA
│
├── style.css                   # Design system (~830 lines) — 30+ custom properties, clamp() typography,
│                               # CSS Grid layout, 5 mobile-first breakpoints, micro-interactions,
│                               # scroll reveal, cookie banner, custom scrollbar
├── fonts.css                   # Google Sans / Google Sans Text @font-face declarations from gstatic CDN
├── script.js                   # Vanilla JS IIFE — scroll reset, hamburger toggle, FAQ accordion,
│                               # IntersectionObserver reveal, contact form submit, cookie consent
│
├── Logo.webp                  # Brand logo — used in nav (36px), about section (300px), footer (44px),
│                               # favicon (32/192/180), apple-touch-icon, OG image, JSON-LD image
├── Hero JIT.webp              # README hero / banner image
│
├── MutedHue/                   # Chrome Extension MV3 — adaptive text selection color replacer
│   ├── manifest.json           #   content_scripts matches <all_urls>, run_at document_start
│   ├── content.css             #   ::selection override rules (light + dark via @media)
│   ├── content.js              #   Luminance detection, style injection, MutationObserver, Shadow DOM
│   └── icons/MutedHue.png      #   Extension icon (same asset used for all sizes 16-128)
│
├── Refreshner/                 # Chrome Extension MV3 — smart auto-refresh + keyword page monitor
│   ├── manifest.json           #   background service_worker, action popup, 4 permissions
│   ├── background.js           #   Alarm scheduler, message router, notification dispatcher
│   ├── content.js              #   Page text scanner, keyword matching, audio alert trigger
│   ├── popup.html              #   Timer UI with countdown ring, interval chips, keyword input
│   ├── popup.js                #   Tab state management, countdown animation, chip/input handlers
│   ├── popup.css               #   Glassmorphism popup design, ring progress bar, responsive layout
│   ├── index.html              #   Standalone landing page for Refreshner (separate branding)
│   └── icons/Refreshner.png    #   Extension icon
│
├── PRD.md                      # Product Requirements Document — personas, OKRs, MoSCoW, user journeys
├── README.md                   # Documentation — badges, tech stack, project tree, quick start, roadmap
├── PRIVACY.md                  # Privacy policy — zero-collection, functional cookies, FormSubmit, GDPR/CCPA
├── LICENSE                     # GNU General Public License v3.0 — full text with copyright header
│
├── robots.txt                  # AI crawler directives — search bots allowed, training scrapers blocked
├── sitemap.xml                 # SEO sitemap — 2 URLs (/ at 1.0, /extension.html at 0.8)
├── site.webmanifest            # PWA manifest — name, theme_color, icons (192 + 512)
├── _headers                    # Security headers — HSTS, CSP, X-Frame-Options, Permissions-Policy
├── .gitignore                  # Ignores — OS files, editor configs, env secrets, stale partials
└── context.md                  # THIS FILE — architectural state map for session continuity
```

---

## 5. Engineering Guardrails & Anti-Patterns

### Style Conventions
- **Typography:** Always use `clamp()` for font-size, line-height, and spacing. Minimum 3 values: `clamp(min, preferred, max)`.
- **Color:** All colors must reference CSS custom properties from `:root` (e.g., `var(--g-blue)`, `var(--text-2)`). Never hardcode hex/rgba values inline except in `_headers`, `fonts.css`, or isolated components like `404.html`.
- **Units:** Use `rem` for text sizing, `px` for borders/outlines, `vw/vh` for viewport-relative spacing, `%` for fluid widths. Never use `em` for font-size (compound scaling risk).
- **Naming:** BEM-lite. Class names are lowercase-hyphenated (e.g., `.header-brand-text`, `.footer-social`, `.ext-card`). No camelCase CSS classes.
- **Media queries:** Mobile-first. Breakpoints: `<560px` (small phone), `<640px` (cookie banner), `<768px` (tablet), `≥769px` (laptop/desktop), `≥1025px` (large desktop), `≥1440px` (ultra-wide).
- **JS:** Strict mode IIFE `(function () { 'use strict'; ... })();`. Variables declared with `const` (preferred) or `let` (when reassigned). No `var`. No global namespace pollution.

### Strict Anti-Patterns
- **Do NOT add JavaScript frameworks or libraries** — no React, Vue, Alpine, jQuery, etc. Vanilla JS only.
- **Do NOT use external npm/CDN dependencies** for functionality. Only Google Fonts (via `fonts.css` self-hosted `@font-face`) and FormSubmit (form action URL) are allowed.
- **Do NOT add a build step** — no Webpack, Vite, Parcel, etc. This is a zero-build static site.
- **Do NOT use em dashes (—) in HTML body content.** Use commas or hyphens instead. CSS comments and markdown files are exempt.
- **Do NOT add analytics, tracking pixels, or telemetry** to the website. The cookie banner explicitly states "no tracking or analytics cookies."
- **Do NOT revert to external partial loading** (header/footer via JS fetch). The header/footer are inlined directly in each HTML page to support `file://` protocol and offline use.
- **Do NOT use `<link rel="preconnect">` without `crossorigin` for cross-origin font resources.**
- **Do NOT add server-side code** — PHP, Node.js, Python, etc. The site is 100% static. FormSubmit handles the only dynamic operation.
- **Do NOT use `!important`** in CSS except for `::selection` in extension content scripts (where it's required to override page styles).

---

## 6. Active Session State & Milestone Checklist

### `[x]` Completed Features (Milestones Reached)
- `[x]` Initial repo setup + first commit (June 6, 2026)
- `[x]` Google-inspired dark theme design system (`style.css`: 30+ custom properties, `clamp()` fluid typography, CSS Grid)
- `[x]` Floating pill navigation bar (glassmorphism, responsive, hamburger on mobile)
- `[x]` Hero section with aurora gradient + wave animation (4 colors, equal split, animated `background-position`)
- `[x]` About section (3-column grid on desktop, logo between text and features on mobile)
- `[x]` Extensions section (3 cards: MutedHue, Refreshner, Coming Soon)
- `[x]` FAQ accordion (8 questions, single-open, aria-expanded management)
- `[x]` Developer section (7-link grid, full-width Portfolio button)
- `[x]` Contact form (FormSubmit.io, serverless POST, disabled-on-submit UX)
- `[x]` Footer (logo + brand text side-by-side, email, social links, 3-column product/company/legal)
- `[x]` Extension catalog page (`extension.html`) with version/size details and Chrome Web Store links
- `[x]` JSON-LD structured data (4-node `@graph`: Organization + Person + 2× SoftwareApplication)
- `[x]` Open Graph + Twitter Card meta tags (full set on both HTML pages)
- `[x]` SEO/GEO meta tags (keywords, robots, canonical, googlebot directives)
- `[x]` Favicon set (32, 192, apple-touch-icon 180) + `site.webmanifest`
- `[x]` Preload critical assets (Logo.webp, Google Sans woff2 files, fonts.css)
- `[x]` `robots.txt` with 2026 AI crawler separation (search allowed, training scrapers blocked)
- `[x]` `sitemap.xml` (2 URLs with priority + lastmod)
- `[x]` `_headers` with security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- `[x]` `404.html` branded error page (dark theme, Google Sans, "Back to Home" button)
- `[x]` Cookie consent banner (localStorage, Accept/Decline, visible on first visit only)
- `[x]` `PRIVACY.md` (GDPR/CCPA compliant, zero-collection, FormSubmit disclosure)
- `[x]` `LICENSE` (GNU GPLv3) + per-file copyright headers
- `[x]` `PRD.md` (problem statement, personas, MoSCoW, OKRs, technical constraints)
- `[x]` `.gitignore` (OS files, editor configs, env secrets, stale partials)
- `[x]` Custom scrollbar (black track, Google Blue dragger, Firefox `scrollbar-color`)
- `[x]` Width/height attributes on all images (CLS prevention)
- `[x]` `aria-label` on all icon-only links and interactive controls
- `[x]` `:focus-visible` outlines enhanced per element type
- `[x]` MutedHue extension (content script, luminance detection, Shadow DOM support)
- `[x]` Refreshner extension (background service worker, alarm scheduler, keyword monitoring, popup UI)

### `[/]` In-Progress Workloads
- `[/]` GitHub Pages activation (requires manual click in repo settings)
- `[x]` README.md updated (complete rewrite following portfolio format, no emojis/em dashes)

### `[ ]` Upcoming Implementations (Next Steps)
- `[ ]` Deploy live at `https://pawansimha.github.io/JIT/`
- `[ ]` Submit MutedHue and Refreshner to Chrome Web Store
- `[ ]` Firefox WebExtension port for both extensions
- `[ ]` Add Privacy Policy / Terms of Service as dedicated HTML pages (footer links currently point to `PRIVACY.md`)
- `[ ]` Set up custom FormSubmit thank-you redirect page
- `[ ]` Add PWA service worker for offline caching
