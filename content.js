// Predicts tweet
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
                alert("Tweet reported successfully.\nThank you for your feedback");
                tweetDiv.parentNode.removeChild(img);
                console.log("Reported...", tweet);
                chrome.runtime.sendMessage({action: "report", tweet: tweet});
            });
        }

    });
}


function hideTweets() {

    const bodyColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
    const overlayDiv = document.createElement('div');
    overlayDiv.style.backgroundColor = bodyColor;
    overlayDiv.classList.add('overlay');

    const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

    for (const tweetDiv of tweetDivs) {

        if (tweetDiv.getAttribute("lang") === "en") {
            continue;
        }
        
        if (tweetDiv.classList.contains("predicted") && tweetDiv.lastChild.classList.contains("overlay")) {

            tweetDiv.removeChild(tweetDiv.lastChild);

        }
        else if (!tweetDiv.classList.contains("predicted") && !tweetDiv.lastChild.classList.contains("overlay")) {

            tweetDiv.appendChild(overlayDiv);
       
        } 

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

// Connect to the background script

var port = chrome.runtime.connect({name: 'content'});


// Listen for messages from the background script
port.onMessage.addListener((message) => {

    // console.log('Received message from background script:', message);

    if (message.tweetPredictions) {
        
        const tweetPredictions = message.tweetPredictions;
        const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

        for (const tweetDiv of tweetDivs) {

            if (tweetDiv.classList.contains("predicted")) { continue; }

            const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
            const foundTweet = findTweet(tweetPredictions, tweet);

            if (foundTweet) {

                if (foundTweet.prediction === "Abusive" && !tweetDiv.classList.contains("censored")) {
                    censor(tweetDiv);
                }
                
                addReportButton(tweetDiv);

                tweetDiv.classList.add("predicted");
            }
        }

    }
  
});

// Loop interval
setInterval(function() {

    const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');
    
    if (tweetDivs.length > 0) {

        hideTweets();

        let tweets = [];

        for (const tweetDiv of tweetDivs) {

            const language = tweetDiv.getAttribute("lang");

            if (language === "en" && !tweetDiv.classList.contains("predicted")) {
                tweetDiv.classList.add("predicted");
                continue;
            }

            if (tweetDiv.classList.contains("predicted")) { continue; }

            const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
            tweets.push(tweet);

        }
       
        if (port) {
            port.postMessage({ tweets : tweets });
        }
    }
    

    // const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

    // if (tweetDivs.length > 0) {

    //     hideTweetDivs(tweetDivs); 
        
    //     for (const tweetDiv of tweetDivs) {

    //         if (tweetDiv.classList.contains("done")) {
    //             continue;
    //         }

    //         port.postMessage({ action : "get_tweets" });

    //         chrome.runtime.sendMessage({action: "get_tweets"}, function(response) {
                
    //             const tweetPredictions = response.tweetPredictions;
    //             const language = tweetDiv.getAttribute("lang");
    //             const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
    //             const foundTweet = findTweet(tweetPredictions, tweet);
                
    //             // If not found then predict and save
    //             // if (!foundTweet) {

    //             //     query(tweet).then(prediction => {

    //             //         console.log("Predicting...");

    //             //         if (!prediction) {
    //             //             return;
    //             //         }

    //             //         if (prediction == "Abusive" && !tweetDiv.classList.contains("censored")) {
    //             //             console.log("Censoring...", tweet);
    //             //             censor(tweetDiv);
    //             //             tweetDiv.classList.add("censored");
    //             //         }

    //             //         if (language === "en") {
    //             //             prediction = "Not Tagalog";
    //             //         }

    //             //         chrome.runtime.sendMessage({ 
    //             //             action: "save_tweet",
    //             //             tweet: tweet,
    //             //             prediction: prediction
    //             //         });

    //             //         console.log("Tweet:", tweet, "\nPrediction:", prediction);

    //             //     });
    //             // }
    //             // else {
    //             //     chrome.runtime.sendMessage({ status: "running" });
                    
    //             //     chrome.runtime.sendMessage({ 
    //             //         action: "save_feed_tweet",
    //             //         tweet: foundTweet.tweet,
    //             //         prediction: foundTweet.prediction
    //             //     });
    //             // }

    //             // If tweet in saved and abusive
    //             if (foundTweet && foundTweet.prediction === "Abusive" && !tweetDiv.classList.contains("censored")) {
    //                 console.log("Censoring...", tweet);
    //                 censor(tweetDiv);
    //                 tweetDiv.classList.add("censored");
    //             }

    //             addReportButton(tweetDiv);

    //             tweetDiv.classList.add("done");

    //         });
        
    //     }

    // }
        
}, 800);




