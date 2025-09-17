'use strict';

import {
  onNewTab,
  getQuery,
  parseQuery,
  Message,
  broadcast,
  isSearchEngine,
} from './helper';

chrome.runtime.onMessage.addListener((msg: Message) => {
  if (msg.to !== 'contentScript') {
    return;
  }

  if (msg.type === 'request-current-query') {
    const sel = window.getSelection();
    if (sel) {
      const s = sel.toString().trim();
      if (0 < s.length) {
        broadcast({
          to: 'popup',
          type: 'reply-current-selection',
          payload: {
            content: s,
          },
        });
        return;
      }
    }

    if (isSearchEngine(document.location.href)) {
      broadcast({
        to: 'popup',
        type: 'reply-current-query',
        payload: {
          content: document.location.href,
        },
      });
      return;
    }

    return;
  }

  if (msg.type === 'request-re-search') {
    if (!isSearchEngine(document.location.href)) {
      return;
    }
    const u = document.location.href;
    const q = getQuery(u);
    const qs = parseQuery(q);
    if (qs.every((q) => q.quoted)) {
      onNewTab(u, ...qs.map((q) => q.base()));
    } else {
      onNewTab(u, ...qs.map((q) => q.quote()));
    }
    return;
  }

  return;
});
