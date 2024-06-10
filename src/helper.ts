export enum RequestType {
  'CurrentQuery' = 'currentquery',
  'Alternative' = 'alternative',
  'FromSearchEngine' = 'fromsearchengine',
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

export const RequestToContentScript = (requestName: string) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab.id) {
      return;
    }
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: requestName,
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
