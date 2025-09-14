export type MessageType =
  | 'request-current-query'
  | 'request-re-search'
  | 'reply-current-query'
  | 'reply-current-selection';

export type Payload = {
  content: string;
};

export type Message = {
  to: 'popup' | 'contentScript' | 'background';
  type: MessageType;
  payload: Payload | null;
};

export const broadcast = (m: Message) => {
  chrome.runtime.sendMessage(m);
};

export const SearchEnginePattern = [
  'https://www.google.com/search*',
  'https://scholar.google.com/scholar*',
  'https://search.yahoo.co.jp/search*',
  'https://duckduckgo.com/*',
  'https://www.bing.com/search*',
];

export const ParseQuery = (q: string): string[] => {
  const qs: string[] = [];
  const stack: string[] = [];
  q.split(/\s+/)
    .filter((s) => 0 < s.trim().length)
    .forEach((s) => {
      if (s.startsWith('"') || s.startsWith('-"')) {
        if (s.endsWith('"')) {
          qs.push(s);
          return;
        }
        stack.push(s);
        return;
      }
      if (s.endsWith('"')) {
        stack.push(s);
        qs.push(stack.join(' '));
        stack.splice(0);
        return;
      }
      if (0 < stack.length) {
        stack.push(s);
        return;
      }
      qs.push(s);
    });
  if (0 < stack.length) {
    qs.push(stack.join(' '));
  }
  return qs
    .map((s) => s.replace(/^"|"$/g, ''))
    .map((s) => {
      if (s.startsWith('-"')) {
        return '-' + s.substring(2);
      }
      return s;
    });
};

export const ToggleQuote = (s: string): string => {
  if (s.startsWith('"')) {
    return s.replace(/^"|"$/g, '');
  }
  return SmartQuote(s);
};

export const SmartQuote = (s: string): string => {
  if (s.startsWith('-')) {
    return '-"' + s.substring(1) + '"';
  }
  return `"${s}"`;
};

const isYahoo = (u: URL): boolean => {
  return u.hostname === 'search.yahoo.co.jp';
};

const isGoogle = (u: URL): boolean => {
  return u.hostname === 'www.google.com';
};

export const GetQuery = (url: string): string => {
  const u = new URL(url);
  if (isYahoo(u)) {
    return u.searchParams.get('p')?.trim() || '';
  }
  return u.searchParams.get('q')?.trim() || '';
};

export const NewTabUrl = (qs: string[], rawUrl: string): string => {
  if (rawUrl.trim().length < 1) {
    rawUrl = 'https://www.google.com/search';
  }
  const u = new URL(rawUrl);
  if (isYahoo(u)) {
    u.searchParams.set('p', qs.join(' '));
  } else {
    u.searchParams.set('q', qs.join(' '));
  }
  if (isGoogle(u)) {
    u.searchParams.set('nfpr', '1');
  }
  return u.toString();
};
