let tweetPredictions = [];
let feedTweetPredictions = [];
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
  if (!listOfTweet) {
    return;
  }

  let foundTweet;

  for (let i = 0; i < listOfTweet.length; i++) {
    const tweetObj = listOfTweet[i];
    if (tweetObj.tweet === tweet) {
      foundTweet = tweetObj;
      break;
    }
    
  }

  return foundTweet;
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
      console.log("SENDING MESSAGE TO CONTENT");
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
  else if (response.status === "running") {
    chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id  });
    chrome.action.setBadgeBackgroundColor({ color: "#5A5A5A", tabId: sender.tab.id });

    if (countAbusive(tweetPredictions) > 0) {
      chrome.action.setBadgeText({text: countAbusive(tweetPredictions).toString(), tabId: sender.tab.id });
    }
    else {
      chrome.action.setBadgeText({text: "", tabId: sender.tab.id });
    }

  }
  
  else if (response.action === "push") {
    if (!findTweet(tweetPredictions, response.tweetObj.tweet)) {
      tweetPredictions.push(response.tweetObj);
      console.log(tweetPredictions);
    }
  }

  else if (response.action == "get") {
    sendResponse({ tweets: tweetPredictions.map(obj => obj.tweet) });
  }
  
  else if (response.action === "compare") {

    const tweet = response.tweet;
    const foundTweet = findTweet(tweetPredictions, tweet);

    if (foundTweet && foundTweet.prediction === "Abusive") {
      sendResponse({ abusive: true });
    }
    else{
      sendResponse({ abusive: false });
    }

    if (!findTweet(feedTweetPredictions, tweet)) {
      feedTweetPredictions.push(foundTweet);
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

    console.log(changeInfo);

    if (changeInfo.title && tab.url.includes("https://twitter.com/")) {
      
      chrome.action.setPopup({popup: "popup.html"});

      tweetsTab = true;
   
      feedTweetPredictions.length = 0;
      // Send a message to the content script

      if (hasTweets(tab.url)) {
        console.log("Has TWEETS");
        sendMessage({ hasTweets: true});
      }

    }

});



