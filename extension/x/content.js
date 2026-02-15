const METRICS = ["replies", "retweets", "likes", "bookmarks", "views", "followers"];

const DEFAULTS = {
  replies: true,
  retweets: true,
  likes: true,
  bookmarks: true,
  views: true,
  followers: true,
};

// CSS rules that re-show a metric (override the static hide-metrics.css defaults)
const SHOW_RULES = {
  replies: `
    [data-testid="reply"] span:not(:has(svg)),
    [data-testid="tweetDetail"] [data-testid="reply"] span:not(:has(svg)) {
      display: revert !important;
    }
  `,
  retweets: `
    [data-testid="retweet"] span:not(:has(svg)),
    [data-testid="unretweet"] span:not(:has(svg)),
    [data-testid="tweetDetail"] [data-testid="retweet"] span:not(:has(svg)),
    [data-testid="tweetDetail"] [data-testid="unretweet"] span:not(:has(svg)) {
      display: revert !important;
    }
  `,
  likes: `
    [data-testid="like"] span:not(:has(svg)),
    [data-testid="unlike"] span:not(:has(svg)),
    [data-testid="tweetDetail"] [data-testid="like"] span:not(:has(svg)),
    [data-testid="tweetDetail"] [data-testid="unlike"] span:not(:has(svg)) {
      display: revert !important;
    }
  `,
  bookmarks: `
    [data-testid="bookmark"] span:not(:has(svg)),
    [data-testid="removeBookmark"] span:not(:has(svg)),
    a[aria-label*="Bookmark"] span:not(:has(svg)),
    a[aria-label*="bookmark"] span:not(:has(svg)),
    [data-testid="tweetDetail"] [data-testid="bookmark"] span:not(:has(svg)),
    [data-testid="tweetDetail"] [data-testid="removeBookmark"] span:not(:has(svg)) {
      display: revert !important;
    }
  `,
  views: `
    a[href$="/analytics"] span:not(:has(svg)),
    a[aria-label*="views"] span:not(:has(svg)),
    a[aria-label*="View post analytics"] span:not(:has(svg)),
    [data-testid="tweetDetail"] a[href$="/analytics"] span:not(:has(svg)) {
      display: revert !important;
    }
  `,
  followers: `
    a[href$="/following"] span,
    a[href$="/followers"] span,
    a[href$="/verified_followers"] span {
      display: revert !important;
    }
    [data-testid="UserCell"] a[href$="/followers_you_follow"],
    a[href$="/followers_you_follow"] {
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "unswayed:get-site") return;
  sendResponse({ site: "x" });
});
