'use strict';

import { SendRuntimeMessage, MessageTo, RequestType } from './helper';

const getCurrentQuery = (): string => {
  const sbox = document.getElementsByName('q');
  if (sbox.length < 1) {
    return '';
  }
  return (<HTMLInputElement>sbox[0]).value;
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === RequestType.CurrentQuery) {
    if (document.location.host.startsWith('www.google.')) {
      SendRuntimeMessage(MessageTo.Popup, request.type, getCurrentQuery());
      return true;
    }
    const s = window.getSelection();
    if (!s || s.toString().trim().length < 1) {
      return true;
    }
    SendRuntimeMessage(MessageTo.Popup, RequestType.Alternative, s.toString());
  }
  return true;
});
