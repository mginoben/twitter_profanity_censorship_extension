let tweetPredictions = [];
let modelStatus = "running";
let abusiveCount = 0;
let totalCount = 0;

let censoredCount;
let censoredRatio;

function computeCensoredRatio() {

  const ratio = (abusiveCount / totalCount) * 100;

  if (isNaN(Math.round(ratio))) {
    return 0;
  }
  
  return Math.round(ratio);
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {
  if (response.popup === "update") {
    sendResponse({ abusiveCount: abusiveCount, abusiveRatio: computeCensoredRatio()});
  }

  if (response.status === "loading") {
    modelStatus = "loading";
    chrome.action.setBadgeText({text: "load", tabId: sender.tab.id });
    chrome.action.setBadgeTextColor({ color: 'white', tabId: sender.tab.id  });
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
  }
  else if (response.status === "running") {

    modelStatus = "running";

    if (abusiveCount > 0) {
      // updatePopup();
      chrome.action.setBadgeText({text: abusiveCount.toString(), tabId: sender.tab.id });
      chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
      chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
    }
    
  }
  else if (response.status === "get") {
    sendResponse({ status: modelStatus });
  }
  
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
      if (data.prediction == "Abusive") {
        abusiveCount++;
      }
      tweetPredictions.push(data);
      totalCount++;
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

  
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  console.log(changeInfo.title, changeInfo.status);
 
    if (changeInfo.title == "Twitter") {
      
      // Send a message to the content script
      chrome.tabs.sendMessage(tabId, { tabUpdated: true }, function(response) {
        console.log(response);
      });

    }
  
});


