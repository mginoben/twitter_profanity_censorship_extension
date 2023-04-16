let tweetPredictions = [];



// Listen for messages from the content script
chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

  if (response.status == 'loading') { // LOADING
    // Stop the loading animation by setting the badge text to ''
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });

    let frames = ["-", "\\", "|", "/"];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      chrome.browserAction.setBadgeText({text: frame, tabId: sender.tab.id });
    }

  }

  else if (response.status == 'running') { // SEND COUNTER

    let abusiveCount = 0;

    for (let i = 0; i < tweetPredictions.length; i++) {
      if (tweetPredictions[i]["prediction"] === "Abusive") {
        abusiveCount++;
      }
    }

    if (abusiveCount > 0) {
      chrome.action.setBadgeText({text: abusiveCount.toString(), tabId: sender.tab.id });
      chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
      chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
    }

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
    sendResponse({ result: result});
  }
  
});


// Listen for updates to the active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  console.log("BRUH");
  // tweetPredictions.length = 0;
  
});

