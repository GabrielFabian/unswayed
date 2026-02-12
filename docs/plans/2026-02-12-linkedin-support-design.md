# LinkedIn Support Design

## Goal

Extend Unswayed into LinkedIn with the same two-layer architecture used on X and YouTube.

## MVP Signals to Hide (all on by default)

| Signal | What's Hidden | User can still... |
|--------|--------------|-------------------|
| Reactions | Reaction totals on post cards and post detail views | React to posts |
| Comments | Comment count labels on post cards and post detail views | Open and write comments |
| Reposts | Repost/share count labels | Repost/share content |
| Followers / Connections | Follower and connection counts on profile/company surfaces | Follow/connect with people and companies |
| Search social proof | Mutual connections and social proof hints in search results | Open profiles and search normally |

## Architecture

### File Structure

```
extension/
├── manifest.json
├── popup.html
├── popup.js
├── linkedin/
│   ├── content.js
│   └── hide-metrics.css
├── x/
│   ├── content.js
│   └── hide-metrics.css
└── youtube/
    ├── content.js
    └── hide-metrics.css
```

### Two-Layer Hiding

1. Static CSS at `document_start` hides all LinkedIn metrics by default.
2. Dynamic JS reads user preferences and injects `display: revert !important` rules for any metric set to visible.

## Storage Keys

- `li_reactions`
- `li_comments`
- `li_reposts`
- `li_followers`
- `li_searchSocialProof`

## Selector Strategy

Prioritize stable surfaces over brittle generated class names:

- `aria-label` patterns for reaction/comment/repost counts
- `href` patterns for follower/connection links
- Known semantic class hooks as secondary fallbacks (for example `social-details-social-counts__*`)

## Validation Matrix

Test each toggle on:

1. LinkedIn feed (`/feed/`)
2. Single post modal/detail
3. Person profile top card
4. Company page top card

For each page type:

1. Confirm metric is hidden by default on refresh.
2. Confirm metric reappears when toggle is off.
3. Confirm interaction remains intact (react/comment/repost/follow actions still clickable).
4. Confirm no visible flicker during page load.

## Known Risks

- LinkedIn frequently changes markup and class names, so `aria-label` and URL-based selectors are preferred.
- Some counts may appear in locale-dependent wording; this may require i18n-aware selector expansion later.
