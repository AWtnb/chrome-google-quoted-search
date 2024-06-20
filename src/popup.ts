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

const showContent = () => {
  document.getElementById('placeholder')!.style.display = 'none';
  document.getElementById('app')!.style.display = 'inherit';
};

const MANUAL_INPUT = <HTMLInputElement>document.getElementById('manual-input');

const isYahoo = (u: URL): boolean => {
  return u.hostname === 'search.yahoo.co.jp';
};

const isGoogle = (u: URL): boolean => {
  return u.hostname === 'www.google.com';
};

chrome.runtime.onMessage.addListener((request) => {
  if (!request.type || !request.payload) {
    return;
  }
  if (request.type === RequestType.FromSearchEngine) {
    showContent();
    const u = new URL(request.payload.url);
    const oq = ((): string => {
      if (isYahoo(u)) {
        return u.searchParams.get('p') || '';
      }
      return u.searchParams.get('q') || '';
    })();
    ParseQuery(oq).forEach((s: string) => {
      document.getElementById('words')!.append(makeUI(s));
    });
    document.getElementById('execute')!.setAttribute('raw-url', u.toString());
    document.getElementById('execute')!.focus();
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

const search = (qs: string[]) => {
  const ru =
    document.getElementById('execute')!.getAttribute('raw-url') ||
    'https://www.google.com/search';
  const u = new URL(ru);
  if (isYahoo(u)) {
    u.searchParams.set('p', qs.join(' '));
  } else {
    u.searchParams.set('q', qs.join(' '));
  }
  if (isGoogle(u)) {
    u.searchParams.set('nfpr', '1');
  }
  chrome.tabs.create({
    url: u.toString(),
  });
};

const quote = (s: string): string => {
  if (s.startsWith('-')) {
    return '-"' + s.substring(1) + '"';
  }
  return `"${s}"`;
};

document.getElementById('execute')!.addEventListener('click', () => {
  const qs = getCheckBoxes().map((elem) => {
    const s = elem.value;
    if (elem.checked) {
      return quote(s);
    }
    return s;
  });
  search(qs);
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
    const qs = ParseQuery(s).map(quote);
    search(qs);
  });
  MANUAL_INPUT.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      STRICT_SEARCH.dispatchEvent(new PointerEvent('click'));
      e.preventDefault();
    }
  });
}
