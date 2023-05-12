// Predicts tweet
function censorTweet(tweetDiv) {

    if (tweetDiv.classList.contains("predicted")) {
        return;
    }

    tweetDiv.style.paddingRight = "30px";

    console.log("Censoring...", tweetDiv.textContent);

    const tweetDivChildNodes = tweetDiv.childNodes;

    tweetDivChildNodes.forEach(child=> {
        if (child.tagName === "IMG") {
            child.classList.add("censored-img");
        }
        child.classList.add("censored", "abusive");
    });

    tweetDiv.addEventListener('click', function(event) {

        tweetDivChildNodes.forEach(child => {
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

function addReportButton(tweetDiv) {

    const reportImg = tweetDiv.parentNode.querySelector(".report-img");
    if (reportImg) {
        return;
    }

    const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

    // get any existing data from storage
    chrome.storage.local.get(['reportedTweets'], function(result) {

        console.log(result);

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


function hideTweets() {

    setInterval(function() {

        const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

        for (const tweetDiv of tweetDivs) {

            const language = tweetDiv.getAttribute("lang");
    
            if (!allowedLanguages.includes(language)) {
                return;
            }
        
            if (!tweetDiv.classList.contains("predicted") && !tweetDiv.parentElement.lastChild.classList.contains("overlay")) {
                const bodyColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
                const overlayDiv = document.createElement('div');
                overlayDiv.style.backgroundColor = bodyColor;
                overlayDiv.classList.add('overlay');
                
                const loader = document.createElement('div');
                loader.classList.add("loader");
                overlayDiv.appendChild(loader);

                tweetDiv.parentElement.appendChild(overlayDiv);
                
            }
        }

    }, 400);

}

function showTweet(tweetDiv) {

    if (!tweetDiv.classList.contains("predicted")) {
        return;
    }

    if (tweetDiv.parentElement.lastChild.classList.contains("overlay")) {
        tweetDiv.parentElement.removeChild(tweetDiv.parentElement.lastChild);
    }

}


function findTweet(listOfTweet, tweet) {

    for (let i = 0; i < listOfTweet.length; i++) {
      const tweetObj = listOfTweet[i];
      if (tweetObj.tweet === tweet) {
        return tweetObj;
      }
    }
  
}


function findTweetDiv(targetTweet) {

    const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

    for (const tweetDiv of tweetDivs) {

        const language = tweetDiv.getAttribute("lang");

        if (language === "en" || tweetDiv.classList.contains("predicted")) {
            continue;
        }

        const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

        if (tweet === targetTweet) {
            return tweetDiv;
        }
    }
}

function sendToGithub(newtweet) {
    // Set the username, repository name, and path to the file you want to create or update
    const username = 'mginoben';
    const repo = 'twitter_profanity_censorship_extension';
    const path = 'raw.txt';
	
    // Set the authentication token for accessing the GitHub API
    const token = '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';

    // Convert 9the content to a string
    const contentString = JSON.stringify(newtweet);
	// convert each object to a JSON string and join them with newlines

    // Define the API endpoint for creating or updating a file
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

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
		// decode the content from base64 to text
		const content = atob(data.content);

		// append the new text
		const updatedContent = content + '\n' + newtweet;

		// encode the updated content to base64
		const encodedContent = btoa(unescape(encodeURIComponent(updatedContent)));

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

// Connect to the background script

var port = chrome.runtime.connect({name: 'content'});
var toggleProfanity;

// Listen for messages from the background script
port.onMessage.addListener((message) => {

    // console.log('Received message from background script:', message);
    if (message.toggleProfanity) {
        console.log("TOGGLE", message.toggleProfanity.toggleProfanity);
        toggleProfanity =  message.toggleProfanity.toggleProfanity;
    }

    if (message.tweet) {

        const tweetDivs = [...document.querySelectorAll('[data-testid="tweet"] [lang]')]
        .filter(div => div.textContent.includes(message.tweet));

        for (let i = 0; i < tweetDivs.length; i++) {
            const tweetDiv = tweetDivs[i];

            if (!tweetDiv) {
                continue;
            }

            // Pending tweet? -> send again to background script
            if (message.prediction === "Pending" && tweetDiv.classList.contains("sent")) {
                tweetDiv.classList.remove("sent");
                continue;
            }

            // Abusive tweet? -> censor
            if (message.prediction === "Abusive" && !tweetDiv.querySelector(".censored")) {
                if (toggleProfanity) {
                    censorProfanity(tweetDiv, message.profanities)
                }
                else {
                    censorTweet(tweetDiv);
                }
                
            }
            // Non-Abusive but censored? -> uncensor
            else if (message.prediction === "Non-Abusive" && tweetDiv.querySelector(".censored")) {
                
                if (toggleProfanity) {
                    tweetDiv.childNodes.forEach(child => {
                        child.classList.remove("censored");
                    });
                }
                else {
                    tweetDiv.classList.remove("censored");
                }
            }
    
            tweetDiv.classList.add("predicted");

            addReportButton(tweetDiv);
            
        }

    }

});

hideTweets();

var allowedLanguages = ["in", "fil", "tl"];

// Loop interval
setInterval(function() {

    const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');
    
    if (tweetDivs.length > 0) {
        
        for (let i = 0; i < tweetDivs.length; i++) {

            const tweetDiv = tweetDivs[i];
            const tweet = tweetDiv.textContent;
            const language = tweetDiv.getAttribute("lang");

            if (tweetDiv.classList.contains("sent")) {
                if (tweetDiv.classList.contains("predicted")) {
                    showTweet(tweetDiv);
                }
                continue;
            }
            
            if (allowedLanguages.includes(language)) {
                port.postMessage({ tweet : tweet, lang: language });
            }
            else {
                port.postMessage({ tweet : tweet, lang: "not_tl" });
            }   
            
            tweetDiv.classList.add("sent");

        }

    }
        
}, 800);




