const liveChatSelector = '.chat-room .chat-scrollable-area__message-container';
const vodChatSelector = '.video-chat .video-chat__message-list-wrapper ul';

const badgesSelector = '.chat-badge';
const displayNameSelector = '.chat-author__display-name';

const liveChatLineSelector = '.chat-line__no-background';
const liveMessageProperty = 'chat-line-message-body';
const vodMessageSelector = '.video-chat__message';

const vodTimestampSelector = '.vod-message__header p';
const textFragmentClass = 'text-fragment';
const emoteSelector = 'img.chat-line__message--emote';

const isVod = window.location.pathname.includes('/videos/');

function currentTime(): string {
  const date = new Date();
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function nodeIsElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function elementIsAnchor(element: Element): element is HTMLAnchorElement {
  return element.tagName === 'A';
}

function getVodMesssageBody(message: Element): Element | undefined {
  const body = message.querySelector(vodMessageSelector);
  return body?.children[1];
}

function getLiveMessageBody(message: Element): HTMLElement | undefined {
  const chatLine = message.querySelector(liveChatLineSelector);
  if (chatLine == null) return;
  for (let i = 0; i < chatLine.children.length; i++) {
    const child = chatLine.children[i] as HTMLElement;
    if (child.dataset.testSelector === liveMessageProperty) {
      return child;
    }
  }
}

function parseMessageFragment(fragment: Element): Ytc.ParsedRun | undefined {
  if (fragment.classList.contains(textFragmentClass)) {
    return {
      type: 'text',
      text: fragment.textContent ?? ''
    };
  } else if (elementIsAnchor(fragment)) {
    return {
      type: 'link',
      text: fragment.textContent ?? fragment.href,
      url: fragment.href
    };
  }

  const emote = fragment.querySelector<HTMLImageElement>(emoteSelector);
  if (emote == null) return;
  return {
    type: 'emoji',
    src: emote.src,
    alt: emote.alt
  };
}

function processMessages(message: Element): void {
  const author = message.querySelector(displayNameSelector)?.textContent;
  const timestamp = isVod ? message.querySelector(vodTimestampSelector)?.textContent : currentTime();

  const messageBody = isVod ? getVodMesssageBody(message) : getLiveMessageBody(message);
  if (messageBody == null) return;
  // console.debug({ messageBody });
  const messageArray: Ytc.ParsedRun[] = [];
  Array.from(messageBody.children).forEach((fragment) => {
    // console.debug({ fragment });
    const result = parseMessageFragment(fragment);
    if (result != null) messageArray.push(result);
  });
  console.debug({ author, timestamp, messageArray });
}

function chatMutationCallback(records: MutationRecord[]): void {
  records.forEach((record) => {
    const added = record.addedNodes;
    if (added.length < 1) return;
    added.forEach((node) => {
      if (!nodeIsElement(node)) return;
      processMessages(node);
    });
  });
}

let tries = 0;

function load(): void {
  const messageContainer = document?.querySelector(isVod ? vodChatSelector : liveChatSelector);
  // console.debug({ messageContainer });
  if (messageContainer == null) {
    if (tries++ < 5) {
      setTimeout(load, 3000);
    } else {
      console.error('Could not find chat container');
    }
    return;
  }

  const observer = new MutationObserver(chatMutationCallback);
  observer.observe(messageContainer, { childList: true });
}

load();
export {};
