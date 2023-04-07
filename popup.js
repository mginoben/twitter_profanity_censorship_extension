let counter = 0;


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

	return await data;
}

function hidePopups() {
    var popupHovers = document.getElementsByClassName("popupHover");
	for (var i = popupHovers.length; i--;) {
		popupHovers[i].className = 'popup';
	}
};

function popupHover() {
	var popupElement = document.getElementsByClassName("popup");
	
	for (var i = popupElement.length; i--;) {
		(function () {
			var t;
			popupElement[i].onmouseover = function () {
				hidePopups();
				clearTimeout(t);
				this.className = 'popupHover';
			};
			popupElement[i].onmouseout = function () {
				var self = this;
				t = setTimeout(function () {
					self.className = 'popup';
				}, 1000);
			};
		})();
	}
}

function censor(tweetDiv, matches) {
	// unusual prof > known prof > predict text> Abusive?> Replace All prof
	var tweetContent = tweetDiv.innerHTML;
	// Replace profanities in *****
	for (let i = 0; i < matches.length; i++) {
		// Get the exact match of profane word
		var matchedProfanity = new RegExp(matches[i], "gi");
		// Censored Profanity
		let mask = "";
		for (let j = 0; j < matches[i].length; j++) {
			// Add masking of * if character is not space
			if (matches[i][j] === " ") {
				mask += " ";
			} else {
				mask += "*";
			}
		}
		// Styled Profanity
		mask = '<span class="popup">$&<div>Fck u David</div></span>';
		// mask = '<span class="popup" style="color:red;">$&</span>'
		// Generate a censored tweet
		tweetContent = tweetContent.replace(matchedProfanity, mask);
	}
	// Replace the main tweet content
	tweetDiv.innerHTML = tweetContent;
	counter += 1;
}

function beginCensoring() {
	// Get all tweets using jquery
	const tweets = document.querySelectorAll('article[data-testid="tweet"]');
	// Loop through tweets
	for (let i = 0; i < tweets.length; i++) {
		// Get Tweet Text
		const tweet = tweets[i].querySelector('[data-testid="tweet"] [lang]');
		// Check if Tweet was already predicted
		if (tweet && !tweet.classList.contains("done")) {
			
			const text = tweet.textContent;
			let doneChecking = false;

			// Get Tweet Preds
			predict(text).then((response) => {
				const data = response['data'];
				const label = data[0]['label'];

				if (label == "Model Dabid/test2 is currently loading"){ // LOADING
					chrome.runtime.sendMessage({ status: 'loading' });
					console.log("\n Loading Model. Please Wait\n", text);	
					return;
				}
				else if (label == "No Profanity Found.") { // NO PROFANITY FOUND
					console.log(text, "\n", label);
				}
				else {	// RUNNING
					const matches = Object.keys(data[2]);
					const confidence = data[0]['confidences'][0]['confidence'];
					if (label == "Abusive" && confidence >= 0.75) { // ABUSIVE TWEET
						console.log(text, "\n", data[2], "\n", confidence);
						censor(tweets[i], matches);
					}
				}
				chrome.runtime.sendMessage({ status: 'running' , counter: counter});
				doneChecking = true;
			});

			tweet.classList.add("done");
		}
	}
}

// Prediction loop (1 sec interval)
var intervalId = setInterval(function() {
	if (typeof twttr !== 'undefined' && twttr.widgets && twttr.widgets.load) {
		clearInterval(intervalId);
	} else {
		popupHover();
		beginCensoring();
	}
}, 300); 