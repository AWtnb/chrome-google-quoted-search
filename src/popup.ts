'use strict';

import 'chota';
import './popup.css';
import {
  RequestToContentScript,
  RequestType,
  ParseQuery,
  SmartQuote,
  GetQuery,
  NewTabUrl,
  ToggleQuote,
} from './helper';
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

const showContent = () => {
  document.getElementById('placeholder')!.style.display = 'none';
  document.getElementById('app')!.style.display = 'inherit';
};

const MANUAL_INPUT = <HTMLInputElement>document.getElementById('manual-input');
const EXECUTE_BUTTON = document.getElementById('execute');

chrome.runtime.onMessage.addListener((request) => {
  if (!request.type || !request.payload) {
    return;
  }
  if (request.type === RequestType.FromSearchEngine) {
    const u = request.payload.url;
    const q = GetQuery(u);
    const qs = ParseQuery(q);
    if (qs.length === 1) {
      createTab(NewTabUrl([ToggleQuote(q)], u));
      return;
    }
    showContent();
    qs.forEach((s: string) => {
      document.getElementById('words')!.append(makeUI(s));
    });
    EXECUTE_BUTTON!.setAttribute('raw-url', u);
    EXECUTE_BUTTON!.focus();
    return;
  }
  if (request.type === RequestType.Alternative && MANUAL_INPUT) {
    const remover = new Remover();
    const s = remover.remove(request.payload.selected);
    MANUAL_INPUT.value = s;
    return;
  }
});

const getCheckBoxes = (): HTMLInputElement[] => {
  return Array.from(document.getElementsByTagName('input')).filter(
    (elem) => elem.type === 'checkbox'
  );
};

const createTab = (u: string) => {
  chrome.tabs.create({
    url: u,
  });
};

EXECUTE_BUTTON!.addEventListener('click', (e) => {
  const qs = getCheckBoxes().map((elem) => {
    const s = elem.value;
    if (elem.checked) {
      return SmartQuote(s);
    }
    return s;
  });
  const u = EXECUTE_BUTTON!.getAttribute('raw-url') || '';
  createTab(NewTabUrl(qs, u));
});

document.getElementById('clear')!.addEventListener('click', () => {
  getCheckBoxes().forEach((elem) => {
    elem.checked = false;
  });
});

const STRICT_SEARCH = document.getElementById('strict-search');
if (STRICT_SEARCH && MANUAL_INPUT) {
  STRICT_SEARCH.addEventListener('click', () => {
    const s = MANUAL_INPUT.value;
    if (s.trim().length < 1) {
      return;
    }
    const qs = ParseQuery(s).map(SmartQuote);
    const u = EXECUTE_BUTTON!.getAttribute('raw-url') || '';
    createTab(NewTabUrl(qs, u));
  });
  MANUAL_INPUT.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      STRICT_SEARCH.dispatchEvent(new PointerEvent('click'));
      e.preventDefault();
    }
  });
}
