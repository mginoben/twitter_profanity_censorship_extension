chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.censoredCount) {
      console.log(request.censoredCount, "From Popup MOFO"); // "Hello from the popup script!"
      sendResponse("Message received by background script.");
    }
});