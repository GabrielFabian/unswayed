const X_METRICS = ["replies", "retweets", "likes", "bookmarks", "views", "followers"];
const YT_METRICS = ["yt_views", "yt_likes", "yt_subscribers", "yt_commentCount", "yt_trending"];
const ALL_METRICS = [...X_METRICS, ...YT_METRICS];

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
};

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
  for (const metric of ALL_METRICS) {
    const checkbox = document.getElementById(metric);
    checkbox.checked = settings[metric];
    checkbox.addEventListener("change", () => {
      chrome.storage.sync.set({ [metric]: checkbox.checked });
    });
  }
});
