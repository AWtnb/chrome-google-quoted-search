export type MessageType =
  | 'request-current-query'
  | 'request-re-search'
  | 'reply-current-query'
  | 'reply-current-selection'
  | 'request-create-tab';

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

export class Token {
  private readonly prefix: string;
  private readonly content: string;
  readonly minus: boolean;
  constructor(s: string) {
    this.minus = s.startsWith('-');
    this.prefix = this.minus ? '-' : '';
    this.content = this.minus ? s.substring(1) : s;
  }
  quote(): string {
    return this.prefix + `"${this.content}"`;
  }
  base(): string {
    return this.prefix + this.content;
  }
}

const splitBySpaces = (text: string): Token[] => {
  return text
    .split(/\s+/)
    .filter((s) => 0 < s.length)
    .map((s) => new Token(s));
};

const unQuote = (quoted: string): string => {
  if (quoted.startsWith('-"') && quoted.endsWith('"')) {
    return '-' + quoted.slice(2, -1);
  }
  if (quoted.startsWith('"') && quoted.endsWith('"')) {
    return quoted.slice(1, -1);
  }
  return quoted;
};

export const parseQuery = (q: string): Token[] => {
  const tokens: Token[] = [];

  const quotedRegex = /-?"[^"]*"/g;
  const quotedMatches: Array<{
    match: string;
    index: number;
    endIndex: number;
  }> = [];

  let m: RegExpExecArray | null;
  while ((m = quotedRegex.exec(q)) !== null) {
    quotedMatches.push({
      match: m[0],
      index: m.index,
      endIndex: m.index + m[0].length,
    });
  }

  let lastIndex = 0;

  for (const quoted of quotedMatches) {
    if (lastIndex < quoted.index) {
      const beforeText = q.substring(lastIndex, quoted.index);
      tokens.push(...splitBySpaces(beforeText));
    }

    const t = new Token(unQuote(quoted.match));
    tokens.push(t);

    lastIndex = quoted.endIndex;
  }

  if (lastIndex < q.length) {
    const afterText = q.substring(lastIndex);
    tokens.push(...splitBySpaces(afterText));
  }

  return tokens;
};

const isYahoo = (u: URL): boolean => {
  return u.hostname === 'search.yahoo.co.jp';
};

const isGoogle = (u: URL): boolean => {
  return u.hostname === 'www.google.com';
};

export const getQuery = (url: string): string => {
  const u = new URL(url);
  if (isYahoo(u)) {
    return u.searchParams.get('p')?.trim() || '';
  }
  return u.searchParams.get('q')?.trim() || '';
};

export const onNewTab = (rawUrl: string, ...tokens: string[]) => {
  if (rawUrl.trim().length < 1) {
    rawUrl = 'https://www.google.com/search';
  }
  const u = new URL(rawUrl);
  const queries = tokens.join(' ');
  if (isYahoo(u)) {
    u.searchParams.set('p', queries);
  } else {
    u.searchParams.set('q', queries);
  }
  if (isGoogle(u)) {
    u.searchParams.set('nfpr', '1');
  }
  broadcast({
    to: 'background',
    type: 'request-create-tab',
    payload: { content: u.toString() },
  });
};
