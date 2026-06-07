<p align="center">
  <img src="Logo.webp" alt="JIT" width="80" />
</p>

<h1 align="center">JIT - Browser Extension Studio</h1>

<p align="center">
  <em>Clean, focused browser extensions built with privacy and purpose.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/stack-vanilla%20HTML5%20%7C%20CSS3%20%7C%20JS-000000?style=flat-square" alt="Stack" />
  <img src="https://img.shields.io/badge/license-GPLv3-blue?style=flat-square" alt="GNU GPLv3" />
  <img src="https://img.shields.io/badge/status-production-00c853?style=flat-square" alt="Production Ready" />
</p>

<p align="center">
  <img src="Hero JIT.webp" alt="JIT - Browser Extension Studio" width="800" style="border-radius: 12px;" />
</p>

---

## Product Strategy

### Problem

Browser extensions are often bloated, privacy-invasive, or visually jarring. Users install a simple tool and end up with trackers, permission overreach, and confusing UIs. Extension developers lack a clean, open-source blueprint for building minimal MV3 extensions.

### Solution

JIT is a small studio that builds thoughtfully designed browser extensions -- tools that do one thing well, respect user privacy, and stay out of the way. This repository contains both the **marketing website** and the **source code** for all JIT extensions.

- **MutedHue** replaces harsh blue text selection with a subtle, adaptive grey across every website. Light and dark mode aware. Zero permissions required.
- **Refreshner** provides smart auto-refresh with customizable intervals, keyword page monitoring, live countdown timer, and audio alerts.

### Design Philosophy - Google-Inspired Dark UI

A pitch-black background (`#000`) with Google Sans typography, glassmorphism floating pill navigation, and an aurora gradient hero. Every component uses `clamp()`-based fluid typography, CSS Grid layout, and zero JavaScript frameworks. The design is minimal, fast, and respectful -- matching the extensions themselves.

### GEO-First Architecture

Every section heading is followed by a concise, descriptive subtitle, optimized for both human readers and AI crawlers. JSON-LD `@graph` (Organization + Person + 2x SoftwareApplication), per-page canonical URLs, Open Graph and Twitter Card meta tags, an AI-friendly `robots.txt`, and a complete `_headers` security policy complete the Generative Engine Optimization layer.

---

## Key Features

### Extensions

| Extension | Description | Version | Size |
|-----------|-------------|---------|------|
| **MutedHue** | Replaces bright blue text selection with a subtle, adaptive grey highlight. Light and dark mode aware. Shadow DOM support included. | 1.0.0 | 12 KB |
| **Refreshner** | Smart auto-refresh with quick presets, custom HH:MM:SS intervals, random intervals, keyword page monitoring, live countdown ring, and audio alerts on match. | 1.0.0 | 28 KB |

### Website

| Capability | Details |
|---|---|
| **Google-Inspired Dark UI** | Pitch black background, floating pill nav (glassmorphism, 52px), aurora hero wave animation |
| **Responsive Layout** | 5 mobile-first breakpoints, hamburger navigation on small screens, full mobile adaptation |
| **Scroll-Reveal Animations** | Sections fade in via IntersectionObserver, zero external animation libraries |
| **FAQ Accordion** | 8 questions, single-open pattern, full aria-expanded accessibility |
| **Contact Form** | FormSubmit.io serverless POST, delivers to pawansimha.pc@gmail.com, disabled-on-submit UX |
| **Developer Showcase** | 7-link grid (GitHub, LinkedIn, X, Google Dev, Google Skills, Credly, Portfolio) |
| **Cookie Consent** | localStorage-based GDPR/CCPA compliant banner, Accept or Decline |

### SEO & Discoverability

| Capability | Details |
|---|---|
| **JSON-LD Structured Data** | 4-node @graph (Organization + Person + 2 SoftwareApplication) for rich search results |
| **Open Graph / Twitter Cards** | Pre-configured meta tags for social link previews with Logo.webp |
| **AI Crawler Strategy** | robots.txt allows Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-Web, PerplexityBot; blocks training scrapers |
| **Sitemap** | sitemap.xml covering 2 URLs (/, /extension.html) |
| **Per-Page Canonicals** | Every page exports canonical URL pointing to github.io sub-path |
| **Security Headers** | CSP, HSTS, X-Frame-Options, Permissions-Policy via `_headers` (GitHub Pages) |

### Privacy & Compliance

| Capability | Details |
|---|---|
| **Zero Data Collection** | Extensions collect no personal information, no browsing history, no analytics, no telemetry |
| **Cookie Consent Banner** | localStorage-based consent management with GDPR-compliant opt-in |
| **Privacy Policy** | Full PRIVACY.md detailing FormSubmit and Google Fonts third-party usage |
| **Open Source** | GNU GPLv3 licensed. All code transparent, auditable, and free forever. |

---

## Visual Architecture

```
+--------------------------------------------------------------------+
|  Header (Floating Pill Nav)                                         |
|  [Logo] About . Extensions . FAQ . Developer . Contact [Download]  |
+--------------------------------------------------------------------+
|  Hero Section (aurora gradient wave animation)                      |
|  "Power your everyday with a JIT plan"                              |
|  [Download extensions]                                              |
+--------------------------------------------------------------------+
|  About  |  Extensions (3 cards)  |  FAQ (8 Qs)  |  Developer      |
|  (2-col |  MutedHue, Refreshner, | single-open  |  7-link grid    |
|   grid) |  Coming Soon           | accordion    |  + full Portfolio|
+--------------------------------------------------------------------+
|  Contact Form (FormSubmit.io - serverless POST)                     |
+--------------------------------------------------------------------+
|  Footer                                                             |
|  Logo + JIT text . Email . Social (GitHub, X, Email)               |
|  Product (About, Extensions, FAQ, Developer, Contact)              |
|  Company (Contact, Support, Careers)                               |
|  Legal (Privacy Policy, Terms of Service, Cookie Policy)           |
+--------------------------------------------------------------------+
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Markup** | HTML5 (semantic, aria-labels, JSON-LD) |
| **Styling** | CSS3 (30+ custom properties, `clamp()` fluid typography, CSS Grid, 5 breakpoints) |
| **Logic** | Vanilla JavaScript (ES6, IIFE strict mode, IntersectionObserver) |
| **Font** | Google Sans / Google Sans Text (self-hosted `@font-face` via gstatic CDN) |
| **Icons** | Inline SVG + Unicode symbols (no icon library dependency) |
| **Forms** | FormSubmit.io (serverless POST, no backend) |
| **Extensions** | Chrome Manifest V3 (content_scripts, service_worker, action popup) |

---

## Project Structure

```
JIT/
├── index.html                 # Main landing page (hero, about, extensions, FAQ, developer, contact, footer)
├── extension.html             # Extensions catalog (full extension details + Chrome Web Store links)
├── 404.html                   # Branded error page (dark theme, Google Sans, inline styles)
├── style.css                  # Full design system (30+ custom properties, clamp() typography, 5 breakpoints)
├── script.js                  # Vanilla JS IIFE (scroll reveal, FAQ accordion, mobile menu, contact form, cookie consent)
├── fonts.css                  # Google Sans and Google Sans Text @font-face declarations
├── Logo.webp                  # Brand logo (nav, favicon, about section, footer, OG image)
├── Hero JIT.webp              # README hero / banner image
│
├── MutedHue/                  # Chrome Extension MV3
│   ├── manifest.json          # content_scripts matches <all_urls>, run_at document_start
│   ├── content.css            # ::selection override rules (light + dark via @media)
│   ├── content.js             # Luminance detection, style injection, MutationObserver, Shadow DOM monkeypatch
│   └── icons/MutedHue.png     # Extension icon (16-128px)
│
├── Refreshner/                # Chrome Extension MV3
│   ├── manifest.json          # background service_worker, action popup, 4 permissions + <all_urls>
│   ├── background.js          # Alarm scheduler, message router, notification dispatcher
│   ├── content.js             # Page text scanner, keyword matching, audio alert trigger
│   ├── popup.html             # Timer UI with countdown ring, interval chips, keyword input
│   ├── popup.js               # Tab state management, countdown animation, chip/input handlers
│   ├── popup.css              # Glassmorphism popup design, ring progress bar, responsive layout
│   ├── index.html             # Standalone landing page for Refreshner (separate branding)
│   └── icons/Refreshner.png   # Extension icon
│
├── 404.html                   # Branded error page (dark theme, Google Sans, inline styles)
├── robots.txt                 # AI crawler directives (search allowed, training scrapers blocked)
├── sitemap.xml                # SEO sitemap (2 URLs with priority + lastmod)
├── _headers                   # Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)
├── site.webmanifest           # PWA manifest (name, theme_color, icons 192 + 512)
├── .gitignore                 # OS files, editor configs, env secrets, stale partials
├── LICENSE                    # GNU General Public License v3.0
├── PRIVACY.md                 # Privacy policy (GDPR/CCPA compliant, zero-collection)
├── PRD.md                     # Product requirements document
└── README.md                  # This file
```

---

## Quick Start

No build tools, no dependencies -- just open the file.

```bash
# 1. Clone the repository
git clone https://github.com/PawanSimha/JIT.git
cd JIT

# 2. Open the website
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

### To load extensions in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `MutedHue/` or `Refreshner/` folder

---

## Product Roadmap

- [ ] **Firefox port** -- Rewrite extensions for WebExtension API compatibility
- [ ] **Chrome Web Store publishing** -- Submit MutedHue and Refreshner officially
- [ ] **Privacy Policy / ToS pages** -- Convert PRIVACY.md to dedicated HTML pages
- [ ] **FormSubmit thank-you redirect** -- Custom redirect page after form submission
- [ ] **PWA service worker** -- Add offline caching support

---

## Developer Experience

| Command | Description |
|---------|-------------|
| `open index.html` | View the landing page |
| `open extension.html` | View extensions catalog |
| Load unpacked in Chrome | Test extensions locally |

### Contribution

This is an open-source project. Submit feature requests, report bugs, or contribute code on the [GitHub repository](https://github.com/PawanSimha/JIT). For feature requests or bugs, use the contact form on the website or email directly.

---

## License

Distributed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for more information.

---

## Links

| Platform | URL |
|----------|-----|
| **GitHub** | [github.com/PawanSimha](https://github.com/PawanSimha) |
| **LinkedIn** | [linkedin.com/in/pawansimha](https://www.linkedin.com/in/pawansimha) |
| **X / Twitter** | [x.com/pawansimha](https://x.com/pawansimha) |
| **Google Developer** | [g.dev/pawansimha](https://g.dev/pawansimha) |
| **Google Skills Profile** | [skills.google.com/public_profiles/...](https://www.skills.google.com/public_profiles/9108dded-855b-466a-b261-0a7519d472cf) |
| **Credly Badges** | [credly.com/users/pawansimha/badges](https://www.credly.com/users/pawansimha/badges) |

---

<p align="center">
  <b>Pawan Simha R</b>
  <br />
  <sub>Built with vanilla HTML5 . CSS3 . JavaScript (ES6)</sub>
</p>
