const METRICS = ["replies", "retweets", "likes", "bookmarks", "views", "followers"];

const DEFAULTS = {
  replies: true,
  retweets: true,
  likes: true,
  bookmarks: true,
  views: true,
  followers: true,
};

// Load saved settings into the toggles
chrome.storage.sync.get(DEFAULTS, (settings) => {
  for (const metric of METRICS) {
    const checkbox = document.getElementById(metric);
    checkbox.checked = settings[metric];
    checkbox.addEventListener("change", () => {
      chrome.storage.sync.set({ [metric]: checkbox.checked });
    });
  }
});
