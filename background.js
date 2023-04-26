let tweetPredictions = [];
let feedTweetPredictions = [];
let reportedTweets = [];
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
    if (tweet.prediction === "Abusive") {
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

function hasTweets(url) {
  if (!url.includes("search")) {
    for (let i = 0; i < notTweetTabs.length; i++) {
      const urlString = notTweetTabs[i];
      if (url.includes(urlString)){
        return false;
      }
    }
  }
  return true;
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action == "save_tweet") {
    if (message.tweet) {
      if (!findTweet(tweetPredictions, message.tweet)) {
        tweetPredictions.push({tweet: message.tweet, prediction: message.prediction});
        console.log("Saved tweet:", message.tweet);
      }
    }
  }

  if (message.action === "find_tweet") {
    const foundTweet = findTweet(tweetPredictions, message.tweet);
    sendResponse({ foundTweet: foundTweet });
  }

  if (message.action === "get_tweets") {
    sendResponse({ tweetPredictions: tweetPredictions });
  }

  if (message.action === "get_reported") {
    sendResponse({ reportedTweets: reportedTweets });
  }

  if (message.action === "report") {
    console.log("Reported:", message.tweet);
    reportedTweets.push(message.tweet);
  }

});
// Listen for messages from the content script
// chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {

//   if (response.popup === "update") {
//     sendResponse({ 
//       censoredCount: countAbusive(tweetPredictions), 
//       censoredRatio: computeCensoredRatio(tweetPredictions),
//       feedCensoredCount: countAbusive(feedTweetPredictions),
//       feedCensoredRatio: computeCensoredRatio(feedTweetPredictions),
//       tweetCount: tweetPredictions.length,
//       feedTweetCount: feedTweetPredictions.length
//     });
//   }

//   if (response.status === "loading") {
//     chrome.action.setBadgeText({text: "load", tabId: sender.tab.id });
//     chrome.action.setBadgeTextColor({ color: 'white', tabId: sender.tab.id  });
//     chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
//   }
//   else if (response.status === "running") {
//     chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
//     chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });

//     if (countAbusive(tweetPredictions) > 0) {
//       chrome.action.setBadgeText({text: countAbusive(tweetPredictions).toString(), tabId: sender.tab.id });
//     }
//     else {
//       chrome.action.setBadgeText({text: "", tabId: sender.tab.id });
//     }

//   }
//   else if (response.action === "push") {
//     if (!findTweet(tweetPredictions, response.tweetObj.tweet)) {
//       console.log("ADDED:", response.tweetObj);
//       tweetPredictions.push(response.tweetObj);
//     }
//   }

//   else if (response.action == "get") {
//     sendResponse({ tweets: tweetPredictions.map(obj => obj.tweet) });
//   }
  
//   else if (response.action === "compare") {

//     const tweet = response.tweet;
//     const foundTweet = findTweet(tweetPredictions, tweet);

//     if (foundTweet && foundTweet.prediction === "Abusive") {
//       sendResponse({ abusive: true });
//     }
//     else{
//       sendResponse({ abusive: false });
//     }

//     if (!findTweet(feedTweetPredictions, tweet)) {
//       feedTweetPredictions.push(foundTweet);
//     }

//   }
//   else if (response.action === "report") {
//     const foundTweet = findTweet(tweetPredictions, response.tweet);
//     if (foundTweet && !findTweet(reportedTweets, response.tweet)) {
//       console.log("REPORTED:", foundTweet);
//       reportedTweets.push(foundTweet);
//     }
//   }
//   else if (response.action === "get_reported_tweets") {
//     sendResponse({ tweets: reportedTweets.map(obj => obj.tweet) });
//   }

// });

// chrome.tabs.onActivated.addListener(function(activeInfo) {
//   // This will log the ID of the newly activated tab
//   // You can also use chrome.tabs.get to get the details of the newly activated tab
//   chrome.tabs.get(activeInfo.tabId, function(tab) {
//     if (tab.url.includes("https://twitter.com/")) {
//       chrome.action.setPopup({popup: "popup.html"});
//     }
//     else {
//       chrome.action.setPopup({popup: ""});
//     }
//   });
// });


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status == "complete" && tab.url.includes("https://twitter.com/")) {
      
      chrome.action.setPopup({popup: "popup.html"});
   
      feedTweetPredictions.length = 0;

      sendMessage({ tab: "updated"});

    }

});



