// Predicts tweet


function formatUsername(usernameDiv) {

    const usernameSplit = usernameDiv.innerText.split('\n');

    for (let i = 0; i < usernameSplit.length; i++) {
        const word = usernameSplit[i];
        if (word.includes('@')) {
            word_split = word.split('·');
            return word_split[0].replace('@', '');
         }
    }

}

function getTweets(tweetDivs, usernameDivs) {

    const information = [];

    for (let i = 0; i < tweetDivs.length; i++) {

        // Article has no tweet        
        if (!tweetDivs[i]) {continue;}

        const div = tweetDivs[i]
        const text = div.textContent;
        const language = div.getAttribute("lang");
        const username = formatUsername(usernameDivs[i]);

        const data = {text, language, username, div}

        information.push(data);

    }

    return information;
}

function censorTweet(tweetDiv) {

    if (tweetDiv.classList.contains("predicted")) {
        return;
    }

    tweetDiv.style.paddingRight = "30px";

    console.log("Censoring...", tweetDiv.textContent);

    tweetDiv.childNodes.forEach(child=> {

        // Not an overlay
        if (!child.classList.contains("overlay")) {
            child.classList.add("censored", "abusive");
        }
        // TODO Username
    });

    tweetDiv.addEventListener('click', function(event) {

        tweetDiv.childNodes.forEach(child => {
            if (child.classList.contains("censored")) {
                child.classList.remove("censored", "censored-img");
            }
            else {
                child.classList.add("censored", "censored-img");
            }
        });

        event.stopPropagation();

    });

}

function censorProfanity(tweetDiv, profanities) {
    
    if (tweetDiv.classList.contains("predicted")) {
        return;
    }

    tweetDiv.style.paddingRight = "30px";
    
    var tweetContent = tweetDiv.innerHTML;

	// Censor each profanity
    profanities.forEach(profanity => {
        var matchedProfanity = new RegExp(profanity, "gi");
        const mask = '<span class="censored abusive">$&</span>';
		tweetContent = tweetContent.replace(matchedProfanity, mask);
    });

	// Replace the main tweet content
	tweetDiv.innerHTML = tweetContent;

    tweetDiv.addEventListener('click', function(event) {

        const profanities = tweetDiv.querySelectorAll(".abusive");

        profanities.forEach(profanity => {
            if (profanity.classList.contains("censored")) {
                profanity.classList.remove("censored");
            }
            else {
                profanity.classList.add("censored");
            }
        });
        
        event.stopPropagation();

    });

}

function disablePageBody(tweetDiv) {

    tweetDiv.childNodes.forEach(child => {
        child.classList.replace("abusive", "non-abusive");
    });

    // get all the child elements of the parent div
    const censoredProfanities = tweetDiv.querySelectorAll('.censored');

    // loop through each child element and remove the 'my-class' class
    censoredProfanities.forEach((censoredProfanity) => {
        censoredProfanity.classList.remove('censored');
    });

    const mainPage = document.getElementsByTagName("MAIN")[0];
    const feedsPanel = document.querySelector('[data-testid="primaryColumn"]');
    const header = document.getElementsByTagName("HEADER")[0];

    header.style.pointerEvents = "none";
    feedsPanel.style.pointerEvents = "none";
    mainPage.style.pointerEvents = "none";
}

function enablePageBody(tweetDiv) {

    tweetDiv.childNodes.forEach(child => {
        child.classList.replace("non-abusive", "abusive");
    });
    
    // get all the child elements of the parent div
    const censoredProfanities = tweetDiv.querySelectorAll('.abusive'); //TODO recensor tweet

    // loop through each child element and remove the 'my-class' class
    censoredProfanities.forEach((censoredProfanity) => {
        censoredProfanity.classList.add('censored');
    });

    const mainPage = document.getElementsByTagName("MAIN")[0];
    const feedsPanel = document.querySelector('[data-testid="primaryColumn"]');
    const header = document.getElementsByTagName("HEADER")[0];

    header.style.pointerEvents = "auto";
    feedsPanel.style.pointerEvents = "auto";
    mainPage.style.pointerEvents = "auto";
}

function saveReportedTweet(tweet) {

    // get any existing data from storage
    chrome.storage.local.get(['reportedTweets'], function(result) {
        // initialize an empty list
        let reportedTweets = [];

        if (result.reportedTweets) {
            // if there is existing data, append it to the list variable
            reportedTweets = result.reportedTweets;
        }
        
        // append the new data to the list
        reportedTweets.push(tweet);

        // save the updated list to storage
        chrome.storage.local.set({ 'reportedTweets': reportedTweets }, function() {
            console.log('Data saved to storage.');
        });
    });

}

function showReportConfirmation(tweetDiv) {

    disablePageBody(tweetDiv);

    const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

    // Confirmation window for report
    const confirmReport = document.createElement("div");
    confirmReport.innerHTML = "<p>Report this tweet?</p>";
    confirmReport.classList.add("confirm-report");
    const btnContainer = document.createElement("div");
    confirmReport.appendChild(btnContainer);
    
    confirmReport.insertAdjacentHTML('afterbegin', tweetDiv.innerHTML);
    document.body.appendChild(confirmReport);

    // Yes button
    const yesBtn = document.createElement("button");
    yesBtn.innerText = "Yes";
    yesBtn.addEventListener('click', () => {

        const reportImg = tweetDiv.parentNode.querySelector(".report-img");
        if (reportImg) {
            tweetDiv.parentNode.removeChild(reportImg);
        }

        enablePageBody(tweetDiv);

        document.body.removeChild(confirmReport);

        saveReportedTweet(tweet);

        sendToGithub(tweet);

        // Toast if yes button
        const toast = document.createElement("div");
        toast.id = "toast";
        toast.innerText = "Tweet Reported. Thank You";
        document.body.appendChild(toast);

        const toastDiv = document.getElementById("toast");
        toastDiv.classList.add("show-toast");

        // After 3 seconds, remove the show class from toast
        setTimeout(function(){
            toastDiv.classList.remove("show-toast"); 
            document.body.removeChild(toastDiv);
        }, 3000);

    });
    btnContainer.appendChild(yesBtn);

    // No button
    const noBtn = document.createElement("button");
    noBtn.innerText = "No";
    noBtn.addEventListener('click', () => {

        enablePageBody(tweetDiv);

        document.body.removeChild(confirmReport);

    });
    btnContainer.appendChild(noBtn);

}


function createReportButton(tweetDiv) {
    const reportIcon = document.createElement('img');
    reportIcon.src = chrome.runtime.getURL("images/report.png");
    reportIcon.alt = 'Mark as wrong censorship';
    reportIcon.id = "report-img";
    reportIcon.classList.add("report-img");
    parent = tweetDiv.parentNode;

    // Append button as tweet siblings
    tweetDiv.insertAdjacentElement('afterend', reportIcon);
    
    // Show button on tweet div hover
    parent.addEventListener("mouseover", () => {
        reportIcon.style.display = "block";
    });
    
    parent.addEventListener("mouseout", () => {
        reportIcon.style.display = "none";
    });

    // Button listener
    reportIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        
        showReportConfirmation(tweetDiv);
        
    });
}


function hideLoadingTweets() {

    setInterval(function() {

        const tweetDivs = document.querySelectorAll('[data-testid="tweetText"]');

        tweetDivs.forEach(tweetDiv => {

            if (!tweetDiv.classList.contains("predicted") && !tweetDiv.lastChild.classList.contains('overlay')) {

                const overlayDiv = document.createElement('div');
                const bodyColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
                overlayDiv.style.backgroundColor = bodyColor;
                overlayDiv.classList.add('overlay');

                const loader = document.createElement('div');
                loader.classList.add("loader");
                overlayDiv.appendChild(loader);

                tweetDiv.appendChild(overlayDiv); 

            }
            else if (tweetDiv.classList.contains("predicted") && tweetDiv.lastChild.classList.contains('overlay')) {
                tweetDiv.removeChild(tweetDiv.lastChild);
            }

        });

    }, 400);

}


function findTweet(listOfTweet, tweet) {

    for (let i = 0; i < listOfTweet.length; i++) {
      const tweetObj = listOfTweet[i];
      if (tweetObj.tweet === tweet) {
        return tweetObj;
      }
    }
  
}


function sendToGithub(newtweet) {
    // Set the username, repository name, and path to the file you want to create or update
    const username = 'mginoben';
    const repo = 'reported-tweets';
    const path = 'reported_tweets.txt';
	
    // Set the authentication token for accessing the GitHub API
    const token = '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';

    // Define the API endpoint for creating or updating a file
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

    console.log(apiUrl);

    // Make the API request
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
        const updatedContent = content + '\n' + newtweet;

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

function clearReportedTweets() {
    chrome.storage.local.set({ 'reportedTweets': null }, function() {
        console.log('Reports cleared.');
    });
}

// Connect to the background script

var port = chrome.runtime.connect({name: 'content'});
var toggleProfanity;

// Listen for messages from the background script
port.onMessage.addListener((message) => {

    // clearReportedTweets();

    console.log('Received message from background script:', message);

    if (message.toggleProfanity) {
        console.log("TOGGLE", message.toggleProfanity.toggleProfanity);
        toggleProfanity =  message.toggleProfanity.toggleProfanity;
    }

    if (message.text) {

        const tweet = message;

        const tweetDivs = [...document.querySelectorAll('[data-testid="tweetText"]')]
        .filter(div => div.textContent.includes(tweet.text));


        for (let i = 0; i < tweetDivs.length; i++) {

            const tweetDiv = tweetDivs[i];

            // Pending tweet? -> send again to background script
            if (tweet.prediction === "Pending") {
                div.classList.remove('queued');
                continue;
            } 
            // Abusive? -> censor
            else if (tweet.prediction === "Abusive") {
                if (toggleProfanity) {
                    censorProfanity(tweetDiv, tweet.profanities)
                }
                else {
                    censorTweet(tweetDiv);
                }
                
            }

            tweetDiv.classList.add('predicted');
        }

    }

});

// Hide tweets that are not yet predicted  
hideLoadingTweets();

// Loop interval for getting tweets
setInterval(function() {

    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    
    if (articles.length === 0) {
        return;
    }

    const tweetDivs = document.querySelectorAll('[data-testid="tweetText"]');
    const usernameDivs = document.querySelectorAll('[data-testid="User-Name"]');

    const tweets = getTweets(tweetDivs, usernameDivs);

    for (let i = 0; i < tweets.length; i++) {

        const tweet = tweets[i];
        const div = tweet.div;

        if (div.classList.contains('queued')) { continue; }

        // Delete div from post object
        delete tweet.div;
        port.postMessage(tweet);

        // Mark tweet as sent (for prediction queuing)
        div.classList.add('queued');

    }
        
}, 800);




