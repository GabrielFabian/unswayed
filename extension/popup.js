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
const SITE_STATUS_IDS = {
  x: "status_all_x",
  youtube: "status_all_youtube",
  hackernews: "status_all_hackernews",
};
const GLOBAL_TOGGLE_ID = "all_social_signals";
const GLOBAL_STATUS_ID = "status_all_social_signals";
const GLOBAL_STATUS_COPY = {
  hidden: "Hidden across all supported sites.",
  visible: "Not all supported signals are hidden.",
};
const SITE_STATUS_COPY = {
  x: {
    hidden: "Hidden on X.",
    visible: "Not all X signals are hidden.",
  },
  youtube: {
    hidden: "Hidden on YouTube.",
    visible: "Not all YouTube signals are hidden.",
  },
  hackernews: {
    hidden: "Hidden on Hacker News.",
    visible: "Not all Hacker News signals are hidden.",
  },
};

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

function setBulkToggleState(checkbox, allEnabled) {
  checkbox.checked = allEnabled;
  checkbox.indeterminate = false;
}

function setAggregateStatusText(statusId, statusCopy, allEnabled) {
  const statusElement = document.getElementById(statusId);
  if (!statusElement) return;

  if (allEnabled) {
    statusElement.textContent = statusCopy.hidden;
  } else {
    statusElement.textContent = statusCopy.visible;
  }
}

function syncBulkToggles(settings) {
  const globalToggle = document.getElementById(GLOBAL_TOGGLE_ID);
  const globalAllEnabled = ALL_METRICS.every((metric) => settings[metric]);
  setBulkToggleState(globalToggle, globalAllEnabled);
  setAggregateStatusText(GLOBAL_STATUS_ID, GLOBAL_STATUS_COPY, globalAllEnabled);

  for (const [site, metrics] of Object.entries(SITE_METRICS)) {
    const toggle = document.getElementById(SITE_TOGGLE_IDS[site]);
    const siteAllEnabled = metrics.every((metric) => settings[metric]);
    setBulkToggleState(toggle, siteAllEnabled);
    setAggregateStatusText(SITE_STATUS_IDS[site], SITE_STATUS_COPY[site], siteAllEnabled);
  }
}

function activateTab(tabKey) {
  const tab = document.querySelector(`.tab[data-tab="${tabKey}"]`);
  const panel = document.getElementById(`panel-${tabKey}`);
  if (!tab || !panel) return;

  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  tab.classList.add("active");
  panel.classList.add("active");
}

function focusCurrentSiteTab() {
  if (!chrome.tabs?.query || !chrome.tabs?.sendMessage) return;

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const activeTab = tabs?.[0];
    if (!activeTab?.id) return;

    chrome.tabs.sendMessage(activeTab.id, { type: "unswayed:get-site" }, (response) => {
      if (chrome.runtime.lastError) return;
      const site = response?.site;
      if (!SITE_METRICS[site]) return;
      activateTab(site);
    });
  });
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});
focusCurrentSiteTab();

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
