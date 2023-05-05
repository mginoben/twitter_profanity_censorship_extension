// Connect to the background script
const port = chrome.runtime.connect({name: 'popup'});

// Listen for messages from the background script
port.onMessage.addListener((message) => {
    console.log('Received message:', message);

    if (message.toggleState) {
        // Set button check state
        censorToggle.checked = message.toggleState;
    }

    if (message.popup) {
        updatePopup(message);
    }

    if (message.tweetPredictions) {

        logPanel.innerHTML = '';

        message.tweetPredictions.forEach(tweet => {
            console.log(message.tweet);
            const tweetLog = document.createElement('div');
            tweetLog.textContent = tweet.tweet;
            tweetLog.classList.add("tweet-log");
            if (tweet.prediction === "Abusive") {
                tweetLog.style.backgroundColor = "#ff8a90";
            } else {
                tweetLog.style.backgroundColor = "#b4e092";
            }
            logPanel.appendChild(tweetLog);
        });
        
    }
  
});

var censoredCount = document.getElementById("censoredCount");
var censoredRatio = document.getElementById("censoredRatio");
var feedCensoredCount = document.getElementById("feedCensoredCount");
var feedCensoredRatio = document.getElementById("feedCensoredRatio");
var censoredResult = document.getElementById("censoredResult");
var feedCensoredResult = document.getElementById("feedCensoredResult");
var censorToggle = document.getElementById("censorToggle");
var logPanel = document.getElementById("log-panel");
var logWindow = document.getElementById("log-window");
var toggleLog = document.getElementById("toggle-log");

toggleLog.addEventListener("click", function() {

    if (logWindow.classList.contains("hidden")) {
        logWindow.classList.remove("hidden");
    }
    else {
        logWindow.classList.add("hidden");
    }
    
  
});


censorToggle.addEventListener("change", function() {

  window.close();

  if (this.checked) {
    console.log("Checkbox is checked.");
    port.postMessage({toggleState: true});
  } else {
    port.postMessage({toggleState: false});
  }

});


function updatePopup(message) {

    feedCensoredRatio.textContent = message.feedCensoredRatio;
    feedCensoredCount.textContent = message.feedCensoredCount;
    censoredRatio.textContent = message.censoredRatio;
    censoredCount.textContent = message.censoredCount;

    if (message.censoredRatio >= 50 && message.tweetCount >= 10) {
        censoredResult.style.color = "#ff8a90";
    }
    else if (message.tweetCount == 0 && message.censoredCount == 0) {
        censoredRatio.textContent = 0;
        censoredCount.textContent = 0;
    }
    else {
        censoredResult.style.color = "#b4e092";
    }


    if (message.feedCensoredRatio >= 50 && message.feedTweetCount >= 10) {
        feedCensoredResult.style.color = "#ff8a90";
    }
    else if (message.feedTweetCount == 0 && message.feedCensoredCount == 0) {
        feedCensoredRatio.textContent = 0;
        feedCensoredCount.textContent = 0;
    }
    else {
        feedCensoredResult.style.color = "#b4e092";
    }
}


// function updatePopup() {
//   intervalID = setInterval(function() {
    
//     console.log("Updating popup...");

//     port.postMessage({ popup: "update" });

//     chrome.runtime.sendMessage({popup: "update"}, function(response) {

      

//     });

//   }, 800);
// }






