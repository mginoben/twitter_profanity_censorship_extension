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

        const div = tweetDivs[i];
        const html = div.innerHTML;
        const text = div.textContent;
        const language = div.getAttribute("lang");
        const username = formatUsername(usernameDivs[i]);

        const tweet = {text, language, username, div, html}

        information.push(tweet);

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
    const censoredProfanities = tweetDiv.querySelectorAll('.abusive'); 

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
            console.log('Data saved to reported tweets.');
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

    tweetDiv.classList.add('reported');

    const reportIcon = document.createElement('img');
    reportIcon.src = chrome.runtime.getURL("images/report.png");
    reportIcon.alt = 'Report icon';
    reportIcon.title = 'This tweet was reported for wrong prediction';
    reportIcon.id = "report-img";
    reportIcon.classList.add("report-img");
    parent = tweetDiv.parentNode;
    // Append button as tweet siblings
    tweetDiv.insertAdjacentElement('afterend', reportIcon);
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
                tweetDiv.classList.remove('queued');
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
            
            if (tweet.reported === true) {
                createReportButton(tweetDiv);
            }

            tweetDiv.classList.add('predicted');
        }

    }

});

function addReportButton(tweetDiv) {

    const reportImg = tweetDiv.parentNode.querySelector(".report-img");

    if (reportImg) {
        return;
    }

    const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

    // get any existing data from storage
    chrome.storage.local.get(['reportedTweets'], function(result) {

        if (result.reportedTweets) {
            console.log(result.reportedTweets);
            // if there is existing data, append it to the list variable
            reportedTweets = result.reportedTweets;

            if (reportedTweets.includes(tweet)) {
                return;
            }
            else {
                createReportButton(tweetDiv);
            }
        }
        else {
            createReportButton(tweetDiv);
        }
        
    });

}

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




