let tweetPredictions = [];
let feedTweetPredictions = [];
let reportedTweets = [];
let toggleState = false;


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


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.toggle === true) {
    console.log("ON BB");
    toggleState = true;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var tabId = tabs[0].id;
      chrome.tabs.reload(tabId);
    });
    
  }
  else if (message.toggle === false) {
    console.log("OFF BB");
    toggleState = false;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var tabId = tabs[0].id;
      chrome.tabs.reload(tabId);
    });    
  }else if (message.toggle === "get") {
    sendResponse({ toggleState: toggleState });
  }

  if (message.popup === "update") {
    sendResponse({ 
      censoredCount: countAbusive(tweetPredictions), 
      censoredRatio: computeCensoredRatio(tweetPredictions),
      feedCensoredCount: countAbusive(feedTweetPredictions),
      feedCensoredRatio: computeCensoredRatio(feedTweetPredictions),
      tweetCount: tweetPredictions.length,
      feedTweetCount: feedTweetPredictions.length,
      toggleState: toggleState
    });

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
    // chrome.action.setPopup({popup: "popup.html"});

    // Set badge behaviour
    // if (countAbusive(tweetPredictions) > 0) {
    //   chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
    //   chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });
    //   chrome.action.setBadgeText({text: countAbusive(tweetPredictions).toString(), tabId: sender.tab.id });
    // }
    // else {
    //   chrome.action.setBadgeText({text: "", tabId: sender.tab.id });
    // }
    
    
  }

});


chrome.tabs.onActivated.addListener(function(activeInfo) {
  // This will log the ID of the newly activated tab
  // You can also use chrome.tabs.get to get the details of the newly activated tab
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url.includes("https://twitter.com/")) {

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
      
      if (toggleState) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
  
        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["style.css"]
        });

        sendMessage({ tab: "updated"});
      }
      else{
        tweetPredictions.length = 0;
      }
      

      chrome.action.setPopup({popup: "popup.html"});
   
      feedTweetPredictions.length = 0;

      

    }

});



