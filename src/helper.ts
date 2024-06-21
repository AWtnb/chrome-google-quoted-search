export enum RequestType {
  'CurrentQuery' = 'currentquery',
  'Alternative' = 'alternative',
  'FromSearchEngine' = 'fromsearchengine',
  'FromContextMenu' = 'fromcontextmenu',
}

export enum MessageTo {
  'Popup' = 'popup',
  'Content' = 'content',
  'Background' = 'background',
}

export const SendRuntimeMessage = (
  to: MessageTo,
  type: string,
  payload: object
) => {
  chrome.runtime.sendMessage(
    {
      to: to,
      type: type,
      payload: payload,
    },
    () => {
      if (chrome.runtime.lastError) {
        console.log('something happened: ', chrome.runtime.lastError.message);
      }
    }
  );
};

export const RequestToContentScript = (
  requestName: string,
  payload: object = {}
) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab.id) {
      return;
    }
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: requestName,
        payload: payload,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.log('something happened: ', chrome.runtime.lastError.message);
        }
      }
    );
  });
};

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
    return s.replace(/^"|"$/g, "")
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
