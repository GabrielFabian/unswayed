const METRICS = ["yt_views", "yt_likes", "yt_subscribers", "yt_commentCount", "yt_trending"];

const DEFAULTS = {
  yt_views: true,
  yt_likes: true,
  yt_subscribers: true,
  yt_commentCount: true,
  yt_trending: true,
};

// CSS rules that re-show a metric (override the static hide-metrics.css defaults)
const SHOW_RULES = {
  yt_views: `
    ytd-watch-info-text yt-formatted-string#info > span:first-child,
    ytd-video-view-count-renderer,
    #metadata-line > span.inline-metadata-item:first-of-type,
    ytd-grid-video-renderer #metadata-line > span:first-child,
    yt-lockup-metadata-view-model .yt-content-metadata-view-model__metadata-row:last-child > .yt-content-metadata-view-model__metadata-text:first-child,
    yt-lockup-metadata-view-model .yt-content-metadata-view-model__delimiter,
    .shortsLockupViewModelHostOutsideMetadataSubhead {
      display: revert !important;
    }
  `,
  yt_likes: `
    like-button-view-model .yt-spec-button-shape-next__button-text-content,
    ytd-comment-engagement-bar #vote-count-middle {
      display: revert !important;
    }
  `,
  yt_subscribers: `
    ytd-video-description-infocards-section-renderer #subtitle,
    yt-page-header-view-model .yt-content-metadata-view-model__metadata-text,
    #upload-info #owner-sub-count,
    #owner #owner-sub-count,
    yt-formatted-string#owner-sub-count {
      display: revert !important;
    }
  `,
  yt_commentCount: `
    ytd-comments-header-renderer #count {
      display: revert !important;
    }
  `,
  yt_trending: `
    ytd-video-primary-info-renderer ytd-badge-supported-renderer,
    ytd-rich-grid-media ytd-badge-supported-renderer.top-badge,
    ytd-grid-video-renderer #video-badges,
    ytd-rich-shelf-renderer #featured-badge,
    ytd-rich-shelf-renderer #paygated-featured-badge,
    ytd-badge-supported-renderer[system-icons] {
      display: revert !important;
    }
  `,
};

function applySettings(settings) {
  for (const metric of METRICS) {
    const id = `ha-show-${metric}`;
    const existing = document.getElementById(id);

    if (settings[metric]) {
      // Metric should be hidden — remove any override (static CSS handles it)
      if (existing) existing.remove();
    } else {
      // Metric should be visible — inject override to counteract static CSS
      if (!existing) {
        const style = document.createElement("style");
        style.id = id;
        style.textContent = SHOW_RULES[metric];
        (document.head || document.documentElement).appendChild(style);
      }
    }
  }
}

// Apply as soon as possible
chrome.storage.sync.get(DEFAULTS, applySettings);

// React to changes from the popup in real time
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  chrome.storage.sync.get(DEFAULTS, applySettings);
});
