const profanities = ["bobo", "bwiset", "gago", "kupal", "pakshet", "pakyu", "pucha", "punyeta", "puta", "putangina", 
						"tanga", "tangina", "tarantado", "ulol"];

const profanitiesVariations = ["bobobo", "tanginamo", "putanginamo", "putang ina", "bobong", "punyetang", "gagong", "tangang"];

let censoredCount = 0;


async function predict(text) {
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
	
	if (data == "Model Dabid/test2 is currently loading"){
		console.log("Loading....");
	}
	else {
		label = data["data"][0]["label"]; 
		return await label;
	}
}


function replace(tweet) {
	// Get tweet contents
	var profanityFound = false; // TODO replace variations to original?
	var tweet_content = tweet.innerHTML;
	// Replace profanities in *****
	profanities.forEach(function (profanity, index) {
		// Get the exact match of profane word
		var profane_word = new RegExp(`\\b${profanity}\\b`, "gi");
		// Masking for profane word
		var mask = "";
		for (let i = 0; i < profanity.length; i++) {
			if(tweet.textContent.toLowerCase().indexOf(profanity) !== -1){
				profanityFound = true;
				console.log("Found profanity:", profanity);
			}
			// Add masking of * if character is not space
			if (profanity[i] === " ") {
				mask += " ";
			} else {
				mask += "*";
			}
		}
		// Replace
		tweet_content = tweet_content.replace(profane_word, mask);
	});
	// Replace the main tweet content
	tweet.innerHTML = tweet_content;
	// Check if modification was done on main tweet
	return profanityFound;
}

function censor() {
	// Send count to BG
	if (censoredCount > 0) {
		chrome.runtime.sendMessage({censoredCount: censoredCount}, function(response) {
		});
	}
    // Get all tweets using jquery
	const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    // Loop through tweets
	tweets.forEach(tweet => {
		const textElement = tweet.querySelector('[data-testid="tweet"] [lang]');
		if (textElement && !textElement.classList.contains("censored")) {
            // Get tweet text element
			const tweet_text = textElement.textContent;
            // Apply preddictions to each tweet
			predict(tweet_text).then((response) => {
				console.log(response);
				// Abusive Response
				if (response == "Abusive"){
					console.log("Censoring...", tweet_text);
					// Replace Tweet
					if (replace(tweet)) {
						censoredCount++;
					}
				}
				else if (response == "Model Dabid/test2 is currently loading") {
					// Send loading message
					chrome.runtime.sendMessage({censoringStatus: "Loading"}, function(response) {
					});
				}
			})
            // Add 'censored' class to tweet element to avoid infinite prediction
			textElement.classList.add("censored");
		}
	})
}


// Get Count from BG
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.censoredCount) {
	  var counted = request.censoredCount;
	  document.getElementById("censoredCount").textContent = counted;
	}
	else if (request.censoringStatus) {
		var censoringStatus = request.censoringStatus;
	  document.getElementById("censoredCount").textContent = censoringStatus;
	}
});


// Prediction loop (1 sec interval)
var intervalId = setInterval(function() {
	if (typeof twttr !== 'undefined' && twttr.widgets && twttr.widgets.load) {
		clearInterval(intervalId);
	} else {
		censor();
	}
}, 1000);