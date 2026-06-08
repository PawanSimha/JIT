# Product Requirements Document — JIT Browser Extension Studio

| Field | Detail |
|---|---|
| **Project Name** | JIT — Browser Extension Studio |
| **Target Release** | Q2 2026 |
| **Status** | Active Development |
| **Author** | Pawan Simha R |
| **Repository** | [github.com/PawanSimha/JIT](https://github.com/PawanSimha/JIT) |

---

## 1. Executive Summary

JIT is a small studio that builds clean, focused browser extensions and a brand website to showcase them. The product consists of two Chrome extensions — **MutedHue** (adaptive text-selection color replacement) and **Refreshner** (smart auto-refresh with keyword page monitoring) — plus a dark-themed marketing site with a developer portfolio, FAQ, and contact gateway. We are building this to prove that browser extensions can be minimal, privacy-respecting, and beautifully integrated into the user's daily workflow.

---

## 2. Problem Statement

**Pain Point:** Browser extensions today are often bloated, privacy-invasive, visually jarring, or abandoned. Users face three specific frictions:

1. **Visual fatigue** — The default blue text-selection highlight clashes with many site themes and is especially jarring in dark mode.
2. **Inefficient page monitoring** — Users who need to watch pages for content changes resort to manual refreshing, unreliable tools, or extensions with excessive permissions.
3. **Distrust of extensions** — Most extensions request broad permissions, phone home with analytics, or bundle trackers.

**JIT's solution** is a pair of extensions that each do one thing exceptionally well with zero data collection, paired with a transparent brand site that communicates values clearly.

---

## 3. Target Personas

| Persona | Role | Needs | Behavior |
|---|---|---|---|
| **Visual Comfort Seeker** | General web user / Designer | Wants a consistent, eye-friendly text-selection experience across all sites | Installs MutedHue and forgets about it — the extension works silently on every page |
| **Productivity User** | Developer / QA / Shopper | Needs to auto-refresh pages and get notified when specific content appears or disappears | Configures Refreshner intervals and keywords, leaves browser running in background |
| **Privacy-Conscious Adopter** | Power user / Open source advocate | Seeks tools that are transparent, auditable, and collect zero data | Reads the FAQ, inspects the source on GitHub, contributes issues/PRs |

---

## 4. Success Metrics (OKRs / KPIs)

| KPI | Target | Measurement |
|---|---|---|
| **Chrome Web Store installs** (combined) | >10,000 within 6 months of publishing | CWS developer dashboard |
| **Website bounce rate** | <45% | Google Analytics (opt-in) |
| **Contact form completion rate** | >20% of unique visitors | FormSubmit submission count |
| **GitHub stars** | >100 | Repository Insights |
| **GitHub issues / PRs** | >5 community contributions | GitHub pulse |
| **Extensions uninstall rate** | <15% after 30 days | CWS uninstall metrics |

---

## 5. Core Features & Requirements (MoSCoW Method)

### P0 — Must Have (shipped or actively building)

| Feature | Component | Status |
|---|---|---|
| MutedHue extension — adaptive `::selection` override | Chrome MV3 content script | ✅ Shipped (v1.0.0) |
| MutedHue — light/dark mode detection via luminance | `content.js` + `MutationObserver` | ✅ Shipped |
| MutedHue — Shadow DOM injection | `Element.prototype.attachShadow` monkey-patch | ✅ Shipped |
| Refreshner extension — preset/custom/random intervals | `background.js` + `alarms` API | ✅ Shipped |
| Refreshner — keyword detection with appear/disappear modes | `content.js` regex scanning | ✅ Shipped |
| Refreshner — audio alert (Web Audio API) | Two-tone sine beep | ✅ Shipped |
| Refreshner — notification on keyword match | `chrome.notifications` | ✅ Shipped |
| Refreshner — countdown timer in popup | SVG progress ring | ✅ Shipped |
| Marketing website — landing page | `index.html` | ✅ Shipped |
| Marketing website — extensions listing page | `extension.html` | ✅ Shipped |
| Marketing website — extension detail pages | `descriptions/MutedHue.html`, `descriptions/Refreshner.html` | ✅ Shipped |
| ZIP download + install modal for Developer mode | `MutedHue.zip`, `Refreshner.zip` + modal | ✅ Shipped |
| FAQ accordion (8 questions) | `script.js` + HTML | ✅ Shipped |
| Contact form → email (FormSubmit) | POST to `pawansimha.pc@gmail.com` | ✅ Shipped |
| Developer portfolio section (7 social links) | `.dev-links` grid | ✅ Shipped |
| Responsive dark-theme design system | `style.css` (~1140 lines) | ✅ Shipped |

### P1 — Should Have (high priority, not yet complete)

| Feature | Rationale |
|---|---|
| **Chrome Web Store publishing** | Both extensions are fully coded but not yet submitted to CWS |
| **Privacy Policy / Terms of Service pages** | Footer links currently point to PRIVACY.md placeholders — needed before CWS submission |
| **Thank-you / redirect page after form submission** | Currently button just shows "Sending…" with no success confirmation |
| **Firefox (WebExtension) port** | MutedHue CSS-only port is trivial; Refreshner needs `browser.alarms` & `browser.notifications` adaptation |

### P2 — Could Have (logical future enhancements)

| Feature | Rationale |
|---|---|
| Opt-in usage analytics dashboard | Helps developers understand which features are used most |
| Extension update notification on website | Display latest version / changelog on `extension.html` |
| Dark/light mode toggle on website | Currently follows OS preference via CSS custom properties (partially implemented) |
| i18n / multi-language FAQ | Broaden reach to non-English users |
| Automated CI tests for extensions | Run lint + validation on PRs to `MutedHue/` and `Refreshner/` |

---

## 6. Technical Constraints

| Constraint | Detail |
|---|---|
| **Chrome MV3 only** | Both extensions target Manifest V3. Service workers replace background pages. No `webRequest` blocking — Refreshner uses `alarms` + `tabs.reload`. |
| **Zero external network calls from extensions** | MutedHue requests **zero permissions**. Refreshner only uses `storage`, `alarms`, `notifications`, `tabs` — all local. No analytics, no telemetry. |
| **Browser storage for Refreshner state** | `chrome.storage.local` — limited to ~10 MB per extension. State keyed by `tabId`. |
| **Form submission via third-party** | `formsubmit.co` handles email forwarding. No custom backend. Form data leaves the browser to an external service. |
| **No build step** | Pure static HTML/CSS/JS. No npm, no bundler, no transpilation. Google Sans fonts loaded via CDN `@font-face` from `fonts.gstatic.com`. |
| **Web Audio API for alerts** | Refreshner uses `OscillatorNode` + `GainNode` — works in Chrome MV3 service-worker-controlled tabs. |
| **CSS-only selection override** | MutedHue uses `::selection` + `::-moz-selection` with `!important`. No JavaScript required for basic operation (JS handles adaptive brightness). |

---

## 7. User Journey

### Primary Flow — Installing & Using MutedHue

```
1. User lands on JIT website (index.html)
2. Reads hero headline → understands value proposition
3. Clicks "Learn More" on MutedHue card or "Download" in nav
4. Lands on descriptions/MutedHue.html or extension.html
5. Clicks "Download Extension" / "Add to Chrome" → ZIP downloads
6. Install modal appears with step-by-step "Load unpacked" guide:
   a. Extract ZIP to a folder
   b. Open chrome://extensions
   c. Enable Developer mode
   d. Click Load unpacked → select extracted folder
7. MutedHue immediately activates on every site:
   a. Injects <style data-mutedhue>
   b. Computes body background luminance
   c. Sets ::selection to rgba(211,211,211,0.2) [light] or 0.12 [dark]
   d. Watches for theme changes via MutationObserver
8. User forgets extension exists — selection highlight is now consistently subtle everywhere
```

### Secondary Flow — Installing & Using Refreshner

```
1. User lands on extension.html or descriptions/Refreshner.html
2. Clicks "Download Extension" / "Add to Chrome" → ZIP downloads
3. Follows same Load unpacked steps as MutedHue
4. Extension appears in Chrome toolbar
5. User opens Refreshner popup on target tab
2. Selects interval: preset chip (30s) or custom (HH:MM:SS)
3. Optionally toggles "Hard Refresh" checkbox (bypassCache)
4. Optionally enters keywords: "in stock" + "Add keyword"
5. Selects mode: "Appears" (triggers when text shows up)
6. Clicks "Start"
7. Background service worker:
   a. Saves config to chrome.storage.local
   b. Creates chrome.alarms delay
   c. On alarm fire → tabs.reload(tabId)
   d. After reload → content.js scans body.innerText
   e. If keyword found → clear alarm, show notification, play beep
   f. If not found → schedule next alarm (loop)
8. User hears beep / sees notification → switches to tab → sees matched content
```

---

## 8. Out of Scope (Non-Goals)

- ❌ **No user accounts or authentication** — Extensions work immediately after install with zero sign-up.
- ❌ **No backend server** — Entire site is static HTML. No database, no API, no server-side logic.
- ❌ **No data syncing** — Refreshner state is per-browser, per-tab. No cloud sync of intervals or keywords.
- ❌ **No Safari / Edge specific builds** — Chromium-based browsers only for now (Chrome, Edge, Brave, Opera). Firefox is on the roadmap.
- ❌ **No premium / paid tier** — All extensions are and will remain 100% free and open source.
- ❌ **No A/B testing or analytics on the website** — No tracking scripts, no cookies, no fingerprinting.
