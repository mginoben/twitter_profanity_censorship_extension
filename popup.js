// Connect to the background script
const port = chrome.runtime.connect({name: 'popup'});

// Alert toggle
var alertUser; 
var alertUserFeed; 
let reportList = [];

// TODO Nofication

// Listen for messages from the background script
port.onMessage.addListener((message) => {

    console.log('Received message:', message);

    if (message.toggleState) {
        // Set button check state
        censorToggle.checked = message.toggleState;
    }

    if (message.toggleProfanity) {
        // Set button profanity check state
        toggleProfanity.checked = message.toggleProfanity;
    }

    if (message.popup) {
        updatePopup(message);
    }

    // Tweets Logging
    if (message.tweetPredictions) {

        logPanel.innerHTML = '';

        message.tweetPredictions.forEach(tweet => {

            // Tweet log
            const tweetLog = document.createElement('div');
            tweetLog.classList.add("tweet-log");
            // Tweet Container
            const tweetContainer = document.createElement('div');
            tweetContainer.classList.add("tweet-container");
            tweetContainer.innerHTML = tweet.html;
            // Report Container
            const reportContainer = document.createElement('div');
            reportContainer.classList.add("report-container");
            const reportIcon = document.createElement('img');
            reportIcon.src = chrome.runtime.getURL("images/report.png");
            reportIcon.alt = 'Mark as wrong censorship';
            reportIcon.id = "report-img";
            reportIcon.classList.add("report-img");
            
            // Report Event
            reportIcon.addEventListener('click', (event) => {

                if (!tweetLog.classList.contains('selected')) {
                    tweetLog.classList.add('selected');
                    reportList.push(tweetContainer.textContent);
                }
                else {
                    tweetLog.classList.remove('selected');
                    reportList = reportList.filter(item => item !== tweetContainer.textContent);
                }

                console.log(tweetContainer.textContent);
                if (reportList.length > 0) {
                    reportButton.style.display = "block";
                }
                else {
                    reportButton.style.display = "none";
                }
                
            });
            
            reportContainer.appendChild(reportIcon);
            tweetLog.appendChild(tweetContainer);
            tweetLog.appendChild(reportContainer);
            
            if (tweet.prediction === "Abusive") {
                tweetLog.style.backgroundColor = "#ff8a90";
            } else {
                tweetLog.style.backgroundColor = "#b4e092";
            }

            logPanel.appendChild(tweetLog);
        });
        
    }
  
});

var reportButton = document.getElementById("report-btn");
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
var toggleProfanity = document.getElementById("toggle-profanity");

toggleProfanity.addEventListener("change", function() {
  
    if (this.checked) {
      console.log("Profanity is checked.");
      port.postMessage({toggleProfanity: true});
    } else {
      port.postMessage({toggleProfanity: false});
    }
  
});

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

reportButton.addEventListener("click", function() {
    port.postMessage({reportList: reportList});
    removeLogs(reportList);
    reportList = [];
    reportButton.style.display = "none";
});

function updatePopup(message) {

    feedCensoredRatio.textContent = message.feedCensoredRatio;
    feedCensoredCount.textContent = message.feedCensoredCount;
    censoredRatio.textContent = message.censoredRatio;
    censoredCount.textContent = message.censoredCount;

    if (message.censoredRatio >= 30 && message.tweetCount >= 5) {
        if (alertUser !== true) {
            port.postMessage({alertUser: "overall_browsing"});
            alertUser = true;
        }
        censoredResult.style.color = "#ff8a90";
    }
    else if (message.tweetCount == 0 && message.censoredCount == 0) {
        censoredRatio.textContent = 0;
        censoredCount.textContent = 0;
    }
    else {
        if (alertUser !== false) {
            console.log("Non Abusive Overall Browsing");
            alertUser = false;
        }
        censoredResult.style.color = "#b4e092";
    }

    if (message.feedCensoredRatio >= 30 && message.feedTweetCount >= 5) {
        if (alertUserFeed !== true) {
            console.log("Abusive Timeline");
            port.postMessage({alertUser: "feed"});
            alertUserFeed = true;
        }
        feedCensoredResult.style.color = "#ff8a90";
    }
    else if (message.feedTweetCount == 0 && message.feedCensoredCount == 0) {
        feedCensoredRatio.textContent = 0;
        feedCensoredCount.textContent = 0;
    }
    else {
        if (alertUserFeed !== false) {
            console.log("Non Abusive Timeline");
            alertUserFeed = false;
        }
        feedCensoredResult.style.color = "#b4e092";
    }
}

function removeLogs(listOfTweet) {

    listOfTweet.forEach(tweetText => {
        const tweetDiv = [...document.querySelectorAll('.tweet-container')]
        .filter(div => div.textContent.includes(tweetText));
        console.log();
        tweetDiv[0].parentElement.parentElement.removeChild(tweetDiv[0].parentElement);
    });
   
}






