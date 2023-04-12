async function predict(text) {

    try {
        const response = await fetch("https://mginoben-tagalog-profanity-censorship.hf.space/run/predict", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				data: [
					text,
				]
            })
        });

        const data = await response.json();

        return await data;
    } catch (error) {
        console.log("Can't reach model.");
    }
	
}

function hidePopups() {
    var popups = document.getElementsByClassName("popup");
	for (var i = popups.length; i--;) {
		if (!popups[i].classList.contains("popup-hidden")) {
			popups[i].classList.add("popup-hidden");
		}
	}
};


function popup(tweet, checkState) {

    if (tweet.classList.contains("hasPopup")) {
        return;
    }

    const content = tweet.querySelector('[data-testid="tweet"] [lang]').textContent;
    const author = tweet.querySelector('[data-testid="User-Name"]').innerText.split(/\r?\n/)[1];
    const unCensoredTweet = { content, author };
    
	const popup = document.createElement('div');
	popup.classList.add("popup", "popup-hidden");

    var checkbox = document.createElement('input');   
    checkbox.type = 'checkbox';
    checkbox.classList.add("censorToggle");

	popup.appendChild(checkbox);
    tweetParent = tweet.querySelector('[data-testid="tweet"] [lang]').parentNode;
    tweetParent.appendChild(popup)

    var checkbox = tweet.querySelector(".censorToggle");
    checkbox.checked = checkState;
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            chrome.runtime.sendMessage({ 
                uncensor: "append",
                data: unCensoredTweet
            });
        } else {
            chrome.runtime.sendMessage({ 
                uncensor: "remove",
                data: unCensoredTweet
            });
        }
    });

    tweet.onmouseover = function () {
        var popup = this.parentNode.querySelector(".popup");
        hidePopups();
        popup.classList.remove("popup-hidden");
        
    };
    tweet.onmouseout = function () {
        var popup = this.parentNode.querySelector(".popup");
        popup.classList.add("popup-hidden");

    };

    tweet.classList.add("hasPopup");
}


function uncensor(tweet) {
    var censoredTweets = tweet.querySelectorAll(".censored");
    for (let i = 0; i < censoredTweets.length; i++) {
        if (censoredTweets[i].classList.contains("censored")) {
            censoredTweets[i].classList.remove("censored");
        }  
    }
}


function censor(tweet, matches) {
    var tweetHTML = tweet.innerHTML;
	
	for (let i = 0; i < matches.length; i++) {
		var matchedProfanity = new RegExp(matches[i], "gi");
		mask = '<span class="censored">$&</span>';
		tweetHTML = tweetHTML.replace(matchedProfanity, mask);
	}

	tweet.innerHTML = tweetHTML;
}


function toggleButton() {
    chrome.runtime.sendMessage({toggle: "get"}, function(response) {
        let currentStatus = response.toggleStatus;
        let toggleButton = document.querySelector("#toggleButton");
        let currentStatusText = document.querySelector("#currentStatus");

        if (currentStatus == "on") {
            toggleButton.textContent = "Off";
            currentStatusText.textContent = "Currently Censoring";
            toggleButton.style.backgroundColor = "#c75b52";
        } else {
            currentStatusText.textContent = "Not Censoring";
            toggleButton.textContent = "On";
            toggleButton.style.backgroundColor = "#72dba0";
        }

        // Add an event listener to the toggle button
        toggleButton.addEventListener("click", function() {
            // Toggle the button text and background color
            if (toggleButton.textContent === "Off") {
                chrome.runtime.sendMessage({ toggle: "off" });
                currentStatusText.textContent = "Not Censoring";
                toggleButton.textContent = "On";
                toggleButton.style.backgroundColor = "#72dba0";
            } else {
                chrome.runtime.sendMessage({ toggle: "on" });
                toggleButton.textContent = "Off";
                currentStatusText.textContent = "Currently Censoring";
                toggleButton.style.backgroundColor = "#c75b52";
            }
        });
    });
    // Get a reference to the toggle button element
    

    
}


function monitor() {
       
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    
    chrome.runtime.sendMessage({action: "getTweets"}, function(response) {  
        var abusiveTweets = response.abusiveContents;
        var uncensoredTweets = response.uncensoredContents;

        for (let i = 0; i < tweets.length; i++) {

            var tweet = tweets[i].querySelector('[data-testid="tweet"] [lang]');

            if (!tweet) {
                continue;
            }

            const content = tweet.textContent;
            const author = tweets[i].querySelector('[data-testid="User-Name"]').innerText.split(/\r?\n/)[1];
            let foundAbusiveTweet = false;  
            let foundUncensoredTweet = false;
            let uncensoredTweetProfanities;

            for(var j = 0; j < uncensoredTweets.length; j++) {
                if (uncensoredTweets[j].content == content && uncensoredTweets[j].author == author) { // CHECK U-LIST
                    foundUncensoredTweet = true;
                    break;
                }
            }

            for(var k = 0; k < abusiveTweets.length; k++) {
                if (abusiveTweets[k].content == content && abusiveTweets[k].author == author) { // CHECK A-LIST
                    foundAbusiveTweet = true;
                    uncensoredTweetProfanities = abusiveTweets[k].matches;
                    break;
                }
            }

            if (foundUncensoredTweet) { // IN U-LIST
                uncensor(tweet);
                popup(tweets[i], true);
                continue;
            }
            else if (foundAbusiveTweet) { // IN A-LIST
                censor(tweet, uncensoredTweetProfanities);
                popup(tweets[i], false);
                continue;
            }

            if (!tweet.classList.contains("done")) {
  
                // console.log("ABUSIVE TWEETS:", foundAbusiveTweet);
                // console.log("UNCENSORED TWEETS:", foundUncensoredTweet);
             
                predict(content).then((response) => { // NOT IN A-LIST

                    const data = response['data'];
                    const label = data[0]['label'];
                    // console.log(data);

                    if (label == "Model Dabid/test2 is currently loading"){ // LOADING
                        chrome.runtime.sendMessage({ status: 'loading' });	
                        return;
                    }
                    else if (label == "Abusive") { // ABUSIVE TWEET
                        const matches = Object.keys(data[2]);
                        const extractedTweet = { content, matches, author };
                    
                        chrome.runtime.sendMessage({ // APPEND TO A-LIST
                            action: "append",
                            data: extractedTweet
                        });
                    }
                    
                    chrome.runtime.sendMessage({ status: 'running' });
                    
                }); 

                tweet.classList.add("done");
          
            }
        }
    });
    
}

toggleButton();


var intervalId = setInterval(function() {
    chrome.runtime.sendMessage({toggle: "get"}, function(response) {
        let currentStatus = response.toggleStatus;
        if (currentStatus == "on") {
            monitor();
        }
    });
}, 100);
    

    

