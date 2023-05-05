// Predicts tweet
function censor(tweetDiv) {

    tweetDiv.classList.add("censored");

    tweetDiv.addEventListener('click', function(event) {

        if (tweetDiv.classList.contains("censored")) {
            // Hide or show depending on "show" class
            if (tweetDiv.classList.contains("show")) {

                const element = event.target;

                // Click censored tweet then "show more"? Show
                if (tweetDiv.innerText != element.innerText && element.innerText == "Show more") {
                    tweetDiv.classList.remove("show");
                }
                // Show
                else {
                    tweetDiv.classList.remove("show");
                    event.stopPropagation();
                }

            } 
            else if (!tweetDiv.classList.contains("show")){ 
        
                tweetDiv.classList.add("show");
                event.stopPropagation();
                
            }
        }

    });

}

function showReportToast(message) {

    const confirmReport = document.createElement("div");
    confirmReport.classList.add("confirm-report");
    const btnContainer = document.createElement("div");
    const yesBtn = document.createElement("button");
    yesBtn.name = "Yes";
    const noBtn = document.createElement("button");
    noBtn.name = "No";

    btnContainer.appendChild(yesBtn);
    btnContainer.appendChild(noBtn);
    confirmReport.appendChild(btnContainer);
    document.body.appendChild(confirmReport);

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.innerText = message;
    document.body.appendChild(toast);
    // Get the toast DIV
    var toastDiv = document.getElementById("toast");

    // Add the "show" class to DIV
    toastDiv.classList.add("show");

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){
        toastDiv.className = toastDiv.className.replace("show", ""); 
        document.body.removeChild(x);
    }, 3000);

}

function addReportButton(tweetDiv) {
    // Get reported tweets from background (reportedTweets)
    chrome.runtime.sendMessage({action: "get_reported"}, function (response) {

        const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

        const reportedTweets = response.reportedTweets;

        // Not found from reported tweets? Add button
        if (reportedTweets && !reportedTweets.includes(tweet)) {
            const img = document.createElement('img');
            img.src = chrome.runtime.getURL("images/report.png");
            img.alt = 'Mark as wrong censorship';
            img.classList.add("report-img");
            parent = tweetDiv.parentNode;

            // Append button as tweet siblings
            tweetDiv.insertAdjacentElement('afterend', img);
            
            // Show button on tweet div hover
            parent.addEventListener("mouseover", () => {
                img.style.display = "block";
            });
            
            parent.addEventListener("mouseout", () => {
                img.style.display = "none";
            });

            // Button listener
            img.addEventListener('click', (event) => {
                event.stopPropagation();
                tweetDiv.parentNode.removeChild(img);
                
                
                // Expected result
                if (tweetDiv.classList.contains("censored")) {
                    port.postMessage({ action: "report", tweet: tweet, prediction : "Non-Abusive" });
                    showReportToast("Tweet Reported: Should not be censored.");
                }
                else {
                    port.postMessage({ action: "report", tweet: tweet, prediction : "Abusive" });
                    showReportToast("Tweet Reported: Should be censored.");
                }
                
            });
        }

    });
}


function hideTweets() {

    setInterval(function() {

        const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

        for (const tweetDiv of tweetDivs) {

            const language = tweetDiv.getAttribute("lang");
    
            if (language === "en") {
                return;
            }
        
            if (!tweetDiv.classList.contains("predicted") && !tweetDiv.lastChild.classList.contains("overlay")) {
                const bodyColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
                const overlayDiv = document.createElement('div');
                overlayDiv.style.backgroundColor = bodyColor;
                overlayDiv.classList.add('overlay');
                
                const loader = document.createElement('div');
                loader.classList.add("loader");

                overlayDiv.appendChild(loader);
                tweetDiv.appendChild(overlayDiv);
                
            }
        }

    }, 400);

}

function showTweet(tweetDiv) {
    if (tweetDiv.lastChild.classList.contains("overlay") || tweetDiv.querySelector(".overlay")) {
        tweetDiv.removeChild(tweetDiv.lastChild);
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

// Connect to the background script

var port = chrome.runtime.connect({name: 'content'});

// Listen for messages from the background script
port.onMessage.addListener((message) => {

    // console.log('Received message from background script:', message);

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
            if (message.prediction === "Abusive" && !tweetDiv.classList.contains("censored")) {
                censor(tweetDiv);
            }
            // Non-Abusive but censored? -> uncensor
            else if (message.prediction === "Non-Abusive" && tweetDiv.classList.contains("censored")) {
                tweetDiv.classList.remove("censored");
            }
    
            tweetDiv.classList.add("predicted");
            addReportButton(tweetDiv);
            console.log(message.tweet, message.prediction);
            
        }

    }

});

hideTweets();
const allowedLanguages = ["in", "fil", "tl"];

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
        
}, 1000);




