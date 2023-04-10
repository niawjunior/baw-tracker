chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "apply") {
    chrome.storage.local.set({
      data: request.value,
    });
  }
});
