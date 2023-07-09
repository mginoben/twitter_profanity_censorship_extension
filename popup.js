// POPUP SCRIPT
// Manages the extension popup html

// Port connection from Background script
const port = chrome.runtime.connect({name: 'popup'});

// Messages from Background Script
port.onMessage.addListener((message) => {

    console.log('Received message:', message);

    // On Off Button
    if (message.toggleState) {
        // Set button check state
        censorToggle.checked = message.toggleState;
    }

    // Censors only profanity or whole tweet
    if (message.toggleProfanity) {
        // Set button profanity check state
        toggleProfanity.checked = message.toggleProfanity;
    }

    // Updates popup values
    if (message.popup) {
        updatePopup(message);
    }

    // Populate tweet logs
    if (message.tweetPredictions) {

        // INIT logs and users panels
        logPanel.innerHTML = '';
        usersPanel.innerHTML = '';

        // Populate Tweets Prediction List
        tweetPredictions = message.tweetPredictions;
        tweetPredictions.forEach(tweet => {

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
                    currentReportedTweets.push(getTweet(tweetContainer.textContent));
                }
                else {
                    tweetLog.classList.remove('selected');
                    currentReportedTweets = currentReportedTweets.filter(item => item.text !== tweetContainer.textContent);
                }

                console.log(tweetContainer.textContent);
                if (currentReportedTweets.length > 0) {
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

        // Populate Users Profanity Frequency List
        const usersProfanityFrequency = countAbusiveUsers(tweetPredictions);
        usersProfanityFrequency.forEach(data => {
            const userLog = document.createElement('div');
            userLog.classList.add("user-log");

            const link = document.createElement('a');
            link.href = 'https://www.twitter.com/' + data.username;

            link.addEventListener('click', () => {
                // Get the URL of the link
                const url = link.href;
              
                // Send a message to the background script
                // chrome.runtime.sendMessage({ type: 'openTab', url });
                port.postMessage({newTabURL: url})
            });

            userLog.appendChild(link);

            const usernameDiv = document.createElement('div');
            const countDiv = document.createElement('div');
            usernameDiv.textContent = data.username;
            countDiv.textContent = data.count;

            link.appendChild(usernameDiv);
            link.appendChild(countDiv);

            usersPanel.appendChild(userLog);
        });
        
    }
  
});

// Global Variables
var alertUser; 
var alertUserFeed; 
let currentReportedTweets = [];
let tweetPredictions = [];

// DOMS
var reportButton = document.getElementById("report-btn");
var censoredCount = document.getElementById("censoredCount");
var censoredRatio = document.getElementById("censoredRatio");
var feedCensoredCount = document.getElementById("feedCensoredCount");
var feedCensoredRatio = document.getElementById("feedCensoredRatio");
var censoredResult = document.getElementById("censoredResult");
var feedCensoredResult = document.getElementById("feedCensoredResult");
var censorToggle = document.getElementById("censorToggle");
var logPanel = document.getElementById("log-panel");
var usersPanel = document.getElementById("users-panel");
var logWindow = document.getElementById("log-window");
var userWindow = document.getElementById("user-window");
var toggleTweetLog = document.getElementById("toggle-tweet-log");
var toggleUserLog = document.getElementById("toggle-user-log");
var toggleProfanity = document.getElementById("toggle-profanity");

// BUTTON BEHAVIORS

// Toggles profanity/whole tweet censoring
toggleProfanity.addEventListener("change", function() {
  
    if (this.checked) {
      console.log("Profanity is checked.");
      port.postMessage({toggleProfanity: true});
    } else {
      port.postMessage({toggleProfanity: false});
    }
  
});

// Shows/Hide predicted tweets log
toggleTweetLog.addEventListener("click", function() {

    if (logWindow.classList.contains("hidden")) {
        logWindow.classList.remove("hidden");
    }
    else {
        logWindow.classList.add("hidden");
    }

    if (!userWindow.classList.contains("hidden")) {
        userWindow.classList.add("hidden");
    }

});

// Shows/Hide profanity users log
toggleUserLog.addEventListener("click", function() {

    if (userWindow.classList.contains("hidden")) {
        userWindow.classList.remove("hidden");
    }
    else {
        userWindow.classList.add("hidden");
    }

    if (!logWindow.classList.contains("hidden")) {
        logWindow.classList.add("hidden");
    }
    
});

// On/Off censoring
censorToggle.addEventListener("change", function() {

  window.close();

  if (this.checked) {
    console.log("Censoring...");
    port.postMessage({toggleState: true});
  } else {
    console.log("Not censoring...");
    port.postMessage({toggleState: false});
  }

});

// Report selected tweet/s
reportButton.addEventListener("click", function() {
    port.postMessage({currentReportedTweets: currentReportedTweets});
    removeLogs(currentReportedTweets);

    sendToGithub(currentReportedTweets, "TOKEN"); // INSERT GITHUB TOKEN HERE

    currentReportedTweets = [];
    reportButton.style.display = "none";
});

// FUNCTIONS

// Updates popup values
function updatePopup(message) {

    feedCensoredRatio.textContent = message.feedCensoredRatio;
    feedCensoredCount.textContent = message.feedCensoredCount;
    censoredRatio.textContent = message.censoredRatio;
    censoredCount.textContent = message.censoredCount;

    if (message.censoredRatio >= 30) {
        if (alertUser !== true) {
            port.postMessage({alertUser: "overall_browsing"});
            alertUser = true;
        }
        censoredResult.style.color = "#ff8a90";
    }
    else if (message.tweetCount == 0 && message.censoredCount == 0) {
        censoredRatio.textContent = 0;
        censoredCount.textContent = 0;
        censoredResult.style.color = "white";
    }
    else {
        if (alertUser !== false) {
            console.log("Non Abusive Overall Browsing");
            alertUser = false;
        }
        censoredResult.style.color = "#b4e092";
    }

    if (message.feedCensoredRatio >= 30) {
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
        feedCensoredResult.style.color = "white";
    }
    else {
        if (alertUserFeed !== false) {
            console.log("Non Abusive Timeline");
            alertUserFeed = false;
        }
        feedCensoredResult.style.color = "#b4e092";
    }
}

// Remove reported tweets on tweet predictions log
function removeLogs(currentReportedTweets) {

    currentReportedTweets.forEach(tweet => {
        const tweetDiv = [...document.querySelectorAll('.tweet-container')]
        .filter(div => div.textContent.includes(tweet.text));
        console.log();
        if (tweetDiv[0]) {
            tweetDiv[0].parentElement.parentElement.removeChild(tweetDiv[0].parentElement);
        }
    });
   
}

// Extract tweet from tweet predictions
function getTweet(text) {
    for (const tweet of tweetPredictions) {
        if (tweet.text === text) {
            return tweet;
        }
    }
}

// Sends reported tweet to github
function sendToGithub(newTweets, token) {
    
    let newContent = "";
    newTweets.forEach(newTweet => {
        delete newTweet.html;
        delete newTweet.username;
        delete newTweet.reported;
        newContent += JSON.stringify(newTweet) + '\n';
    });

    // Set the username, repository name, and path to the file you want to create or update
    const username = 'mginoben';
    const repo = 'reported-tweets';
    const path = 'reported_tweets.txt';

    // Define the API endpoint for creating or updating a file
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

    console.log(apiUrl);

	// get the current content of the file from GitHub
	fetch(apiUrl, {
        method: 'GET',
        headers: {
            Authorization: `token ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // check if content is in base64 format
        if (!data.content || !btoa) {
            throw new Error('Invalid content format');
        }

        // decode the content from base64 to text
        const content = atob(data.content);

        // append the new text
        const updatedContent = content + '\n' + newContent;

        // encode the updated content to base64
        const encodedContent = btoa(updatedContent);

        // prepare the request body
        const requestBody = {
            message: 'Add new line of text',
            content: encodedContent,
            sha: data.sha
        };

        // update the file in GitHub
        fetch(apiUrl, {
        method: 'PUT',
        headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            console.log('File updated:', data);
        })
        .catch(error => {
            console.error('Error updating file:', error);
        });
    })
    .catch(error => {
        console.error('Error getting file:', error);
    });
}

// Count abusive profanity users
function countAbusiveUsers(tweetPredictions) {
    // Abusive Users
    const counts = tweetPredictions.reduce((counts, tweet) => {

        const username = tweet.username;

        if (tweet.prediction === "Abusive") {
            if (username in counts) {
                counts[username]++;
              } else {
                counts[username] = 1;
              }
        }

        return counts;
        
    }, {});

    const output = Object.entries(counts)
    .sort(([, a], [, b]) => b - a);

    let result = [];

    const maxCount = 5;

    for (let i = 0; i < output.length; i++) {
        const log = output[i];
        const username = log[0];
        const count = log[1];

        result.push({username , count});

        if (i + 1 === maxCount) {
            break;
        }
    }

    return result;
}
