
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
        const result = await response.json();
        const prediction = result["data"][0]["label"];
        if (prediction != "Abusive" && prediction != "Non-Abusive" && prediction != "No Profanity") {
            return "loading";
        }
        return prediction;
    } else {
        console.log(`HTTP Response Code:`, response.status);
        return "error";
    }
        
}


function censor(tweetDiv) {

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
            var usernameDiv = usernameDivs[j];
            
            const language = tweetDiv.getAttribute("lang");
            const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
            const username = getUsername(usernameDiv.innerText);
            
            if (language != "tl") {
                continue;
            }

            chrome.runtime.sendMessage({action: "get"}, function(response) {

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

            });

            query(tweet).then(result => {

                if (result == "error") { 
                    return; 
                } 
                else if (result == "loading") {
                    chrome.runtime.sendMessage({ 
                        status: "loading",
                    });
                    return; 
                }

                chrome.runtime.sendMessage({ 
                    status: "running"
                });

                const prediction = result;
                const data = { tweet, username, prediction };
                
                chrome.runtime.sendMessage({ 
                    action: "push",
                    data: data
                });

            });   

        }

    }

}



window.onload = function() {

    // Listen for message from background.js
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.message === 'TabUpdated') {

            console.log("HIDE");
            document.querySelector('main').style.contentVisibility = 'hidden';

            setTimeout(function() {
                document.querySelector('main').style.contentVisibility = 'visible';
            }, 1000);
        }
    });

    let running = false;

    setInterval(function() {
    
        if (!running) {
            
            running = true;
            getTweets();
            running = false;
            
        }
    
    }, 100);
    
    

};
