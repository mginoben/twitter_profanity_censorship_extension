let tweetPredictions = [];
let feedTweetPredictions = [];
let previousUrl = '';
let tweetsTab;
let notTweetTabs = ["messages", "twitter_blue", "verified-orgs-signup", "notifications", "bookmarks", "lists"];

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

function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    if (tab) {
      chrome.tabs.sendMessage(tab.id, message);
    }
  });
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

  if (response.popup === "update") {
    sendResponse({ 
      censoredCount: countAbusive(tweetPredictions), 
      censoredRatio: computeCensoredRatio(tweetPredictions),
      feedCensoredCount: countAbusive(feedTweetPredictions),
      feedCensoredRatio: computeCensoredRatio(feedTweetPredictions),
      tweetCount: tweetPredictions.length,
      feedTweetCount: feedTweetPredictions.length
    });
  }

  if (response.status === "loading") {
    chrome.action.setBadgeText({text: "load", tabId: sender.tab.id });
    chrome.action.setBadgeTextColor({ color: 'white', tabId: sender.tab.id  });
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
  }

  if (response.status === "running") {
    chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
    chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });

    if (countAbusive(tweetPredictions) > 0) {
      chrome.action.setBadgeText({text: countAbusive(tweetPredictions).toString(), tabId: sender.tab.id });
    }
    else {
      chrome.action.setBadgeText({text: "", tabId: sender.tab.id });
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

chrome.tabs.onActivated.addListener(function(activeInfo) {
  // This will log the ID of the newly activated tab
  console.log(activeInfo.tabId);
  // You can also use chrome.tabs.get to get the details of the newly activated tab
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    console.log(tab.url);
    if (tab.url.includes("https://twitter.com/")) {
      chrome.action.setPopup({popup: "popup.html"});
    }
    else {
      chrome.action.setPopup({popup: ""});
    }
  });
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  if (changeInfo && changeInfo.status === "complete") {

    if (tab.url !== previousUrl && tab.url.includes("https://twitter.com/")) {

      tweetsTab = true;

      chrome.action.setPopup({popup: "popup.html"});
   
      console.log(tab.url);
      previousUrl = tab.url;
      feedTweetPredictions.length = 0;
      // Send a message to the content script

      if (!tab.url.includes("search")) {
        notTweetTabs.forEach(urlString => {
          if (tab.url.includes(urlString)){
            tweetsTab = false;
          }
        });
      }

      if (tweetsTab) {
        sendMessage({ activeTab: true,  tabUrl: tab.url});
      }

    }
    else {
      chrome.action.setPopup({popup: ""});
      sendMessage({ activeTab: false });
    }
  }



});



