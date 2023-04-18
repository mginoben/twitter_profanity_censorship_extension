
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
        return await response.json();
    } else {
        console.log(`HTTP Response Code:`, response.status);
        return "error";
    }
        
}



    const tweets = document.querySelectorAll(".censored");

    tweets.forEach(tweetDiv => {
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
    });


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

    const tweetUsername = tweet.replace(/[\r\n]/gm, ' ').split(' ');
   
    tweetUsername.forEach(word => {
       
        if (word.includes('@')) {
           word_split = word.split('·');
           if (word_split.length > 1) {
                return word_split[0];
           }
            return word;
        }

    });

}


function getTweets() {

    let executionInterval = 100; 

    const tweets = document.querySelectorAll('article[data-testid="tweet"]');

    for (let i = 0; i < tweets.length; i++) { 

        var tweetDivs = tweets[i].querySelectorAll('[data-testid="tweet"] [lang]');

        for (let j = 0; j < tweetDivs.length; j++) {

            const tweetDiv = tweetDivs[j];
            var usernameDiv = tweets[i].querySelector('[data-testid="User-Name"]');
            const language = tweetDiv.getAttribute("lang");
            const tweet = tweetDiv.innerText.replace(/[\r\n]/gm, ' ');
            const username = getUsername(usernameDiv.innerText);

            if (language != "tl") {
                return;
            }

            query(tweet).then(result => {

                chrome.runtime.sendMessage({action: "get"}, function(response) {

                    const savedTweets = response.tweets;

                    if (!savedTweets.includes(tweet)) {
                            
                            // console.log(result);

                            if (result == "error") { return; } 
                            
                            const prediction = result["data"][0]["label"];

                            console.log(prediction);

                            if (prediction == "Loading Model (Estimated Time: 20.0 Seconds)") {
                                executionInterval = 20000;
                                return; 
                            }
                
                            // GOOD
                            
                            const data = { tweet, username, prediction };
                            

                            chrome.runtime.sendMessage({action: "get"}, function(response) {
                                if (!response.tweets.includes(tweet)) {
                                    chrome.runtime.sendMessage({ 
                                        action: "push",
                                        data: data
                                    });
                                }
                            });
                    
                                                
                        
                    }
                    else {
                        chrome.runtime.sendMessage({ action: "compare", tweet: tweet }, function(response) {

                            if (response.result.prediction == "Abusive" && !tweetDiv.classList.contains("censored")) {
                                censor(tweetDiv);
                            }

                        });
                    }


                    chrome.runtime.sendMessage({ 
                        status: "running"
                    });
                });
                
            }); 
                
                
                
            

        }

    }

    return executionInterval;

}


window.onload = function() {

    document.querySelector('body').style.display = 'none';

    setTimeout(function() {
        document.querySelector('body').style.display = 'block';
    }, 1000);

    let interval = 100;
    let running = false;
    
    setInterval(function() {
    
        if (!running) {
            running = true;
            interval = getTweets(interval);
            running = false;
            
        }
    
    }, interval);

    // Listen for message from background.js
    // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //     if (request.message === 'TabUpdated') {
    //         console.log("WEW");
    //         document.querySelector('body').style.display = 'none';

    //         setTimeout(function() {
    //             document.querySelector('body').style.display = 'block';
    //         }, 1000);
    //     }
    // });
    
};
