function forwardToInstagramTab(msg, sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab?.url?.startsWith('https://www.instagram.com')) {
      chrome.tabs.sendMessage(tab.id, msg, sendResponse);
    } else {
      chrome.tabs.create({ url: 'https://www.instagram.com/' }, (newTab) => {
        const listener = (tabId, info) => {
          if (tabId !== newTab.id || info.status !== 'complete') return;
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(newTab.id, msg, sendResponse);
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
