
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
            chrome.runtime.sendMessage({ status: "loading" });
            console.log("Loading model please wait...");
            // console.log(`HTTP Response Code:`, response.status);
        }
    } catch (error) {
        chrome.runtime.sendMessage({ status: "loading" });
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

}


function addReportButton(tweetDiv) {
    chrome.runtime.sendMessage({action: "get_reported"}, function (response) {

        const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

        const reportedTweets = response.reportedTweets;

        if (reportedTweets && !reportedTweets.includes(tweet)) {
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
                tweetDiv.parentNode.removeChild(img);
                console.log("Reported...", tweet);
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

function hideTweetDivs(tweetDivs) {
        
    for (const tweetDiv of tweetDivs) {

        if (tweetDiv.classList.contains("done")) {
            continue;
        }

        const bodyColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
        const overlayDiv = document.createElement('div');
        overlayDiv.style.backgroundColor = bodyColor;
        overlayDiv.classList.add('overlay');
        tweetDiv.parentNode.appendChild(overlayDiv);
        
        let count = 0;

        const intervalID = setInterval(function() {

            chrome.runtime.sendMessage({action: "get_tweets"}, function(response) { 
                
                const tweetPredictions = response.tweetPredictions;
                const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
                const foundTweet = findTweet(tweetPredictions, tweet);
                
                // If not found then predict and save
                if (foundTweet) {
                    clearInterval(intervalID);
                    tweetDiv.parentNode.removeChild(overlayDiv);
                }
                else if (count === 20) {
                    clearInterval(intervalID);
                    tweetDiv.parentNode.removeChild(overlayDiv);
                }
        
                count++;

            });

        }, 200);  
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

setInterval(function() {

    const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

    if (tweetDivs.length > 0) {

        hideTweetDivs(tweetDivs); 
        
        for (const tweetDiv of tweetDivs) {

            if (tweetDiv.classList.contains("done")) {
                continue;
            }

            chrome.runtime.sendMessage({action: "get_tweets"}, function(response) {
                
                const tweetPredictions = response.tweetPredictions;
                const language = tweetDiv.getAttribute("lang");
                const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
                const foundTweet = findTweet(tweetPredictions, tweet);
                
                // If not found then predict and save
                if (!foundTweet) {

                    query(tweet).then(prediction => {

                        console.log("Predicting...");

                        if (!prediction) {
                            return;
                        }

                        if (prediction == "Abusive" && !tweetDiv.classList.contains("censored")) {
                            console.log("Censoring...", tweet);
                            censor(tweetDiv);
                            tweetDiv.classList.add("censored");
                        }

                        if (language === "en") {
                            prediction = "Not Tagalog";
                        }

                        chrome.runtime.sendMessage({ 
                            action: "save_tweet",
                            tweet: tweet,
                            prediction: prediction
                        });

                        console.log("Tweet:", tweet, "\nPrediction:", prediction);

                    });
                }
                else {
                    chrome.runtime.sendMessage({ status: "running" });
                    console.log("Tweet found:", foundTweet);
                    chrome.runtime.sendMessage({ 
                        action: "save_feed_tweet",
                        tweet: foundTweet.tweet,
                        prediction: foundTweet.prediction
                    });
                }

                // If tweet in saved and abusive
                if (foundTweet && foundTweet.prediction === "Abusive" && !tweetDiv.classList.contains("censored")) {
                    console.log("Censoring...", tweet);
                    censor(tweetDiv);
                    tweetDiv.classList.add("censored");
                }

                addReportButton(tweetDiv);

                tweetDiv.classList.add("done");

            });
        
        }

    }
        
}, 800);




