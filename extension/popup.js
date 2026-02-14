const X_METRICS = ["replies", "retweets", "likes", "bookmarks", "views", "followers"];
const YT_METRICS = ["yt_views", "yt_likes", "yt_subscribers", "yt_commentCount", "yt_trending"];
const HN_METRICS = ["hn_points", "hn_commentCounts", "hn_time"];
const ALL_METRICS = [...X_METRICS, ...YT_METRICS, ...HN_METRICS];
const SITE_METRICS = {
  x: X_METRICS,
  youtube: YT_METRICS,
  hackernews: HN_METRICS,
};
const SITE_TOGGLE_IDS = {
  x: "all_x",
  youtube: "all_youtube",
  hackernews: "all_hackernews",
};
const GLOBAL_TOGGLE_ID = "all_social_signals";

const DEFAULTS = {
  replies: true,
  retweets: true,
  likes: true,
  bookmarks: true,
  views: true,
  followers: true,
  yt_views: true,
  yt_likes: true,
  yt_subscribers: true,
  yt_commentCount: true,
  yt_trending: true,
  hn_points: true,
  hn_commentCounts: true,
  hn_time: true,
};

function setBulkToggleState(checkbox, allEnabled, anyEnabled) {
  checkbox.checked = allEnabled;
  checkbox.indeterminate = anyEnabled && !allEnabled;
}

function syncBulkToggles(settings) {
  const globalToggle = document.getElementById(GLOBAL_TOGGLE_ID);
  const globalAllEnabled = ALL_METRICS.every((metric) => settings[metric]);
  const globalAnyEnabled = ALL_METRICS.some((metric) => settings[metric]);
  setBulkToggleState(globalToggle, globalAllEnabled, globalAnyEnabled);

  for (const [site, metrics] of Object.entries(SITE_METRICS)) {
    const toggle = document.getElementById(SITE_TOGGLE_IDS[site]);
    const siteAllEnabled = metrics.every((metric) => settings[metric]);
    const siteAnyEnabled = metrics.some((metric) => settings[metric]);
    setBulkToggleState(toggle, siteAllEnabled, siteAnyEnabled);
  }
}

// Tab switching
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
  });
});

// Load saved settings into the toggles
chrome.storage.sync.get(DEFAULTS, (settings) => {
  const localSettings = { ...DEFAULTS, ...settings };

  function setMetrics(metrics, shouldHide) {
    const updates = {};

    for (const metric of metrics) {
      localSettings[metric] = shouldHide;
      updates[metric] = shouldHide;

      const metricToggle = document.getElementById(metric);
      if (metricToggle) metricToggle.checked = shouldHide;
    }

    chrome.storage.sync.set(updates);
    syncBulkToggles(localSettings);
  }

  for (const metric of ALL_METRICS) {
    const checkbox = document.getElementById(metric);
    checkbox.checked = localSettings[metric];
    checkbox.addEventListener("change", () => {
      localSettings[metric] = checkbox.checked;
      chrome.storage.sync.set({ [metric]: checkbox.checked });
      syncBulkToggles(localSettings);
    });
  }

  document.getElementById(GLOBAL_TOGGLE_ID).addEventListener("change", (event) => {
    setMetrics(ALL_METRICS, event.target.checked);
  });

  for (const [site, toggleId] of Object.entries(SITE_TOGGLE_IDS)) {
    document.getElementById(toggleId).addEventListener("change", (event) => {
      setMetrics(SITE_METRICS[site], event.target.checked);
    });
  }

  syncBulkToggles(localSettings);
});
