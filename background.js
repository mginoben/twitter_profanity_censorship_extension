let tweetPredictions = [];

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

  if (response.status == 'loading') { // LOADING
    // Stop the loading animation by setting the badge text to ''
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });

    let frames = ["-", "\\", "|", "/"];
    let currentFrame = 0;
    let intervalId = setInterval(() => {
      chrome.browserAction.setBadgeText({text: frames[currentFrame], tabId: sender.tab.id });
      currentFrame = (currentFrame + 1) % frames.length;
    }, 1000);
  }

  else if (response.status == 'running') { // SEND COUNTER
    chrome.action.setBadgeText({text: tweetPredictions.length.toString(), tabId: sender.tab.id });
    chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
    chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
  }
  
  else if (response.action == "push") { // ADD ABUSIVE TWEET

    if (tweetPredictions.length > 0) {
      chrome.action.setBadgeText({text: tweetPredictions.length.toString(), tabId: sender.tab.id });
      chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
      chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
    }

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

  else if (response.action == "toggle") { // COMPARE CURRENT TWEET TO LIST
    for (let i = 0; i < tweetPredictions.length; i++) {
      
      if (tweetPredictions[i].tweet == response.tweet) {
        console.log(tweetPredictions[i].tweet, response.tweet);

        if (tweetPredictions[i].toggle) {
          tweetPredictions[i].toggle = false;
          break;
        } else {
          tweetPredictions[i].toggle = true;
          break;
        }
        
      }

    }

  }
  
});


// Listen for updates to the active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  console.log("BRUH");
  // tweetPredictions.length = 0;
  
});

