<h1 align="center">⚡ JIT — Browser Extension Studio</h1>
<p align="center">
  <em>Clean, focused browser extensions built with privacy and purpose.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/stack-vanilla%20JS%20%7C%20CSS3%20%7C%20HTML5-blue" alt="Stack" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-orange" alt="PRs" />
</p>

---

## 📋 Overview

**JIT** is a small studio that builds thoughtfully designed browser extensions — tools that do one thing well, respect user privacy, and stay out of the way. This repository contains both the **marketing website** and the **source code** for all JIT extensions.

The website serves as the brand landing page, extension showcase, developer portfolio, and contact gateway — all in a dark-themed, Google-inspired design system.

### Problem Statement

Browser extensions are often bloated, privacy-invasive, or visually jarring. JIT exists to prove that extensions can be minimal, respectful, and beautifully integrated into the browsing experience.

---

## ✨ Key Features

### 🧩 Extensions
| Extension | Description |
|-----------|-------------|
| **MutedHue** | Replaces the harsh blue text selection highlight with a subtle, adaptive grey across every website. Light and dark mode aware. |
| **Refreshner** | Smart auto-refresh with customizable intervals, keyword page monitoring, countdown timer, and audio alerts. |

### 🌐 Website
- **Google-inspired dark UI** — pitch black background, floating pill nav, aurora hero gradient
- **Fully responsive** — works across desktop, tablet, and mobile
- **FAQ accordion** — 8 common questions with expand/collapse
- **Contact form** — powered by FormSubmit, delivers to `iampawansimha.2004@gmail.com`
- **Developer showcase** — linked portfolio, GitHub, LinkedIn, X, Credly, Google Dev & Skills profiles
- **Scroll reveal animations** — sections fade in as you scroll
- **Mobile hamburger menu** — collapsible navigation on small screens

---

## 🖼️ UI / Architecture

```
┌──────────────────────────────────────────────────┐
│              Floating Pill Nav                    │
│  [Logo] About · Extensions · FAQ · Developer ·   │
│                                    [Download]     │
├──────────────────────────────────────────────────┤
│              Hero Section (aurora gradient)       │
│         "Power your everyday with a JIT plan"     │
│                   [Download extensions]           │
├──────────────────────────────────────────────────┤
│  About  │  Extensions  │  FAQ  │  Developer  │    │
│         │  (3 cards)   │ (8 Qs) │  (7 links)  │   │
├──────────────────────────────────────────────────┤
│              Contact Form (FormSubmit)            │
├──────────────────────────────────────────────────┤
│  Footer — Logo · Email · Social · Sitemap         │
└──────────────────────────────────────────────────┘
```

> ![Screenshot](Logo.png) — Placeholder for landing page screenshot.

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| **Markup**   | HTML5                               |
| **Styling**  | CSS3 (custom design system, no frameworks) |
| **Logic**    | Vanilla JavaScript (ES6)            |
| **Font**     | Google Sans / Google Sans Text (self-hosted `@font-face`) |
| **Icons**    | Inline SVG + Unicode symbols        |
| **Forms**    | FormSubmit.io (serverless POST)     |
| **Extensions** | Chrome Manifest V3               |

---

## 📁 Project Structure

```
JIT/
├── index.html                 # Main landing page
├── extension.html             # All extensions listing page
├── style.css                  # Full design system (~800 lines)
├── script.js                  # FAQ accordion, scroll reveal, mobile menu, contact
├── fonts.css                  # Google Sans @font-face declarations
├── Logo.png                   # Brand logo (nav, favicon, about section)
│
├── MutedHue/                  # Chrome Extension — MutedHue
│   ├── manifest.json
│   ├── content.css            # ::selection override styles
│   ├── content.js
│   └── icons/MutedHue.png
│
├── Refreshner/                # Chrome Extension — Refreshner
│   ├── manifest.json
│   ├── background.js          # Service worker (alarms, notifications)
│   ├── content.js
│   ├── popup.html / popup.css / popup.js  # Timer UI
│   └── icons/Refreshner.png
│
├── header.html                # (partial — kept for reference)
├── footer.html                # (partial — kept for reference)
└── include.js                 # (partial — kept for reference)
```

---

## 🚀 Quick Start

No build tools, no dependencies — just open the file.

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

## 📬 API / Endpoints

The website uses **FormSubmit** as a serverless form backend:

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | `https://formsubmit.co/pawansimha.pc@gmail.com` | Contact form submissions |

No other API endpoints — the site is fully static.

---

## 🗺️ Product Roadmap

- [ ] **Firefox port** — Rewrite extensions for WebExtension API compatibility
- [ ] **Chrome Web Store publishing** — Submit MutedHue and Refreshner officially
- [ ] **Analytics dashboard** — Optional opt-in usage stats for extension developers

---

## 👩‍💻 Developer Experience

| Command | Description |
|---------|-------------|
| `open index.html` | View the landing page |
| `open extension.html` | View extensions catalog |
| Load unpacked in Chrome | Test extensions locally |

**Contributions are welcome!**  
Open an issue or PR on [GitHub](https://github.com/PawanSimha/JIT).  
For feature requests or bugs, use the contact form on the site or email directly.

---

## 📄 License

This project is licensed under the **MIT License**.

> No `LICENSE` file was found in the repository — MIT is assumed. See [choosealicense.com](https://choosealicense.com) for options.

---

<p align="center">
  <sub>Built by <a href="https://portfolio-pawansimha.vercel.app">Pawan Simha R</a> · Platform Engineering · Sapthagiri NPS University</sub>
</p>
