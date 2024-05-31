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
    SendRuntimeMessage(MessageTo.Popup, request.type, getCurrentQuery());
  }
  return true;
});
