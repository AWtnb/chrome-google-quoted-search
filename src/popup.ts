'use strict';

import 'chota';
import './popup.css';
import { RequestToContentScript, RequestType, ParseQuery } from './helper';
import { Remover } from './noise';

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

const MANUAL_INPUT = <HTMLInputElement>document.getElementById('manual-input');

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
  if (request.type === RequestType.Alternative && MANUAL_INPUT) {
    const remover = new Remover();
    const s = remover.remove(request.payload);
    MANUAL_INPUT.value = s;
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

const quote = (s: string): string => {
  if (s.startsWith('-')) {
    return '-"' + s.substring(1) + '"';
  }
  return `"${s}"`;
};

const reSearch = () => {
  const qs = getCheckBoxes().map((elem) => {
    const s = elem.value;
    if (elem.checked) {
      return quote(s);
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
  if (!MANUAL_INPUT || MANUAL_INPUT.value.trim().length < 1) {
    return;
  }
  const qs = ParseQuery(MANUAL_INPUT.value).map(quote);
  search(qs);
};

const STRICT_SEARCH = document.getElementById('strict-search');
if (STRICT_SEARCH && MANUAL_INPUT) {
  STRICT_SEARCH.addEventListener('click', strictSearch);
  MANUAL_INPUT.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      STRICT_SEARCH.dispatchEvent(new PointerEvent('click'));
      e.preventDefault();
    }
  });
}
