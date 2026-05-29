function sendToTab(tabId, msg, sendResponse) {
  chrome.tabs.sendMessage(tabId, msg, (resp) => {
    if (chrome.runtime.lastError) {
      // Content script not ready — tab needs a refresh
      sendResponse({ ok: false, error: 'Refresh the Instagram tab and try again' });
      return;
    }
    sendResponse(resp);
  });
}

function forwardToInstagramTab(msg, sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab?.url?.startsWith('https://www.instagram.com')) {
      sendToTab(tab.id, msg, sendResponse);
    } else {
      // Open a new Instagram tab, wait for content script to load, then send
      chrome.tabs.create({ url: 'https://www.instagram.com/' }, (newTab) => {
        const listener = (tabId, info) => {
          if (tabId !== newTab.id || info.status !== 'complete') return;
          chrome.tabs.onUpdated.removeListener(listener);
          // Small delay — content script needs a moment after page complete
          setTimeout(() => sendToTab(newTab.id, msg, sendResponse), 500);
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
    }
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'POPUP_FETCH_PROFILE') {
    forwardToInstagramTab({ type: 'FETCH_PROFILE', username: msg.username }, sendResponse);
    return true;
  }
  if (msg.type === 'POPUP_BLOCK_USERNAME') {
    forwardToInstagramTab({ type: 'BLOCK_USERNAME', username: msg.username }, sendResponse);
    return true;
  }
});
