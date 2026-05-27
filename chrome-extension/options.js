document.addEventListener('DOMContentLoaded', () => {
  const serverUrlInput = document.getElementById('serverUrl');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load existing settings
  chrome.storage.local.get(['sauceboxServerUrl'], (result) => {
    if (result.sauceboxServerUrl) {
      serverUrlInput.value = result.sauceboxServerUrl;
    } else {
      serverUrlInput.value = 'http://127.0.0.1:13337';
    }
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    let url = serverUrlInput.value.trim();
    
    // Ensure it doesn't end with a slash or specific path so we can cleanly append /add-download
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    if (url.endsWith('/add-download')) {
      url = url.replace('/add-download', '');
    }

    chrome.storage.local.set({ sauceboxServerUrl: url }, () => {
      statusDiv.textContent = 'Settings saved successfully!';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    });
  });
});
