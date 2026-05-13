chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-saucebox",
    title: "Send to SauceBox",
    contexts: ["page", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "send-to-saucebox") {
    const url = info.linkUrl || info.pageUrl;
    if (url) {
      fetch('http://127.0.0.1:13337/add-download', {
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
    }
  }
});
