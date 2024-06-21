'use strict';

import {
  SendRuntimeMessage,
  MessageTo,
  RequestType,
  NewTabUrl,
  GetQuery,
  ParseQuery,
  SmartQuote,
  ToggleQuote,
} from './helper';

const isSearchEngine = (): boolean => {
  const h = document.location.hostname;
  return (
    (h.startsWith('www.google.') && document.location.pathname === '/search') ||
    h.startsWith('scholar.google.') ||
    h.startsWith('search.yahoo.') ||
    h === 'duckduckgo.com' ||
    h === 'www.bing.com'
  );
};

const newTab = (u: string) => {
  window.open(u, '_blank');
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === RequestType.FromContextMenu) {
    // only requested on search result page
    const u = document.location.href;
    const q = GetQuery(u);
    const qs = ParseQuery(q).map(SmartQuote);
    if (qs.length === 1) {
      newTab(NewTabUrl([ToggleQuote(q)], u));
    } else {
      newTab(NewTabUrl(qs, u));
    }
    return true;
  }
  if (request.type === RequestType.CurrentQuery) {
    if (isSearchEngine()) {
      SendRuntimeMessage(MessageTo.Popup, RequestType.FromSearchEngine, {
        url: document.location.href,
      });
      return true;
    }
    const s = window.getSelection();
    if (!s || s.toString().trim().length < 1) {
      return true;
    }
    SendRuntimeMessage(MessageTo.Popup, RequestType.Alternative, {
      selected: s.toString(),
    });
  }
  return true;
});
