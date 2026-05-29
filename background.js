/* global browser */
const _chrome = typeof browser !== 'undefined' ? browser : chrome; // Firefox / Chrome compat

function sendToTab(tabId, msg, sendResponse) {
  _chrome.tabs.sendMessage(tabId, msg, (resp) => {
    if (_chrome.runtime.lastError) {
      sendResponse({ ok: false, error: 'Refresh the Instagram tab and try again' });
      return;
    }
    sendResponse(resp);
  });
}

function forwardToInstagramTab(msg, sendResponse) {
  _chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab?.url?.startsWith('https://www.instagram.com')) {
      sendToTab(tab.id, msg, sendResponse);
    } else {
      _chrome.tabs.create({ url: 'https://www.instagram.com/' }, (newTab) => {
        const listener = (tabId, info) => {
          if (tabId !== newTab.id || info.status !== 'complete') return;
          _chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(() => sendToTab(newTab.id, msg, sendResponse), 500);
        };
        _chrome.tabs.onUpdated.addListener(listener);
      });
    }
  });
}

_chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'POPUP_FETCH_PROFILE') {
    forwardToInstagramTab({ type: 'FETCH_PROFILE', username: msg.username }, sendResponse);
    return true;
  }
  if (msg.type === 'POPUP_BLOCK_USERNAME') {
    forwardToInstagramTab({ type: 'BLOCK_USERNAME', username: msg.username }, sendResponse);
    return true;
  }
});
