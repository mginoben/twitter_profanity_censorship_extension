// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Loading
  if (message.status == 'loading') {
    // Stop the loading animation by setting the badge text to ''
    chrome.action.setBadgeText({ text: '...', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
  }

  else if (message.counter > 0) {
    chrome.action.setBadgeText({text: message.counter.toString()});
    chrome.action.setBadgeTextColor({ color: '#ffffff' });
    chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
  }

});

// Listen for updates to the active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  
  console.log(tab.status);
  // Check if the tab's URL is in the extension's host permission
  // if (!tab.url.match(/https?:\/\/(www\.)?twitter\.com/)) {
  //   console.log("IM HERE");
  //   // If the URL is not in the host permission, remove the badge text
  //   chrome.action.setBadgeText({ text: '' });
  //   chrome.action.setBadgeBackgroundColor({ color: '#808080' });
  // }
  // else{
  //   console.log("LEAVING")
  // }
});

