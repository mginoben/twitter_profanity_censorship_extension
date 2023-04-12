var abusiveTweets = [];
var uncensoredTweets = [];
var toggle = "on";

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

  if (response.status == 'loading') { // LOADING
    // Stop the loading animation by setting the badge text to ''
    chrome.action.setBadgeText({ text: '...', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
  }
  else if (response.status == 'running') { // SEND COUNTER
    if (abusiveTweets.length > 0) {
      chrome.action.setBadgeText({text: abusiveTweets.length.toString(), tabId: sender.tab.id });
    } else {
      chrome.action.setBadgeText({text: "", tabId: sender.tab.id });
    }
    chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
    chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
  }
  else if (response.action == "append") { // ADD ABUSIVE TWEET
    const data = response.data;
  
    abusiveTweets.push(data);
    console.log("CENSORED:", abusiveTweets);
    
  }
  else if (response.action == "getTweets") { // GET ALL TWEETS (ABUSIVE/UNCENSORED)
    sendResponse({abusiveContents: abusiveTweets, uncensoredContents: uncensoredTweets});
  }
  else if (response.uncensor == "append") { // ADD UNCENSORED TWEET

    const data = response.data;
    let inArray = false;

    for(var i = 0; i < uncensoredTweets.length; i++) {
      if (uncensoredTweets[i].content == data.content && uncensoredTweets[i].author == data.author) { 
        inArray = true;
        break;
      }
    }
    
    if (!inArray) {
      uncensoredTweets.push(data);
      console.log("UNCENSORED:", data.content);
    }

  }
  else if (response.uncensor == "remove") { // REMOVE UNCENSORED TWEET
    const data = response.data;
    for(var i = 0; i < uncensoredTweets.length; i++) {
      if (uncensoredTweets[i].content == data.content && uncensoredTweets[i].author == data.author) { 
          console.log("RECENSORED:", data.content);
          uncensoredTweets.splice(i, 1);
          break;
      }
    }
  }
  else if (response.toggle) { // TOGGLE
    if (response.toggle == "get") { 
      sendResponse({toggleStatus: toggle});
    }
    else {
      toggle = response.toggle;
      console.log("IM", toggle);
      // Reload the current tab
      chrome.tabs.reload();
    }
  }
});


// Listen for updates to the active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  // abusiveTweets.length = 0;
  // uncensoredTweets.length = 0;
  
});

