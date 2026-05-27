chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-saucebox",
    title: "Send to SauceBox",
    contexts: ["page", "link"]
  });
});

const sendToSauceBox = (url) => {
  if (!url) return;
  chrome.storage.local.get(['sauceboxServerUrl'], (result) => {
    const baseUrl = result.sauceboxServerUrl || 'http://127.0.0.1:13337';
    const targetUrl = `${baseUrl}/add-download`;

    fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Successfully sent to SauceBox');
      }
    })
    .catch(err => {
      console.error('Failed to communicate with SauceBox. Is the app open?', err);
    });
  });
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "send-to-saucebox") {
    const url = info.linkUrl || info.pageUrl;
    sendToSauceBox(url);
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url) {
    sendToSauceBox(tab.url);
  }
});
