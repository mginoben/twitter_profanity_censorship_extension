const profanities = ['bobo', 'bwiset', 'gago', 'kupal', 'pakshet', 'pakyu', 'pucha', 
'punyeta', 'puta', 'putangina', 'putang ina', 'tanga', 'tangina', 'tarantado', 'bobong',
'ulol']
var censor_count = 0;

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
		
		if ("error" in data) {
			console.log("Loading model please wait...");
			predict(text);
		}
		else {
			label = data["data"][0]["label"]; 
			return await label;
		}
	}
	catch(err){
		console.log("Cannot reach model...")
		return "error_model";
	}
}



function replace(tweet) {
	// Get tweet contents
	var tweet_content = tweet.innerHTML;
	// Replace profanities in *****
	profanities.forEach(function (profanity, index) {
		// Get the exact match of profane word
		var profane_word = new RegExp(`\\b${profanity}\\b`, "gi");
		// Masking for profane word
		var mask = "";
		for (let i = 0; i < profanity.length; i++) {
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
}


function censor() {
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
				if (response == "Abusive"){
					console.log("Censoring..." + tweet_text);
					replace(tweet); 
					censor_count += 1;
				}
			});
            // Add 'censored' class to tweet element to avoid infinite prediction
			textElement.classList.add("censored");
		}
	});
}


// Prediction loop (1 sec interval)
var intervalId = setInterval(function() {
	if (typeof twttr !== 'undefined' && twttr.widgets && twttr.widgets.load) {
		clearInterval(intervalId);
	} else {
		censor();
		// window.onload = function what(){
		// 	document.getElementById("censored-count") = censor_count;
		// };
	}
}, 1000);