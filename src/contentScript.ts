'use strict';

import {
  onNewTab,
  getQuery,
  parseQuery,
  Message,
  broadcast,
  SearchEnginePattern,
} from './helper';

const isSearchEngine = (): boolean => {
  const h = document.location.href;
  return SearchEnginePattern.some((s) => {
    return h.startsWith(s.substring(0, s.length - 1));
  });
};

const newTab = (u: string) => {
  window.open(u, '_blank');
};

chrome.runtime.onMessage.addListener((msg: Message) => {
  if (msg.to !== 'contentScript') {
    return;
  }

  if (msg.type === 'request-current-query') {
    if (isSearchEngine()) {
      broadcast({
        to: 'popup',
        type: 'reply-current-query',
        payload: {
          content: document.location.href,
        },
      });
      return;
    }

    const s = window.getSelection();
    if (!s || s.toString().trim().length < 1) {
      return;
    }

    broadcast({
      to: 'popup',
      type: 'reply-current-selection',
      payload: {
        content: s.toString(),
      },
    });
    return;
  }

  if (msg.type === 'request-re-search') {
    if (!isSearchEngine()) {
      return;
    }
    const u = document.location.href;
    const q = getQuery(u);
    const qs = parseQuery(q).map((token) => token.base());
    onNewTab(u, ...qs);
    return;
  }

  return;
});
