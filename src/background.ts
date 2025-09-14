'use strict';

import { Message, SearchEnginePattern } from './helper';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 're-search',
    title: chrome.i18n.getMessage('menu_title'),
    contexts: ['page'],
    documentUrlPatterns: SearchEnginePattern,
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId == 're-search') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab.id) {
        return;
      }
      const m: Message = {
        to: 'contentScript',
        type: 'request-re-search',
        payload: null,
      };
      chrome.tabs.sendMessage(tab.id, m);
    });
  }
});
