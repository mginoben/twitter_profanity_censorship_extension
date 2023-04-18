let tweetPredictions = [];



// Listen for messages from the content script
chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

  if (response.status == 'loading') { // LOADING
    // Stop the loading animation by setting the badge text to ''
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });

    let countdown = response.estimatedTime; // Set the initial value of the countdown timer

    // Set the badge text to the initial value of the countdown timer
    chrome.browserAction.setBadgeText({text: countdown.toString()});

    // Use setInterval() to update the badge text every second
    let countdownInterval = setInterval(function() {
      countdown--;
      if (countdown === 0) {
        clearInterval(countdownInterval);
        if (abusiveCount > 0) {
          chrome.action.setBadgeText({text: abusiveCount.toString(), tabId: sender.tab.id });
          chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
          chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
        }
        else {
          chrome.action.setBadgeText({text: "", tabId: sender.tab.id });
        }
      } else {
        chrome.browserAction.setBadgeText({text: countdown.toString()});
      }
    }, 1000);

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
    let foundTweet = false;

    for (let i = 0; i < tweetPredictions.length; i++) {
      if (tweetPredictions[i]["tweet"] === data.tweet) {
        foundTweet = true;
        break;
      }
    }

    if (!foundTweet) {
      tweetPredictions.push(data);
      console.log(data);  
    }

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
  // Only send message when the tab has finished loading
  if (changeInfo.status === 'loading') {
    // Send message to the content script
    chrome.tabs.sendMessage(tabId, { message: 'TabUpdated' }, response => {
      console.log(response);
    });
  }
});

