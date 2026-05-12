chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-localfap",
    title: "Send to LocalFap",
    contexts: ["page", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "send-to-localfap") {
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
          console.log('Successfully sent to LocalFap');
        }
      })
      .catch(err => {
        console.error('Failed to communicate with LocalFap. Is the app open?', err);
      });
    }
  }
});
