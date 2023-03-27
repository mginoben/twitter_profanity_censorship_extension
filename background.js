chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.censoredCount) {
    // Try to send a response
      try {
          sendResponse({censoredCountResponse: request.censoredCount});
      } catch (error) {
          return;
      }
  }
  else if (request.censoringStatus) {
      // Try to send a response
      try {
        sendResponse({censoringStatusResponse: request.censoringStatus});
      } catch (error) {
          return;
      }
  }
});