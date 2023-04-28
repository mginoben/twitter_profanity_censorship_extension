let tweetPredictions = [];
let feedTweetPredictions = [];
let reportedTweets = [];
let toggleState = false;
let tweetCount;
let censoredRatio;
let censoredCount;
let feedTweetCount;
let feedCensoredCount;
let feedCensoredRatio;




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
  
  return Math.round(ratio).toString();
}

function findTweet(listOfTweet, tweet) {

  for (let i = 0; i < listOfTweet.length; i++) {
    const tweetObj = listOfTweet[i];
    if (tweetObj.tweet === tweet) {
      return tweetObj;
    }
  }

}

function countAbusive(listOfTweet) {
  let count = 0;
  
  listOfTweet.forEach(tweet => {
    if (tweet.prediction == "Abusive") {
      count ++;
    }
  });

  return count;
}

function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    if (tab && tab.url.match('https:\/\/twitter.com\/.*')) {
      chrome.tabs.sendMessage(tab.id, message);
    }
  });
}

chrome.action.setIcon({ path: "images/uncensored-128x128.png" });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.toggle === true) {
    toggleState = true;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var tabId = tabs[0].id;
      chrome.tabs.reload(tabId);
    });
    chrome.action.setIcon({ path: "images/censored-128x128.png" });
  }
  else if (message.toggle === false) {
    console.log("OFF BB");
    toggleState = false;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var tabId = tabs[0].id;
      chrome.tabs.reload(tabId);
    });    
    chrome.action.setIcon({ path: "images/uncensored-128x128.png" });
  }else if (message.toggle === "get") {
    sendResponse({ toggleState: toggleState });
  }

  if (message.popup === "update") {
    if (toggleState == true) {
      sendResponse({ 
        tweetCount: tweetPredictions.length,
        censoredCount: countAbusive(tweetPredictions), 
        censoredRatio: computeCensoredRatio(tweetPredictions),
        feedTweetCount: feedTweetPredictions.length,
        feedCensoredCount: countAbusive(feedTweetPredictions),
        feedCensoredRatio: computeCensoredRatio(feedTweetPredictions),
        toggleState: toggleState
      });
    }
    else{
      sendResponse({ 
        tweetCount: 0,
        censoredCount: 0, 
        censoredRatio: 0,
        feedTweetCount: 0,
        feedCensoredCount: 0,
        feedCensoredRatio: 0,
        toggleState: toggleState
      });
    }
  }

  if (message.action == "save_tweet") {

    if (!findTweet(tweetPredictions, message.tweet)) {
      tweetPredictions.push({tweet: message.tweet, prediction: message.prediction});
      console.log("Saved tweet:", message.tweet, "\nPrediction:", message.prediction);
    
      if (countAbusive(tweetPredictions) > 0) {
        chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
        chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
        chrome.action.setBadgeText({text: countAbusive(tweetPredictions).toString(), tabId: sender.tab.id });
      }
      else {
        chrome.action.setBadgeText({text: "", tabId: sender.tab.id });
      }
    }

    if (!findTweet(feedTweetPredictions, message.tweet)) {
      feedTweetPredictions.push({tweet: message.tweet, prediction: message.prediction});
    }
    
  }

  if (message.action === "save_feed_tweet") {
    if (!findTweet(feedTweetPredictions, message.tweet)) {
      feedTweetPredictions.push({tweet: message.tweet, prediction: message.prediction});
    }
  }

  if (message.action === "get_tweets") {
    console.log("Getting tweets ... no. of tweets:", tweetPredictions.length);
    sendResponse({ tweetPredictions: tweetPredictions });
  }

  if (message.action === "get_reported") {
    sendResponse({ reportedTweets: reportedTweets });
  }

  if (message.action === "report") {
    console.log("Reported:", message.tweet);
    reportedTweets.push(message.tweet);
  }

  if (message.status === "loading") {
    chrome.action.setBadgeText({text: "load", tabId: sender.tab.id });
    chrome.action.setBadgeTextColor({ color: 'white', tabId: sender.tab.id  });
    chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
    chrome.action.setPopup({popup: ""});
  }

  if (message.status === "running") {

    // Set popup
    chrome.action.setPopup({popup: "popup.html"});

    // Set badge behaviour
    if (countAbusive(tweetPredictions) > 0) {
      chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
      chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
      chrome.action.setBadgeText({text: countAbusive(tweetPredictions).toString(), tabId: sender.tab.id });
    }
    else {
      chrome.action.setBadgeText({text: "", tabId: sender.tab.id });
    }
    
  }

});


chrome.tabs.onActivated.addListener(function(activeInfo) {

  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url.includes("https://twitter.com/")) {

      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["style.css"]
      });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });

      chrome.action.setPopup({popup: "popup.html"});
    }
    else {
      chrome.action.setPopup({popup: ""});
    }
  });
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status == "complete" && tab.url.includes("https://twitter.com/")) {
      
      if (toggleState === true) {

        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["style.css"]
        });

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });

      }

      // Convert list to JSON string
      let tweetsList = JSON.stringify(tweetPredictions);

      // Store JSON string on local storage
      chrome.storage.local.set({tweetPredictions: tweetsList}, function() {
        console.log("List saved to local storage.");
      });

      chrome.action.setPopup({popup: "popup.html"});
   
      feedTweetPredictions.length = 0;

    }

});



