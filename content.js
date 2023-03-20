const profanities = ['bobo', 'bwiset', 'gago', 'kupal', 'pakshet', 'pakyu', 'pucha', 
'punyeta', 'puta', 'putangina', 'tanga', 'tangina', 'tarantado',
'ulol']

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
	label = data["data"][0]["label"]; 
	
	return await label;
}



function replace(tweet) {
	// Get tweet contents
	var tweet_content = tweet.innerHTML;
	// Replace profanities in *****
	profanities.forEach(function (profanity, index) {
		var word_pattern = new RegExp(profanity, 'gi');
		tweet_content = tweet_content.replace(word_pattern, "*****");
	});
	// Replace the main tweet content
	tweet.innerHTML = tweet_content;
}


function censor() {
	const tweets = document.querySelectorAll('article[data-testid="tweet"]');

	tweets.forEach(tweet => {
		
		const textElement = tweet.querySelector('[data-testid="tweet"] [lang]');
		
		if (textElement && !textElement.classList.contains("censored")) {

			const tweet_text = textElement.textContent;
			// console.log(predict(tweet_text));
			
			predict(tweet_text).then((response) => {
				if (response == "Abusive"){
					console.log("Censoring...");
					console.log(tweet_text);
					replace(tweet); 
				}
			});

			// if (predict(tweet_text) == "Abusive") {
			// 	console.log("Censoring...");
			// 	console.log(predict(tweet_text));
			// 	replace(tweet); 
			// }

			textElement.classList.add("censored");
		}
		
	});
}

// Loop function every 1 sec
var intervalId = setInterval(function() {
	if (typeof twttr !== 'undefined' && twttr.widgets && twttr.widgets.load) {
	  clearInterval(intervalId);
	} else {
	  censor();
	}
}, 1000);
  
  




