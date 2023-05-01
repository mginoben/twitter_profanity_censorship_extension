// Predicts tweet
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
            else {
                chrome.runtime.sendMessage({ status: "loading" });
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

    tweetDiv.classList.add("censored");

    tweetDiv.addEventListener('click', function(event) {

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

    });

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
            parent = tweetDiv.parentNode.parentNode;

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
                alert("Tweet reported successfully.\nThank you for your feedback");
                tweetDiv.parentNode.removeChild(img);
                console.log("Reported...", tweet);
                chrome.runtime.sendMessage({action: "report", tweet: tweet});
            });
        }

    });
}


function hideTweetDivs(tweetDivs) {
    
    // Loop through tweet divs
    for (const tweetDiv of tweetDivs) {

        if (tweetDiv.classList.contains("done")) {
            continue;
        }

        // Append overlay to div
        const bodyColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
        const overlayDiv = document.createElement('div');
        overlayDiv.style.backgroundColor = bodyColor;
        overlayDiv.classList.add('overlay');
        tweetDiv.parentNode.appendChild(overlayDiv);
        
        let count = 0;

        const intervalID = setInterval(function() {

            // Get save tweets from background (tweetPredictions)
            chrome.runtime.sendMessage({action: "get_tweets"}, function(response) { 
                
                const tweetPredictions = response.tweetPredictions;
                const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
                const foundTweet = findTweet(tweetPredictions, tweet);

                // Found ? Remove appended div
                if (foundTweet && tweetDiv.parentNode.lastChild.classList.contains("overlay")) {
                    clearInterval(intervalID);
                    tweetDiv.parentNode.removeChild(overlayDiv);
                }
                // interval count elapse? Remove appended div
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

// Loop interval
setInterval(function() {

    // Get all div containing tweets
    const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

    if (tweetDivs.length > 0) {

        hideTweetDivs(tweetDivs); 
        
        for (const tweetDiv of tweetDivs) {

            if (tweetDiv.classList.contains("done")) {
                continue;
            }

            // Get save tweets from background (tweetPredictions)
            chrome.runtime.sendMessage({action: "get_tweets"}, function(response) {
                
                const tweetPredictions = response.tweetPredictions;
                const language = tweetDiv.getAttribute("lang");
                const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');

                // Find current tweet from saved tweets
                const foundTweet = findTweet(tweetPredictions, tweet);
                
                // Not found? Predict
                if (!foundTweet) {

                    query(tweet).then(prediction => {

                        console.log("Predicting...");

                        // Error or Loading
                        if (!prediction) {
                            return;
                        }

                        chrome.runtime.sendMessage({ status: "running" });

                        // Censor if Abusive
                        if (prediction == "Abusive" && !tweetDiv.classList.contains("censored")) {
                            console.log("Censoring...", tweet);
                            censor(tweetDiv);
                            tweetDiv.classList.add("censored");
                        }

                        if (language === "en") {
                            prediction = "Not Tagalog";
                        }
                        
                        // Push to saved tweets
                        chrome.runtime.sendMessage({ 
                            action: "save_tweet",
                            tweet: tweet,
                            prediction: prediction
                        });

                        console.log("Tweet:", tweet, "\nPrediction:", prediction);

                    });
                }
                // Found? Add to feed tweet. Abusive? Censor
                else if (foundTweet) {

                    if (foundTweet.prediction === "Abusive" && !tweetDiv.classList.contains("censored")) {
                        console.log("Censoring...", tweet);
                        censor(tweetDiv);
                        tweetDiv.classList.add("censored");
                    }

                    console.log("Feed tweet added:", foundTweet);
                    chrome.runtime.sendMessage({ 
                        action: "save_feed_tweet",
                        tweet: foundTweet.tweet,
                        prediction: foundTweet.prediction
                    });

                    chrome.runtime.sendMessage({ status: "running" });

                }                            

                addReportButton(tweetDiv);

                tweetDiv.classList.add("done");

            });
        
        }

    }
        
}, 800);




