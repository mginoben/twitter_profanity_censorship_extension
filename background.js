chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.text) {
      console.log(request.text);
    }
  });
  