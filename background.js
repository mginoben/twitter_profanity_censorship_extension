let tweetPredictions = [];

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

  if (response.status == 'loading') { // LOADING
    // Stop the loading animation by setting the badge text to ''
    chrome.action.setBadgeText({ text: '...', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
  }

  else if (response.status == 'running') { // SEND COUNTER
    if (abusiveTweets.length > 0) {
      chrome.action.setBadgeText({text: tweetPredictions.length.toString(), tabId: sender.tab.id });
    } else {
      chrome.action.setBadgeText({text: "", tabId: sender.tab.id });
    }
    chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
    chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
  }
  
  else if (response.action == "push") { // ADD ABUSIVE TWEET
    const data = response.data;
    tweetPredictions.push(data);
    console.log(data);  
  }

  else if (response.action == "get") { // GET ALL TWEETS (ABUSIVE/UNCENSORED)
    const tweets = tweetPredictions.map(obj => obj.tweet);
    sendResponse({ tweets: tweets });
  }

  else if (response.action == "compare") { // COMPARE CURRENT TWEET TO LIST
    const result = tweetPredictions.find(obj => obj.tweet === response.tweet);
    sendResponse({ prediction: result.prediction});
  }

  else if (response.action == "toggle") { // COMPARE CURRENT TWEET TO LIST
    for (let i = 0; i < tweetPredictions.length; i++) {
      console.log("wewe");
      if (tweetPredictions[i].tweet == response.tweet) {

        if (tweetPredictions[i].toggle) {
          tweetPredictions[i]["toggle"] = false;
        } else {
          tweetPredictions[i]["toggle"] = true;
        }
      }

    }

  }
  
});


// Listen for updates to the active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  // abusiveTweets.length = 0;
  // uncensoredTweets.length = 0;
  
});

