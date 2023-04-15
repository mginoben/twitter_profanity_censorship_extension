
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

function censor(tweetDiv, tweet, toggle) {

    if (toggle) {
        tweetDiv.classList.add("censored");
    } 

    tweetDiv.addEventListener('click', function(event) {
        event.stopPropagation();
        chrome.runtime.sendMessage({ 
            action: "toggle",
            tweet: tweet
        });
    });

}


function monitor(tweet_predictions) {

    const tweetDivs = document.querySelectorAll('[data-testid="tweet"] [lang]');

    chrome.runtime.sendMessage({action: "get"}, function(response) { 

        const tweets = response.tweets;

        for (let i = 0; i < tweetDivs.length; i++) {

            const tweet = tweetDivs[i].innerText.replace(/[\r\n]/gm, '');
            
            if (!tweets.includes(tweet)) {
    
                query(tweet).then(result => {
                    
                    if (result == "error") { 
                        console.log("Error");
                        return; 
                    } // ERROR
    
                    const prediction = result["data"][0]["label"];
    
                    if (prediction == "Model is loading. Try again.") { // LOADING
                        console.log("Model Loading");
                        return; 
                    }
    
                    // GOOD
                    const toggle = true;
                    const data = { prediction, tweet, toggle };
                        
                    chrome.runtime.sendMessage({ 
                        action: "push",
                        data: data
                    });

                    if (prediction == "Abusive") {
                        console.log(tweet);
                        censor(tweetDivs[i], tweet, toggle);   
                    }
                    
                });
    
            }
            else {
            
                chrome.runtime.sendMessage({action: "compare", tweet: tweet}, function(response) {
                    if (response.prediction == "Abusive") {
                        censor(tweetDivs[i], tweet, response.toggle);
                    }
                });
            }
        }
    
        return tweet_predictions;

    });

}



window.onload = function() {

    let tweetPredictions = [];

    var intervalId = setInterval(function() {
    
        tweetPredictions = monitor(tweetPredictions);

    }, 1000);
};




