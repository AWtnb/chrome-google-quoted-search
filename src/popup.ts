'use strict';

import './popup.css';
import 'chota';
import { RequestToContentScript, RequestType, ParseQuery } from './helper';

RequestToContentScript(RequestType.CurrentQuery);

const makeUI = (label: string): HTMLElement => {
  const d = document.createElement('div');
  d.className = 'word-container';
  const l = document.createElement('label');
  l.innerText = label;
  const c = document.createElement('input');
  c.type = 'checkbox';
  c.className = 'cbox';
  c.value = label;
  c.checked = true;
  l.insertAdjacentElement('afterbegin', c);
  d.append(l);
  return d;
};

const hidePlaceholder = () => {
  document.getElementById('placeholder')!.style.display = 'none';
};

const showContent = () => {
  hidePlaceholder();
  document.getElementById('app')!.style.display = 'inherit';
};

chrome.runtime.onMessage.addListener((request) => {
  if (!request.type || !request.payload) {
    return;
  }
  if (request.type === RequestType.CurrentQuery) {
    showContent();
    ParseQuery(request.payload).forEach((s: string) => {
      document.getElementById('words')!.append(makeUI(s));
    });
    document.getElementById('execute')!.focus();
    return;
  }
  if (request.type === RequestType.Alternative) {
    const elem = <HTMLInputElement>document.getElementById('manual-input');
    elem!.value = request.payload;
  }
});

const getCheckBoxes = (): HTMLInputElement[] => {
  return Array.from(document.getElementsByTagName('input')).filter(
    (elem) => elem.type === 'checkbox'
  );
};

const search = (qs: string[]) => {
  const q = encodeURIComponent(qs.join(' '));
  const to = 'http://www.google.com/search?nfpr=1&q=' + q;
  window.open(to, '_blank');
};

const reSearch = () => {
  const qs = getCheckBoxes().map((elem) => {
    const s = elem.value;
    if (elem.checked) {
      return `"${s}"`;
    }
    return s;
  });
  search(qs);
};

document.getElementById('execute')!.addEventListener('click', reSearch);

const clear = () => {
  getCheckBoxes().forEach((elem) => {
    elem.checked = false;
  });
};
document.getElementById('clear')!.addEventListener('click', clear);

const strictSearch = () => {
  const elem = <HTMLInputElement>document.getElementById('manual-input');
  if (elem!.value.trim().length < 1) {
    return;
  }
  const qs = ParseQuery(elem!.value).map((q) => `"${q}"`);
  search(qs);
};
document
  .getElementById('strict-search')!
  .addEventListener('click', strictSearch);

document.getElementById('manual-input')!.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document
      .getElementById('strict-search')!
      .dispatchEvent(new PointerEvent('click'));
    e.preventDefault();
  }
});
