let tweetPredictions = [];
let modelStatus = "running";


// Listen for messages from the content script
chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

  if (response.censoredCount) {
    console.log(response.censoredCount, "From Popup MOFO"); // "Hello from the popup script!"
    sendResponse("Message received by background script.");
  }

  if (response.status) {

    if (response.status === "loading") {
      chrome.action.setBadgeText({text: "load", tabId: sender.tab.id });
      chrome.action.setBadgeTextColor({ color: 'white', tabId: sender.tab.id  });
      chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
      modelStatus = "loading";
    }
    else if (response.status === "running") {
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
      modelStatus = "running";
    }
    else if (response.status === "get") {
      sendResponse({ status: modelStatus });
    }
    
  }
  else if (response.action) {

    if (response.action === "push") {
      
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
        document.getElementById('censoredCount').textContent = "AS";
      }

    }
    else if (response.action == "get") {

      const tweets = tweetPredictions.map(obj => obj.tweet);
      sendResponse({ tweets: tweets });

    }
    else if (response.action === "compare") {

      for (let i = 0; i < tweetPredictions.length; i++) {

        if (tweetPredictions[i].tweet === response.tweet && tweetPredictions[i].username === response.username) {
          sendResponse({ result: tweetPredictions[i]});
          break;
        }

      } 

    }

  }
  
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

    if (changeInfo.title) {
      // Send a message to the content script
      chrome.tabs.sendMessage(tabId, { message: "TabUpdated" }, function(response) {
        console.log(response);
      });
    }
  
});


