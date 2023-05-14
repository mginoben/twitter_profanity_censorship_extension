let tweetPredictions = [];
let feedTweetPredictions = [];
let reportedTweets = [];
let toggleState;
let tweetCount;
let censoredRatio;
let censoredCount;
let feedTweetCount;
let feedCensoredCount;
let feedCensoredRatio;
let port = null;
let alertNotification = null;


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

function findTweet(listOfTweet, text) {

  for (let i = 0; i < listOfTweet.length; i++) {
    const tweet = listOfTweet[i];
    if (tweet.text === text) {
      return tweet;
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

async function query(tweet) {
	
	const expectedOutputs = ["Abusive", "Non-Abusive", "No Profanity"]
    try {
		const response = await fetch("https://mginoben-tagalog-profanity-classification.hf.space/run/predict", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				data: [
					tweet,
				]
			})
		});

        if (response.ok) {

			const result = await response.json();
			const data = result["data"];

			if (expectedOutputs.includes(data[0])) {
				return data;
			}

        } else {
            console.log("Loading model please wait...");
            // console.log(`HTTP Response Code:`, response.status);
        }
    } catch (error) {
		console.log("Query error:", error);
    }
        
}

function updatePopup(port) {
	port.postMessage({ 
		popup: "update",
		tweetCount: tweetPredictions.length,
		censoredCount: countAbusive(tweetPredictions), 
		censoredRatio: computeCensoredRatio(tweetPredictions),
		feedTweetCount: feedTweetPredictions.length,
		feedCensoredCount: countAbusive(feedTweetPredictions),
		feedCensoredRatio: computeCensoredRatio(feedTweetPredictions),
		toggleState: toggleState
	});
}

function addToFeed(tweet, prediction) {
	if (!findTweet(feedTweetPredictions, tweet)) {
		feedTweetPredictions.push({
			tweet: tweet, 
			prediction: prediction
		});
	}
}

function saveToVisitList(tweet) {
	
	if (!findTweet(tweetPredictions, tweet.text)) {
		console.log("Saving to 'since visit'...", tweet.text);
		tweetPredictions.push(tweet);
	}

}

function saveToFeedList(tweet) {

	if (!findTweet(feedTweetPredictions, tweet.text)) {
		console.log("Saving to 'feed'...", tweet.text);
		feedTweetPredictions.push(tweet);
	}

}

function alertUserListener() {

	if (computeCensoredRatio(feedTweetPredictions) >= 30 && feedTweetPredictions.length >= 5 && alertNotification !== "done") {
		chrome.alarms.create(
			"alert_user",
			{
				delayInMinutes: 0
			}
		);
		alertNotification = "done";
	}
	
}

function updateBadge() {
	if (countAbusive(tweetPredictions) > 1) {

		chrome.tabs.query({ url: "*://twitter.com/*" }, function(tabs) {

			tabs.forEach(tab => {
				console.log("asdd");
				chrome.action.setBadgeText({text: countAbusive(tweetPredictions).toString(), tabId: tab.id });
				chrome.action.setBadgeTextColor({ color: 'white', tabId: tab.id  });
				chrome.action.setBadgeBackgroundColor({ color: "#4f4f4f", tabId: tab.id });
			});

		});
		
	}
}




chrome.alarms.onAlarm.addListener(
	() => {
		chrome.notifications.create(
			{
				type : "basic",
				iconUrl : "images/censored-128x128.png",
				title : "Cuss Control",
				message : "Your feed is getting toxic! \nPlease consider leaving this feed.",
				silent : false
			},
			() => {

			}
		)
	}
)


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

	if (message.action === "get_reported") {
		sendResponse({ reportedTweets: reportedTweets });
	}

	if (message.action === "report") {
		console.log("Reported:", message.tweet);
		reportedTweets.push(message.tweet);
	}

	if (message.status === "loading") {

		chrome.action.setPopup({popup: ""});

		chrome.action.setBadgeText({text: "load", tabId: sender.tab.id });
		chrome.action.setBadgeTextColor({ color: 'white', tabId: sender.tab.id  });
		chrome.action.setBadgeBackgroundColor({ color: "#8b0000", tabId: sender.tab.id });
		chrome.action.setPopup({popup: ""});
	}

	if (message.status === "running") {

		// Set popup
		chrome.action.setPopup({popup: "popup.html"});

	}

});

// Disables popup html on other websites
chrome.tabs.onActivated.addListener(function(activeInfo) {

  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url.includes("https://twitter.com/")) {
      chrome.action.setPopup({popup: "popup.html"});
    }
    else {
      chrome.action.setPopup({popup: ""});
    }
  });

});

// Connect to the popup script

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status == "complete" && tab.url.includes("https://twitter.com/")) {

      	console.log("Tab updated...");

		alertNotification = null;

		// Make popup html visible
		chrome.action.setPopup({popup: "popup.html"});

		// If toggleState = on then inject scripts
		chrome.storage.local.get(["toggleState"], function(toggle){

			// Reset feed tweets every tab update
			feedTweetPredictions.length = 0;

			// Inject script and css if toggle state = true
			if (toggle.toggleState === true) {
				chrome.scripting.insertCSS({
					target: { tabId: tabId },
					files: ["styles/content.css"]
				}).then(() => console.log("injected css file"));
        
				chrome.scripting.executeScript({
					target: { tabId: tabId },
					files: ["content.js"]
				}).then(() => console.log("injected script file"));

				chrome.action.setIcon({ path: "images/censored-128x128.png" });

			}
			else {
				chrome.action.setIcon({ path: "images/uncensored-128x128.png" });
			}

		});

    }

});

let popupPort;
let contentPort;

chrome.runtime.onConnect.addListener(function(port) {

	console.log(port);
	
	if (port.name === "popup") {
		console.log("Popup script connected");
		// Save the port for later use
		popupPort = port;
		let tweetsLength = 0;
		let intervalID;

		// Send toggle state to popup script
		chrome.storage.local.get(["toggleState"], function(toggleState){

			console.log(toggleState);

			// Update popup every 1 sec
			if (popupPort && toggleState.toggleState === true) {
				intervalID = setInterval(function() {
					console.log("Updating popup...");

					if (popupPort && tweetsLength != tweetPredictions.length) {
						popupPort.postMessage({
							tweetPredictions: tweetPredictions
						})
						tweetsLength = tweetPredictions.length;
					}
					
					popupPort.postMessage({ 
						popup: "update",
						tweetCount: tweetPredictions.length,
						censoredCount: countAbusive(tweetPredictions), 
						censoredRatio: computeCensoredRatio(tweetPredictions),
						feedTweetCount: feedTweetPredictions.length,
						feedCensoredCount: countAbusive(feedTweetPredictions),
						feedCensoredRatio: computeCensoredRatio(feedTweetPredictions),
						toggleState: toggleState
					});

				}, 1000);
			}

			// Send a message to the popup script
			popupPort.postMessage(toggleState);
			console.log("Toggle state sent.");
		});

		chrome.storage.local.get(["toggleProfanity"], function(toggle){
			console.log(toggle);
			popupPort.postMessage({
				toggleProfanity: toggle.toggleProfanity
			})
		
		});

	  	// Listen for messages from the popup script
	  	popupPort.onMessage.addListener(function(message) {
			console.log("Received message from popup script:", message);

			
			// Toggle turned on
			if (message.toggleState === true) {

				// Save current toggle state (true)
				chrome.storage.local.set({ "toggleState": true });

				// Reload all twitter page
				chrome.tabs.query({ url: "*://twitter.com/*" }, function(tabs) {
					console.log(tabs);
					for (var i = 0; i < tabs.length; i++) {
						chrome.tabs.reload(tabs[i].id);
					}
				});
		
				// Change extension icon
				chrome.action.setIcon({ path: "images/censored-128x128.png" });

			}
			
			// Toggle turned off
			if (message.toggleState === false) {

				// Save current toggle state (false)
				chrome.storage.local.set({ "toggleState": false });	

				// Reload all twitter page
				chrome.tabs.query({ url: "*://twitter.com/*" }, function(tabs) {
					console.log(tabs);
					for (var i = 0; i < tabs.length; i++) {
						chrome.tabs.reload(tabs[i].id);
					}
				});
		
				// Change extension icon
				chrome.action.setIcon({ path: "images/uncensored-128x128.png" });

			}

			if (message.toggleProfanity === true) {

				// Save current toggle state (true)
				chrome.storage.local.set({ "toggleProfanity": true });

				// Reload all twitter page
				chrome.tabs.query({ url: "*://twitter.com/*" }, function(tabs) {
					console.log(tabs);
					for (var i = 0; i < tabs.length; i++) {
						chrome.tabs.reload(tabs[i].id);
					}
				});
		
			}

			if (message.toggleProfanity === false) {

				// Save current toggle state (true)
				chrome.storage.local.set({ "toggleProfanity": false });

				// Reload all twitter page
				chrome.tabs.query({ url: "*://twitter.com/*" }, function(tabs) {
					console.log(tabs);
					for (var i = 0; i < tabs.length; i++) {
						chrome.tabs.reload(tabs[i].id);
					}
				});

			}

	  	});
	  
	  // Handle disconnections
	  popupPort.onDisconnect.addListener(function() {
			console.log("Popup script disconnected");
			clearInterval(intervalID);
			popupPort = null;
	  });

	}

	if (port.name === "content") {
		console.log("Content script connected");
		// Save the port for later use
		contentPort = port;
		const allowedLanguages = ["in", "fil", "tl"];

		chrome.storage.local.get(["toggleProfanity"], function(toggle){
			console.log(toggle);
			contentPort.postMessage({
				toggleProfanity: toggle
			})
		
		});

		// Listen for messages from the popup script
		contentPort.onMessage.addListener(function(message) {

			// console.log("Received message from content script:", message);

			if (message.text) {

				console.log(message);

				// Add placeholder variable
				const prediction = null;
				const profanities = [];
				const tweet = Object.assign({}, message, {prediction, profanities});

				// Not Tagalog
				if (!allowedLanguages.includes(tweet.language)) {

					tweet.prediction = "Not Tagalog";
					tweet.profanities = [];

					contentPort.postMessage(tweet);

					console.log(tweet);

					saveToVisitList(tweet);
					saveToFeedList(tweet);

					return;

				}

				const savedTweet = findTweet(tweetPredictions, tweet.text);

				// Predict Tagalog tweets not in list
				if (!savedTweet) {

					query(tweet.text).then(result => {

						console.log("Predicting...", tweet.text);
		
						if (!result) {
							console.log("Prediction failed. Predicting again...", tweet.text);
							tweet.prediction = "Pending";
							contentPort.postMessage(tweet);
							return;
						}

						tweet.prediction = result[0];
						tweet.profanities = result[1];

						console.log(tweet, result);
						
						contentPort.postMessage(tweet);

						saveToVisitList(tweet);
						saveToFeedList(tweet);

						updateBadge();

					});

				}
				else {

					console.log("Found on saved list...", savedTweet.text);

					contentPort.postMessage(savedTweet);

					saveToFeedList(savedTweet);

				}

			}

			if (message.action === "report") {
				console.log(message);
				sendToGithub(message.reportedTweet);
			}

		});

		// Handle disconnections
		contentPort.onDisconnect.addListener(function() {
			console.log("Content script disconnected");
			contentPort = null;
		});
	}
  });
  


