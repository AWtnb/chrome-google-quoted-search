'use strict';

import { SendRuntimeMessage, MessageTo, RequestType } from './helper';

const isSearchEngine = (): boolean => {
  const h = document.location.hostname;
  return (
    (h === 'www.google.com' && document.location.pathname === '/search') ||
    h === 'duckduckgo.com' ||
    h === 'www.bing.com' ||
    h === 'search.yahoo.co.jp'
  );
};

chrome.runtime.onMessage.addListener((request) => {
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
