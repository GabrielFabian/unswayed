# YouTube Support Design

## Goal

Extend High Agency X into a multi-site extension ("High Agency") that hides social signals on YouTube, using the same architecture as the existing X support.

## Signals to Hide (all on by default)

| Signal | What's Hidden | User can still... |
|--------|--------------|-------------------|
| View counts | "1.2M views" on thumbnails and watch pages | Watch any video |
| Like counts | Number next to thumbs up | Like/dislike videos |
| Subscriber counts | "12.4M subscribers" on channels | Subscribe to channels |
| Comment counts | "4,523 Comments" header | Read and write comments |
| Trending badges | "#1 on Trending", popularity indicators | Browse trending page |

## Architecture

### File Structure

```
extension/
├── manifest.json              (add YouTube matches, rename extension)
├── popup.html                 (tabbed UI: X / YouTube)
├── popup.js                   (handle both sites' settings)
├── x/
│   ├── content.js             (existing X logic, moved)
│   └── hide-metrics.css       (existing X CSS, moved)
├── youtube/
│   ├── content.js             (YouTube dynamic overrides)
│   └── hide-metrics.css       (YouTube static hiding CSS)
├── icon48.png
└── icon128.png
```

### Two-Layer Hiding (same as X)

1. **Static CSS** (`hide-metrics.css`): injected at `document_start`, hides all metrics with `display: none !important`
2. **Dynamic JS** (`content.js`): reads user prefs from `chrome.storage.sync`, injects `display: revert !important` overrides for metrics the user wants shown

### YouTube Selectors

YouTube uses custom web components (`yt-formatted-string`, `ytd-*`) rather than `data-testid`. Key targets:

- **View counts**: `#info-strings .view-count`, `#metadata-line` view text spans
- **Like counts**: `like-button-view-model .yt-core-attributed-string`, `#segmented-like-button` count
- **Subscriber counts**: `#owner-sub-count`, `#subscriber-count`
- **Comment counts**: `#count` inside `ytd-comments-header-renderer`
- **Trending badges**: `ytd-badge-supported-renderer` with trending content

Note: YouTube's DOM is less stable than X's. Selectors may need iteration.

### Popup UI

Tabbed interface switching between X and YouTube toggle groups:

- Active tab uses site brand color (X: `#1d9bf0`, YouTube: `#ff0000`)
- Both sites' settings always in storage regardless of active tab

### Storage Keys

Namespaced to avoid collisions and maintain backward compatibility:

- X: `replies`, `retweets`, `likes`, `bookmarks`, `views`, `followers` (unchanged)
- YouTube: `yt_views`, `yt_likes`, `yt_subscribers`, `yt_commentCount`, `yt_trending`

## Renaming

- Extension name: "High Agency X" → "High Agency"
- Subtitle per tab: "Hide metrics on X" / "Hide metrics on YouTube"

## Implementation Steps

1. Restructure: move existing X files into `x/` subdirectory
2. Update `manifest.json`: rename, add YouTube content scripts and matches
3. Create `youtube/hide-metrics.css` with static hiding rules
4. Create `youtube/content.js` with dynamic override logic
5. Redesign `popup.html` with tabbed UI
6. Update `popup.js` to handle both sites' settings
7. Test on YouTube: verify all 5 signals hide/show correctly
