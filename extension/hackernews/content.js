const METRICS = ["hn_points", "hn_commentCounts", "hn_time"];

const DEFAULTS = {
  hn_points: true,
  hn_commentCounts: true,
  hn_time: true,
  // Legacy key kept for backwards compatibility with older installs.
  hn_userSignals: true,
};

const SHOW_RULES = {
  hn_points: `
    span.score {
      display: revert !important;
    }
  `,
  hn_commentCounts: ``,
  hn_time: `
    span.age {
      display: revert !important;
    }
  `,
};

const COMMENT_COUNT_RE = /^(?:\d+\s+comments?|discuss)$/i;
const COMMENT_TEXT_ATTR = "data-ha-hn-comment-original-text";

function applyCommentCountTextFilter(shouldHide) {
  document.querySelectorAll('td.subtext a[href^="item?id="]').forEach((link) => {
    const text = (link.textContent || "").trim();
    const hasOriginal = link.hasAttribute(COMMENT_TEXT_ATTR);

    if (!shouldHide) {
      if (hasOriginal) {
        link.textContent = link.getAttribute(COMMENT_TEXT_ATTR) || text;
        link.removeAttribute(COMMENT_TEXT_ATTR);
      }
      return;
    }

    if (COMMENT_COUNT_RE.test(text)) {
      if (!hasOriginal) link.setAttribute(COMMENT_TEXT_ATTR, text);
      link.textContent = "comments";
    }
  });
}

function applySettings(settings) {
  const normalizedSettings = {
    ...settings,
    hn_time: typeof settings.hn_time === "boolean" ? settings.hn_time : settings.hn_userSignals,
  };

  for (const metric of METRICS) {
    const id = `ha-show-${metric}`;
    const existing = document.getElementById(id);

    if (normalizedSettings[metric]) {
      if (existing) existing.remove();
    } else if (!existing) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = SHOW_RULES[metric];
      (document.head || document.documentElement).appendChild(style);
    }
  }

  applyCommentCountTextFilter(normalizedSettings.hn_commentCounts);
}

function applyNowAndAfterLoad(settings) {
  applySettings(settings);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applySettings(settings), { once: true });
  }
}

chrome.storage.sync.get(DEFAULTS, applyNowAndAfterLoad);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  chrome.storage.sync.get(DEFAULTS, applyNowAndAfterLoad);
});
