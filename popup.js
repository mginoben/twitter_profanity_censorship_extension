
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

        chrome.runtime.sendMessage({ 
            status: "running",
        });
        const result = await response.json();
        const prediction = result["data"][0]["label"];

        if (prediction != "Abusive" && prediction != "Non-Abusive" && prediction != "No Profanity") {
            chrome.runtime.sendMessage({ 
                status: "loading",
            });
            return "loading";
        }

        return prediction;

    } else {
        console.log(`HTTP Response Code:`, response.status);
        chrome.runtime.sendMessage({ 
            status: "loading",
        });
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

    let modelLoading;

    chrome.runtime.sendMessage({status: "get"}, function(response) {

        const status = response.status;
        if (status === "loading") {
            modelLoading = true;
            query("test");
        }
        else {

            modelLoading = false;
        }
        // console.log(status);

    });

    if (modelLoading) {
        return;
    }

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
            
            if (language != "tl") {
                continue;
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

                    if (result == "error" || result == "loading") { 
                        return; 
                    } 
    
                    const prediction = result;
                    const data = { tweet, username, prediction };
                    
                    chrome.runtime.sendMessage({ 
                        action: "push",
                        data: data
                    });
    
                }); 

            });  

        }

    }


}

function getModel() {
    query("test").then(result => {

        if (result == "error" || result == "loading") { 
            return;
        } 

        chrome.runtime.sendMessage({ 
            status: "running",
        });

    });
}

function update_censor_count() {
	let censor_element = document.getElementsByClassName("censoredCount");
	for (let i = 0; i < censor_element.length; i++) {
		let element = censor_element[i];
		element.textContent = 1;
	}
}

// Inject the overlay HTML into the current page
function showOverlay() {

    let checkCount = 0;
 
    const overlayDiv = document.createElement('div');

    var img = document.createElement('img');

    img.src = "sand-clock.png";

    overlayDiv.appendChild(img);

    overlayDiv.classList.add('overlay');

    // Remove if tweets are already  checked
    intervalID = setInterval(function() {

        const tweet = document.querySelector('[data-testid="tweet"] [lang]');
        
        const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');

        if (primaryColumn && !primaryColumn.querySelector(".overlay")) {
            
            primaryColumn.appendChild(overlayDiv);
        }

        if (checkCount === 10) {
            clearInterval(intervalID);
            primaryColumn.removeChild(overlayDiv);
        }

        if (primaryColumn && tweet && primaryColumn.querySelector(".overlay") && tweet.classList.contains("checked")) {

            clearInterval(intervalID);
            primaryColumn.removeChild(overlayDiv);
            
            
        }

        checkCount ++;
            
    }, 600);
}
  


if (document.readyState !== 'loading') {

    let intervalID;

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

        // document.getElementById("censoredCount").textContent = request.value;

        // Check if the message is a tab update message
        if (request.message === "TabUpdated") {

            showOverlay();
            
        } 

        let running = false;

        intervalID = setInterval(function() {
            // Listen for message from background.js
            if (!running) {
                
                running = true;
                getTweets();
                running = false;
            
            }
        
        }, 600);
    });

    

}
 

