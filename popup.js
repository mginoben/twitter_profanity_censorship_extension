// const profanities = ["bobo", "bwiset", "gago", "kupal", "pakshet", "pakyu", "pucha", "punyeta", "puta", "putangina", 
// 						"tanga", "tangina", "tarantado", "ulol"];
const profanities = {
	"bobo": ["bobong bobo", "bobobo", "ambobo", "napakabobo", "pakabobo", "pinakabobo", "bobong"],
	"bwiset": ["bwesit", "bweset", "buwisit", "bwesit", "buwesit", "buwiset", "nakakabwiset", "nakakabuwisit"],
	"gago": ["gagong gago", "gaga", "gagang", "gagago", "pakagago", "napakagago", "pinakagago", "gagong"],
	"kupal": ["kakupalan", "pinakakupal", "kukupal", "pakakupal"],
	"pakshet": ["pakingshet"],
	"pakyu": [],
	"pucha": ["putsa", "puchang", "ampucha"],
	"punyeta": ["nyeta", "punyetang", "punyemas", "ampunyeta", "napakapunyeta", "pinakapunyeta"],
	"putangina": ["amputangina", "putanginang", "putang ina", "pukingina", "napakaputangina", "pakaputangina"],
	"puta": ["putang", "amputa", "napakaputa", "pakaputa"],
	"tanga": ["tangang tanga", "antanga", "tatangatanga", "pakatanga", "pinakatanga", "napakatanga", "tangang"],
	"tangina": ["tanginang", "kinangina", "kingina", "pinakatangina"],
	"tarantado": ["tarantadong"]
}

let censoringStatus = "paused";

let censoredCount = 0;


function getProfanityList() {
	var allProfanities = [];
	// Get base profanities
	const baseProfanities = Object.keys(profanities);
	// Loop through variations using base profanity
	baseProfanities.forEach((baseProfanity) => {
		allProfanities.push(baseProfanity);
		profanities[baseProfanity].forEach((profanityVariation) => {
			allProfanities.push(profanityVariation);
		})
	})

	return allProfanities;
}

// Transforms profanity variations to base profanity
function convertProfanities(text) {
	const baseProfanities = Object.keys(profanities);
	// Loop through variations using base profanity
	baseProfanities.forEach((baseProfanity) => {
		profanities[baseProfanity].forEach((profanityVariation) => {
			var profanityPattern = new RegExp(`\\b${profanityVariation}\\b`, "gi");
			text = text.replace(profanityPattern, baseProfanity);
		})
	})
	return text;
}

async function predict(text) {

	const response = await fetch("https://mginoben-tagalog-profanity-censorship.hf.space/run/predict", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				data: [
					convertProfanities(text),
				]
		})
	});

	const data = await response.json();
	return await data;
}


function replace(tweet) {
	// unusual prof > known prof > predict text> Abusive?> Replace All prof
	var hasProfanity = false;
	var foundProfanities = [];
	var tweetContent = tweet.innerHTML;
	// Replace profanities in *****
	getProfanityList().forEach((profanity) => {
		// Get the exact match of profane word
		var profaneWord = new RegExp(`\\b${profanity}\\b`, "gi");
		// Masking for profane word
		var mask = "";
		for (let i = 0; i < profanity.length; i++) {
			// Add masking of * if character is not space
			if (profanity[i] === " ") {
				mask += " ";
			} else {
				mask += "*";
			}
		}
		// Replace
		var modifiedTweetContent = tweetContent.replace(profaneWord, mask);
		// Check if modification was done on main tweet
		if (tweetContent !== modifiedTweetContent){
			tweetContent = modifiedTweetContent;
			hasProfanity = true;
			foundProfanities.push(profanity);
		}
	});
	
	// Replace the main tweet content
	tweet.innerHTML = tweetContent;
	
	return {
		hasProfanity: hasProfanity,
		foundProfanities: foundProfanities
	};
}

function censor(censoringStatus) {
	if (censoringStatus == "ongoing" || censoringStatus == "loading"){
		// Send count to BG
		if (censoredCount > 0) {
			chrome.runtime.sendMessage({censoredCount: censoredCount});
		}
		// Get all tweets using jquery
		const tweets = document.querySelectorAll('article[data-testid="tweet"]');
		// Loop through tweets
		tweets.forEach(tweet => {
			const textElement = tweet.querySelector('[data-testid="tweet"] [lang]');
			if (textElement && !textElement.classList.contains("censored")) {
				// Get tweet text element
				const tweetText = textElement.textContent;
				// Apply preddictions to each tweet
				predict(tweetText).then((response) => {
					var result = response["data"][0]; 
					// Loading Model
					if (result["label"] == "Model Dabid/test2 is currently loading") {
						chrome.runtime.sendMessage({censoringStatus: "loading"}, function(response) {
							console.log("loading")
						});
					}
					// Predicting
					else {
						if (result["label"] == "Abusive"){
							console.log("\n\nCensoring...", tweetText.toLowerCase());
							// Replace Tweet
							const newTweet = replace(tweet);
							if (newTweet.hasProfanity) {
								console.log("Found profanities: " + newTweet.foundProfanities);
								var confidence = result["confidences"][0]["confidence"] * 100;
								console.log("Confidence: " + confidence.toFixed(2) +"%\n\n");
								censoredCount++;
							}
							else{
								console.log("No profanities found.\n\n");
							}
						}
					}
					
					
				})
				// Add 'censored' class to tweet element to avoid infinite prediction
				textElement.classList.add("censored");
			}
		})
	}
	else {
		chrome.runtime.sendMessage({censoringStatus: "paused"}, function(response) {
		});
	}
	
}


// Get Count from BG
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.censoredCount) {
		censoredCount = request.censoredCount;
		document.getElementById("censoredCount").textContent = censoredCount;
	}
	else if (request.censoringStatus) {
		censoringStatus = request.censoringStatus;
	  	document.getElementById("censoredCount").textContent = censoringStatus;
	}
});


// Prediction loop (1 sec interval)
var intervalId = setInterval(function() {
	if (typeof twttr !== 'undefined' && twttr.widgets && twttr.widgets.load) {
		clearInterval(intervalId);
	} else {
		censor("ongoing");
	}
}, 1000);