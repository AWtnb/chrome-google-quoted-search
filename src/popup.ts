'use strict';

import 'chota';
import './popup.css';
import {
  parseQuery,
  getQuery,
  onNewTab,
  Message,
  Token,
  isSearchEngine,
} from './helper';
import { Remover } from './noise';

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab.id) {
    return;
  }
  const u = tab.url;
  if (!u || !u.startsWith('http')) {
    return;
  }
  const m: Message = {
    to: 'contentScript',
    type: 'request-current-query',
    payload: null,
  };
  chrome.tabs.sendMessage(tab.id, m);
});

const makeUI = (token: Token): HTMLElement => {
  const label = token.content;
  const d = document.createElement('div');
  d.className = 'word-container';
  if (token.minus) {
    d.classList.add('minused');
  }
  const l = document.createElement('label');
  l.innerText = label;
  const c = document.createElement('input');
  c.type = 'checkbox';
  c.className = 'cbox';
  c.value = token.base();
  c.checked = true;
  l.insertAdjacentElement('afterbegin', c);
  d.append(l);
  return d;
};

const showContent = () => {
  document.getElementById('placeholder')!.style.display = 'none';
  document.getElementById('app')!.style.display = 'inherit';
};

chrome.runtime.onMessage.addListener((msg: Message) => {
  if (msg.to !== 'popup' || !msg.payload) {
    return;
  }

  if (msg.type === 'reply-current-query') {
    const u = msg.payload.content;
    const q = getQuery(u);
    const tokens = parseQuery(q);
    if (tokens.length === 1) {
      const t = tokens[0];
      onNewTab(u, t.toggle());
      return;
    }
    showContent();
    tokens.forEach((t: Token) => {
      document.getElementById('words')!.append(makeUI(t));
    });
    const button = document.getElementById('execute')!;
    button.setAttribute('raw-url', u);
    button.focus();
    return;
  }

  if (msg.type === 'reply-current-selection') {
    const remover = new Remover();
    const s = remover.remove(msg.payload.content);
    (document.getElementById('manual-input') as HTMLInputElement)!.value = s;
    return;
  }
});

const getCheckBoxes = (): HTMLInputElement[] => {
  return Array.from(document.getElementsByTagName('input')).filter(
    (elem) => elem.type === 'checkbox'
  );
};

const searchWithQuotedWords = () => {
  const qs = getCheckBoxes().map((elem) => {
    const s = elem.value;
    if (elem.checked) {
      const t = new Token(s);
      return t.quote();
    }
    return s;
  });
  const u = document.getElementById('execute')!.getAttribute('raw-url') || '';
  onNewTab(u, ...qs);
};

document
  .getElementById('execute')!
  .addEventListener('click', searchWithQuotedWords);

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (document.getElementById('app')!.style.display === 'none') {
    return;
  }
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    searchWithQuotedWords();
  }
});

document.getElementById('clear')!.addEventListener('click', () => {
  getCheckBoxes().forEach((elem) => {
    elem.checked = false;
  });
});

const searchWithManualInputWords = () => {
  const s = (document.getElementById('manual-input') as HTMLInputElement)!
    .value;
  if (s.trim().length < 1) {
    return;
  }
  const qs = parseQuery(s).map((token) => token.quote());
  const u = document.getElementById('execute')!.getAttribute('raw-url') || '';
  onNewTab(u, ...qs);
};

document
  .getElementById('strict-search')!
  .addEventListener('click', searchWithManualInputWords);

document.getElementById('manual-input')!.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchWithManualInputWords();
  }
});
