let tweetPredictions = [];
let abusiveCount = 0;
let totalCount = 0;

let feedTweetPredictions = [];
let feedTotalCount = 0;
let feedAbusiveCount = 0;

let censoredCount;
let censoredRatio;

function computeCensoredRatio(listOfTweet) {
  let abusiveCount = 0;
  
  listOfTweet.forEach(tweet => {
    if (tweet.prediction === "Abusive") {
      abusiveCount++;
    }
  });

  const ratio = (abusiveCount / listOfTweet.length) * 100;

  if (isNaN(Math.round(ratio))) {
    return 0;
  }
  
  return Math.round(ratio);
}

function findTweet(listOfTweet, newTweet) {
  return listOfTweet.some(obj => obj.tweet === newTweet.tweet && obj.username === newTweet.username);
}

function countAbusive(listOfTweet) {
  let count =0;
  
  listOfTweet.forEach(tweet => {
    if (tweet.prediction === "Abusive") {
      count ++;
    }
  });

  return count;
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

  if (response.popup === "update") {
    sendResponse({ 
      censoredCount: countAbusive(tweetPredictions), 
      censoredRatio: computeCensoredRatio(tweetPredictions),
      feedCensoredCount: countAbusive(feedTweetPredictions),
      feedCensoredRatio: computeCensoredRatio(feedTweetPredictions)
    });
  }

  if (response.status === "loading") {
    modelStatus = "loading";
    chrome.action.setBadgeText({text: "load", tabId: sender.tab.id });
    chrome.action.setBadgeTextColor({ color: 'white', tabId: sender.tab.id  });
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
  }

  if (response.status === "running") {

    modelStatus = "running";

    if (abusiveCount > 0) {
      // updatePopup();
      chrome.action.setBadgeText({text: abusiveCount.toString(), tabId: sender.tab.id });
      chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
      chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
    }
    
  }
  
  if (response.action === "push") {
    
    const tweet = response.tweet;

    if (!findTweet(tweetPredictions, tweet)) {
      tweetPredictions.push(tweet);
    }

  }
  else if (response.action == "get") {

    const tweets = tweetPredictions.map(obj => obj.tweet);
    sendResponse({ tweets: tweets });

  }
  else if (response.action === "compare") {

    for (let i = 0; i < tweetPredictions.length; i++) {
      const tweet = tweetPredictions[i];
      if (tweet.tweet === response.tweet && tweet.username === response.username) {
        sendResponse({ result: tweet});

        if (!findTweet(feedTweetPredictions, tweet)) {
          feedTweetPredictions.push(tweet);
        }

        break;
      }

    } 

  }

});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  console.log(changeInfo.title, changeInfo.status);
 
    if (changeInfo.title == "Twitter") {
      feedTweetPredictions.length = 0;
      // Send a message to the content script
      chrome.tabs.sendMessage(tabId, { tabUpdated: true }, function(response) {
        console.log(response);
      });

    }
  
});


