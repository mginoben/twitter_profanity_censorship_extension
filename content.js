
async function query(tweet) {

    try {

        const response = await fetch("https://mginoben-tagalog-profanity-censorship.hf.space/run/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                data: [
                    tweet,
                ]
            })
        });

        if (response.ok) {
            const expectedResults = ["Abusive", "Non-Abusive", "No Profanity"];
            const result = await response.json();
            const prediction = result["data"][0]["label"];
            
            if (expectedResults.includes(prediction)) {
                chrome.runtime.sendMessage({ status: "running" });
                return prediction;
            }


        } else {
            console.log(`HTTP Response Code:`, response.status);
        }
    } catch (error) {
        console.log("Loading model please wait...");
    }
        
}


function censor(tweetDiv) {

    const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

    tweetDiv.classList.add("censored");

    tweetDiv.addEventListener('click', function(event) {

        if (tweetDiv.classList.contains("show")) {

            const element = event.target;

            if (tweetDiv.innerText != element.innerText && element.innerText == "Show more") {
                tweetDiv.classList.remove("show");
            }
            else {
                tweetDiv.classList.remove("show");
                event.stopPropagation();
            }

        } 
        else if (!tweetDiv.classList.contains("show")){ 
    
            tweetDiv.classList.add("show");
            event.stopPropagation();
            
        }

    });

    chrome.runtime.sendMessage({action: "get_reported_tweets"}, function (response) {
        const reportedTweets = response.tweets;

        if (!reportedTweets.includes(tweet)) {
            const img = document.createElement('img');
            img.src = chrome.runtime.getURL("images/report.png");
            img.alt = 'Mark as wrong censorship';
            img.classList.add("report-img");
            parent = tweetDiv.parentNode.parentNode;

            tweetDiv.insertAdjacentElement('afterend', img);

            parent.addEventListener("mouseover", () => {
                img.style.display = "block";
            });
            
            parent.addEventListener("mouseout", () => {
                img.style.display = "none";
            });

                // Add an event listener to the image
            img.addEventListener('click', (event) => {
                event.stopPropagation();
                alert("Tweet reported successfully.\nThank you for your feedback");
                tweetDiv.classList.add("reported");
                tweetDiv.parentNode.removeChild(img);
                chrome.runtime.sendMessage({action: "report", tweet: tweet});
            });
        }

    });

}


function getUsername(tweet) {

    const tweetUsername = tweet.split('\n');

    for (let i = 0; i < tweetUsername.length; i++) {
        const word = tweetUsername[i];
        if (word.includes('@')) {
            word_split = word.split('·');
            return word_split[0];
         }
    }

}

function getTweets() {

    const tweets = document.querySelectorAll('article[data-testid="tweet"]');

    for (let i = 0; i < tweets.length; i++) { 

        var tweetDivs = tweets[i].querySelectorAll('[data-testid="tweet"] [lang]');
        var usernameDivs = tweets[i].querySelectorAll('[data-testid="User-Name"]');

        for (let j = 0; j < tweetDivs.length; j++) {

            

            const tweetDiv = tweetDivs[j];
            const language = tweetDiv.getAttribute("lang");
            const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

            chrome.runtime.sendMessage({action: "get"}, function(response) {

                if (!tweetDiv.classList.contains("checked")) {
                    tweetDiv.classList.add("checked");
                }
                
                if (response.tweets.includes(tweet)) {

                    chrome.runtime.sendMessage({ action: "compare", tweet: tweet }, function(response) {

                        if (response.abusive === true && !tweetDiv.classList.contains("censored")) {
                            censor(tweetDiv);
                        }

                        if (response) {
                            chrome.runtime.sendMessage({ status: "running" });
                        }
    
                    });
    
                    return;
                }
                else {
                    query(tweet).then(result => {

                        if (!result) {
                            chrome.runtime.sendMessage({ status: "loading" });
                            return;
                        }
    
                        let prediction = result;
    
                        if (language === "en") {
                            prediction = "Not Tagalog";
                        }
    
                        const tweetObj = { tweet, prediction };
                        
                        console.log(tweetObj);
    
                        chrome.runtime.sendMessage({ 
                            action: "push",
                            tweetObj: tweetObj
                        });
    
                    }); 
                }

            });  
        }
    }

    

}

// Inject the overlay HTML into the current page
function showOverlay() {

    const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');

    for (let i = 0; i < tweetArticles.length; i++) { 

        const article = tweetArticles[i];

        if (article.querySelector(".checked")) { continue; }

        let checkCount = 0;
        const bodyColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
        const overlayDiv = document.createElement('div');
        overlayDiv.style.backgroundColor = bodyColor;
        overlayDiv.classList.add('overlay');
        article.appendChild(overlayDiv);
    
        // Remove if tweets are already  checked
        const intervalID = setInterval(function() {
    
            const tweet = article.querySelector('[data-testid="tweet"] [lang]');
            const overlayDiv = article.querySelector(".overlay");
    
    
            if (overlayDiv && tweet && tweet.classList.contains("checked")) {
                clearInterval(intervalID);
                article.removeChild(overlayDiv);
            }
            else if (checkCount === 8) {
                clearInterval(intervalID);
                article.removeChild(overlayDiv);
            }
    
            checkCount ++;
                
        }, 600);    
    }
}


if (document.readyState !== 'loading') {

    let intervalID;
    let running = false;

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

        // document.getElementById("censoredCount").textContent = request.value;

        // Check if the message is a tab update message


            intervalID = setInterval(function() {
                // Listen for message from background.js
                if (!running) {
                    
                    running = true;

                    getTweets();

                    showOverlay();

                    chrome.runtime.sendMessage({ popup: "update"});

                    running = false;
                
                }
            }, 600);

            
        
        
    });

}
 

