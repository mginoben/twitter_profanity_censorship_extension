
async function query(tweet) {

    let response;
    try {
        response = await fetch("https://mginoben-tagalog-profanity-censorship.hf.space/run/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                data: [
                    tweet,
                ]
            })
        });
    } catch (error) {
        console.log(error);
        return "error";
    }
        

    if (response.ok) {
        return response.json();
    } else {
        console.log(`HTTP Response Code:`, response.status);
        return "error";
    }
        
}
// const preds = query("Tangina mo");
// console.log(query("Tangina mo").then(response => {return response;}));

function censor(tweetDiv) {

    tweetDiv.classList.add("censored"); ;
    
    tweetDiv.addEventListener('click', function(event) {

        if (tweetDiv.classList.contains("show")) {

            const element = event.target;

            if (tweetDiv.innerText != element.innerText && element.innerText == "Show more") {
                console.log(element.innerText);
                tweetDiv.classList.remove("show");
            }
            else {
                tweetDiv.classList.remove("show");
                event.stopPropagation();
            }

        } 
        else { 
    
            tweetDiv.classList.add("show");
            event.stopPropagation();
            
        }

    });
        
    // }

}

function getUsername(tweet) {
    const tweetUsername = tweet.replace(/[\r\n]/gm, ' ').split(' ');
    let username;
    tweetUsername.forEach(word => {
        if (word.includes('@')) {
            username = word;
        }
    });
    return username;
}

function getTweets() {

            let newTweetFound = false;
            const tweets = document.querySelectorAll('article[data-testid="tweet"]');

            for (let i = 0; i < tweets.length; i++) { 

                chrome.runtime.sendMessage({action: "get"}, function(response) {

                    var tweetDiv = tweets[i].querySelector('[data-testid="tweet"] [lang]');
                    var usernameDiv = tweets[i].querySelector('[data-testid="User-Name"]');
                    const language = tweetDiv.getAttribute("lang");
                    const savedTweets = response.tweets;
                    const tweet = tweetDiv.innerText;
                    const username = getUsername(usernameDiv.innerText);

                    if (language != "tl") {
                        // console.log("Not Tagalog", tweet);
                        return;
                    }

                    if (!savedTweets.includes(tweet)) {

                        newTweetFound = true;
            
                        query(tweet).then(result => {
                            
                            if (result == "error") { // ERROR
                                console.log("Error");
                                return; 
                            } 
            
                            const prediction = result["data"][0]["label"];
            
                            if (prediction == "Model is loading. Try again.") { // LOADING
                                console.log("Model Loading");
                                chrome.runtime.sendMessage({ 
                                    status: "loading"
                                });
                                return; 
                            }
                
                            // GOOD
                            const data = { tweet, username, prediction };
                                
                            chrome.runtime.sendMessage({ 
                                action: "push",
                                data: data
                            });

                            if (prediction == "Abusive") {
                                censor(tweetDiv);                
                            }

                            // console.log(tweetDiv.getAttribute("lang"));
                            
                                                
                        }); 
                        
                    }
                    else {
                        chrome.runtime.sendMessage({ action: "compare", tweet: tweet }, function(response) {

                            if (response.result.prediction == "Abusive" && !tweetDiv.classList.contains("censored")) {
                                console.log("Still here but abusive");
                                censor(tweetDiv);
                            }

                        });
                    }


                    chrome.runtime.sendMessage({ 
                        status: "running"
                    });
                });

                // if (newTweetFound) {
                //     break;
                // }

            }

            return newTweetFound;

}

function checkTweets() {
    
}





window.onload = function() {

    var intervalId = setInterval(function() {
        
        getTweets();

    }, 1000);
};
