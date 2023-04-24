
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
            let intervalID;
            const expectedResults = ["Abusive", "Non-Abusive", "No Profanity"];
            const result = await response.json();
            const prediction = result["data"][0]["label"];
            
            if (!expectedResults.includes(prediction)) {
                chrome.runtime.sendMessage({ status: "loading" });
            }
            else {
                chrome.runtime.sendMessage({ status: "running" });
                return prediction;
            }

        } else {
            console.log(`HTTP Response Code:`, response.status);
        }
    } catch (error) {
        chrome.runtime.sendMessage({ status: "loading" });
        console.log(error);
    }
        
}


function censor(tweetDiv) {

    tweetDiv.classList.add("censored");

    // Set the image source and alt text
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

    // Add an event listener to the image
    img.addEventListener('click', (event) => {
        event.stopPropagation();
        console.log('Image clicked!', tweetDiv.innerText.replace(/[\r\n]/gm, ' '));
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
            const usernameDiv = usernameDivs[j];
            
            const language = tweetDiv.getAttribute("lang");
            const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
            const username = getUsername(usernameDiv.innerText);

            if (!tweetDiv.classList.contains("checked")) {
                tweetDiv.classList.add("checked");
            }

            chrome.runtime.sendMessage({action: "get"}, function(response) {
                // console.log(response.tweets);
                const savedTweets = response.tweets;   

                if (savedTweets.includes(tweet)) {

                    chrome.runtime.sendMessage({ action: "compare", tweet: tweet, username: username }, function(response) {
                
                        if (response.result.prediction == "Abusive" && !tweetDiv.classList.contains("censored")) {
                            console.log("Censoring:", tweet);
                            censor(tweetDiv);
                        }
    
                    });
    
                    return;
                }
                
                query(tweet).then(result => {

                    if (!result) {
                        return;
                    }

                    console.log(tweet, result);
    
                    let prediction = result;

                    if (language != "tl") {
                        prediction = "Not Tagalog";
                    }

                    const data = { tweet, username, prediction };
                    
                    chrome.runtime.sendMessage({ 
                        action: "push",
                        tweet: data
                    });

                }); 
            });  
        }
    }

    

}

// Inject the overlay HTML into the current page
function showOverlay() {

    let checkCount = 0;
    const bodyColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
    const overlayDiv = document.createElement('div');
    overlayDiv.style.backgroundColor = bodyColor;
    overlayDiv.classList.add('overlay');
    document.body.appendChild(overlayDiv);

    // Remove if tweets are already  checked
    const intervalID = setInterval(function() {

        const tweet = document.querySelector('[data-testid="tweet"] [lang]');
        const overlayDiv = document.body.querySelector(".overlay");


        if (overlayDiv && tweet  && tweet.classList.contains("checked")) {
            clearInterval(intervalID);
            
            document.body.removeChild(overlayDiv);
        }
        else if (checkCount === 7) {
            clearInterval(intervalID);
            document.body.removeChild(overlayDiv);
        }

        checkCount ++;
            
    }, 600);
}
  


if (document.readyState !== 'loading') {

    let intervalID;
    let running = false;

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        
        if (intervalID) {
            clearInterval(intervalID);
        }
        
        // document.getElementById("censoredCount").textContent = request.value;

        // Check if the message is a tab update message
        if (message.activeTab == true) {

            getTweets();
            
            showOverlay();

            intervalID = setInterval(function() {
                // Listen for message from background.js
                if (!running) {
                    
                    running = true;

                    getTweets();

                    chrome.runtime.sendMessage({ popup: "update"});

                    running = false;
                
                }
            }, 600);
        } 
        
    });

}
 

