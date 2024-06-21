'use strict';

import { RequestToContentScript, RequestType } from './helper';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 're-search',
    title: chrome.i18n.getMessage('menu_title'),
    contexts: ['page'],
    documentUrlPatterns: [
      'https://www.google.com/search*',
      'https://www.google.co.jp/search*',
      'https://scholar.google.com/scholar*',
      'https://search.yahoo.co.jp/search*',
      'https://duckduckgo.com/*',
      'https://www.bing.com/search*',
    ],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId == 're-search') {
    RequestToContentScript(RequestType.FromContextMenu);
  }
});
