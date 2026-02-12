const METRICS = ["li_reactions", "li_comments", "li_reposts", "li_followers", "li_searchSocialProof"];

const DEFAULTS = {
  li_reactions: true,
  li_comments: true,
  li_reposts: true,
  li_followers: true,
  li_searchSocialProof: true,
};

// CSS rules that re-show a metric (override the static hide-metrics.css defaults)
const SHOW_RULES = {
  li_reactions: `
    button[aria-label*=" reaction" i] span:not(:has(svg)),
    button[aria-label*=" reactions" i] span:not(:has(svg)),
    a[aria-label*=" reaction" i] span:not(:has(svg)),
    a[aria-label*=" reactions" i] span:not(:has(svg)),
    button[data-reaction-details],
    li.social-details-social-counts__reactions,
    img.reactions-icon,
    .social-details-social-counts__reactions-count,
    .social-details-social-counts__reactions-count span:not(:has(svg)),
    .social-details-social-counts__social-proof-text,
    .social-details-social-counts__social-proof-text span:not(:has(svg)),
    .social-details-social-counts__social-proof-fallback-number,
    [class*="social-details-social-counts__social-proof"],
    [class*="social-details-social-counts__social-proof"] span:not(:has(svg)),
    [id*="consumption-ring" i],
    svg[id*="consumption-ring" i],
    li:has(> svg[id*="consumption-ring" i]),
    [data-view-name*="likes_count"] {
      display: revert !important;
    }
  `,
  li_comments: `
    button[aria-label*=" comment" i] span:not(:has(svg)),
    button[aria-label*=" comments" i] span:not(:has(svg)),
    a[aria-label*=" comment" i] span:not(:has(svg)),
    a[aria-label*=" comments" i] span:not(:has(svg)),
    .social-details-social-counts__comments,
    .social-details-social-counts__comments span:not(:has(svg)),
    [data-view-name*="comments_count"] {
      display: revert !important;
    }
  `,
  li_reposts: `
    button[aria-label*=" repost" i] span:not(:has(svg)),
    button[aria-label*=" reposts" i] span:not(:has(svg)),
    a[aria-label*=" repost" i] span:not(:has(svg)),
    a[aria-label*=" reposts" i] span:not(:has(svg)),
    .social-details-social-counts__social-activity,
    .social-details-social-counts__social-activity span:not(:has(svg)),
    [data-view-name*="reshare_count"] {
      display: revert !important;
    }
  `,
  li_followers: `
    a[href*="/followers/"] span:not(:has(svg)),
    a[href*="/connections/"] span:not(:has(svg)),
    a[href*="/followers/"] strong,
    a[href*="/connections/"] strong {
      display: revert !important;
    }
  `,
  li_searchSocialProof: `
    [data-view-name="search-result-social-proof-insight"],
    p:has([data-view-name="search-result-social-proof-insight"]),
    [data-view-name="people-search-result"] div:has(> p > [data-view-name="search-result-social-proof-insight"]) {
      display: revert !important;
    }
  `,
};

const FOLLOWER_TEXT_RE = /\b\d[\d.,]*\s*(?:[kmb]|thousand|million|billion)?\s+followers?\b/i;
const ENGAGEMENT_WORD_RE = /\b\d[\d.,]*\s*(?:[kmb]|thousand|million|billion)?\s+(?:likes?|reactions?|comments?|reposts?)\b/i;
const BARE_COUNT_RE = /^\d[\d.,]*(?:\s*[kmb])?$/i;
const FOLLOWER_HIDDEN_ATTR = "data-ha-li-followers-hidden";
const FOLLOWER_PREV_STYLE_ATTR = "data-ha-li-followers-prev-style";
const ENGAGEMENT_HIDDEN_ATTR = "data-ha-li-engagement-hidden";
const ENGAGEMENT_PREV_STYLE_ATTR = "data-ha-li-engagement-prev-style";
let currentSettings = { ...DEFAULTS };
let followerPassQueued = false;
let followerObserverStarted = false;

function hideElementWithRestore(el) {
  if (el.hasAttribute(FOLLOWER_HIDDEN_ATTR)) return;
  el.setAttribute(FOLLOWER_HIDDEN_ATTR, "1");
  el.setAttribute(FOLLOWER_PREV_STYLE_ATTR, el.getAttribute("style") || "");
  el.style.setProperty("display", "none", "important");
}

function restoreFollowerElements() {
  document.querySelectorAll(`[${FOLLOWER_HIDDEN_ATTR}="1"]`).forEach((el) => {
    const prevStyle = el.getAttribute(FOLLOWER_PREV_STYLE_ATTR) || "";
    if (prevStyle) {
      el.setAttribute("style", prevStyle);
    } else {
      el.removeAttribute("style");
    }
    el.removeAttribute(FOLLOWER_HIDDEN_ATTR);
    el.removeAttribute(FOLLOWER_PREV_STYLE_ATTR);
  });
}

function hideEngagementElementWithRestore(el) {
  if (el.hasAttribute(ENGAGEMENT_HIDDEN_ATTR)) return;
  el.setAttribute(ENGAGEMENT_HIDDEN_ATTR, "1");
  el.setAttribute(ENGAGEMENT_PREV_STYLE_ATTR, el.getAttribute("style") || "");
  el.style.setProperty("display", "none", "important");
}

function restoreEngagementElements() {
  document.querySelectorAll(`[${ENGAGEMENT_HIDDEN_ATTR}="1"]`).forEach((el) => {
    const prevStyle = el.getAttribute(ENGAGEMENT_PREV_STYLE_ATTR) || "";
    if (prevStyle) {
      el.setAttribute("style", prevStyle);
    } else {
      el.removeAttribute("style");
    }
    el.removeAttribute(ENGAGEMENT_HIDDEN_ATTR);
    el.removeAttribute(ENGAGEMENT_PREV_STYLE_ATTR);
  });
}

function closestCompactRow(el) {
  let node = el.closest("div");
  let fallback = el;
  while (node && node !== document.body) {
    const text = (node.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) break;
    if (text.length <= 72 && FOLLOWER_TEXT_RE.test(text)) {
      fallback = node;
      node = node.parentElement ? node.parentElement.closest("div") : null;
      continue;
    }
    break;
  }
  return fallback;
}

function hideFollowerTextRows() {
  if (!currentSettings.li_followers) {
    restoreFollowerElements();
    return;
  }

  document.querySelectorAll("p, span, strong").forEach((el) => {
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!text || text.length > 72 || !FOLLOWER_TEXT_RE.test(text)) return;
    hideElementWithRestore(closestCompactRow(el));
  });
}

function countActionButtons(root) {
  if (!root || root.nodeType !== Node.ELEMENT_NODE) return 0;
  const selectors = [
    'button[aria-label*="like" i]',
    'button[aria-label*="comment" i]',
    'button[aria-label*="repost" i]',
    'button[aria-label*="send" i]',
    'a[aria-label*="like" i]',
    'a[aria-label*="comment" i]',
    'a[aria-label*="repost" i]',
    'a[aria-label*="send" i]',
  ];
  return root.querySelectorAll(selectors.join(",")).length;
}

function hasNearbySocialActionBar(el) {
  let node = el;
  for (let i = 0; i < 6 && node && node !== document.body; i += 1) {
    if (countActionButtons(node) >= 2) return true;
    node = node.parentElement;
  }
  return false;
}

function hasReactionIconStrip(el) {
  let node = el;
  for (let i = 0; i < 6 && node && node !== document.body; i += 1) {
    const strip = node.querySelector('ul[role="presentation"]');
    if (strip && strip.querySelector('svg[id*="consumption" i], svg')) return true;
    node = node.parentElement;
  }
  return false;
}

function hideEngagementTextRows() {
  restoreEngagementElements();

  const hideReactions = !!currentSettings.li_reactions;
  const hideComments = !!currentSettings.li_comments;
  const hideReposts = !!currentSettings.li_reposts;
  if (!hideReactions && !hideComments && !hideReposts) return;

  document.querySelectorAll("p, span, strong, a").forEach((el) => {
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!text || text.length > 96) return;

    const isReactionsWord = /\b\d[\d.,]*\s*(?:[kmb]|thousand|million|billion)?\s+(?:likes?|reactions?)\b/i.test(text);
    const isCommentsWord = /\b\d[\d.,]*\s*(?:[kmb]|thousand|million|billion)?\s+comments?\b/i.test(text);
    const isRepostsWord = /\b\d[\d.,]*\s*(?:[kmb]|thousand|million|billion)?\s+reposts?\b/i.test(text);
    const isWordMetric = ENGAGEMENT_WORD_RE.test(text);

    if (isWordMetric) {
      if ((hideReactions && isReactionsWord) || (hideComments && isCommentsWord) || (hideReposts && isRepostsWord)) {
        const row = closestCompactRow(el);
        hideEngagementElementWithRestore(row);

        // LinkedIn often renders a duplicate bare number as aria-hidden fallback text.
        const parentP = el.closest("p");
        if (parentP) {
          parentP.querySelectorAll('span[aria-hidden="true"]').forEach((ghostCount) => {
            hideEngagementElementWithRestore(ghostCount);
          });
        }
      }
      return;
    }

    // Some LinkedIn variants show bare reaction counts (e.g. "75") next to reaction icons.
    if (hideReactions && BARE_COUNT_RE.test(text) && text.length <= 8 && (hasNearbySocialActionBar(el) || hasReactionIconStrip(el))) {
      const row = closestCompactRow(el);
      if (row.querySelector("img, svg")) {
        hideEngagementElementWithRestore(row);
      }
    }
  });
}

function queueFollowerPass() {
  if (followerPassQueued) return;
  followerPassQueued = true;
  requestAnimationFrame(() => {
    followerPassQueued = false;
    hideFollowerTextRows();
    hideEngagementTextRows();
  });
}

function ensureFollowerObserver() {
  if (followerObserverStarted) return;
  followerObserverStarted = true;
  const observer = new MutationObserver(() => {
    queueFollowerPass();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function applySettings(settings) {
  currentSettings = { ...DEFAULTS, ...settings };
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
  queueFollowerPass();
  ensureFollowerObserver();
}

// Apply as soon as possible
chrome.storage.sync.get(DEFAULTS, applySettings);

// React to changes from the popup in real time
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  chrome.storage.sync.get(DEFAULTS, applySettings);
});
