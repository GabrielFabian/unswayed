# Unswayed

George Mack writes that basing your opinion off the opinion of others is a low-agency trap. We agree.

Unswayed is a Chrome extension that hides social metrics — likes, views, retweets, subscriber counts — across platforms like X, YouTube, and Hacker News. The idea is simple: decide for yourself whether something is good, before the crowd tells you what to think.

You can still like, comment, subscribe, and share. You just won't see the numbers.

## What it hides

**X (Twitter)**
- Replies, retweets, likes, bookmarks, and view counts on posts
- Follower/following counts on profiles

**YouTube**
- View counts on videos, feeds, sidebar recommendations, and Shorts
- Like and comment counts (including on Shorts)
- Subscriber counts on channels
- Trending badges and popularity indicators
- Remix counts on Shorts

**Hacker News**
- Story points
- Story comment counts / discuss counts
- Time/age stamps (separate toggle)
- Keeps upvote arrows visible and clickable
- Keeps comment links visible and clickable (only the count text is hidden)

Everything is togglable. Click the extension icon to open the side panel and use:
- **Turn Off All Social Signals** (global bulk toggle across all supported sites)
- **Turn Off All on X / YouTube / HN** (per-site bulk toggles)
- Individual metric toggles for fine-grained control

Changes take effect immediately. Metrics are hidden by default.

## Installation

### From the Chrome Web Store

[Install Unswayed](https://chrome.google.com/webstore/detail/unswayed/TODO) — click "Add to Chrome" and you're done.

### From source (for developers)

1. Clone the repo: `git clone https://github.com/GabrielFabian/unswayed.git`
2. Open `chrome://extensions` in your browser
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the `extension/` folder
5. Make your changes — the extension reloads when you refresh the extensions page

Pull requests are welcome. The codebase is intentionally simple: just CSS and vanilla JS, no build step.

## How it works

Each supported site has its own folder under `extension/` with two files:

- **`hide-metrics.css`** — Injected at `document_start`, before the page renders. Hides all metrics with `display: none !important` so you never see numbers flash before disappearing.
- **`content.js`** — Reads your preferences from `chrome.storage.sync` and injects `display: revert !important` overrides for any metrics you've chosen to show.

The side panel UI (`popup.html` + `popup.js`) has:
- A global master switch (`Turn Off All Social Signals`)
- A tab for each platform
- A per-platform master switch (`Turn Off All on ...`)
- Per-metric switches for fine-grained overrides

The side panel writes toggle state to storage and content scripts react in real time.

### Hacker News behavior notes

- The extension hides social counts but preserves core actions.
- "Comment counts" changes labels like `123 comments` or `discuss` to `comments`, while keeping the link active.
- "Timing" only affects age/time stamps.

```
extension/
├── manifest.json
├── background.js
├── popup.html / popup.js
├── x/
│   ├── content.js
│   └── hide-metrics.css
├── hackernews/
│   ├── content.js
│   └── hide-metrics.css
└── youtube/
    ├── content.js
    └── hide-metrics.css
```

Want to add a new platform? Create a new folder, write the CSS selectors, copy the `content.js` pattern, and add the content script entry to `manifest.json`.
