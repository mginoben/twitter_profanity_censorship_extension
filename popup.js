let toggleState = false;

window.addEventListener('load', function() {

  var censoredCount = document.getElementById("censoredCount");
  var censoredRatio = document.getElementById("censoredRatio");
  var feedCensoredCount = document.getElementById("feedCensoredCount");
  var feedCensoredRatio = document.getElementById("feedCensoredRatio");
  var censoredResult = document.getElementById("censoredResult");
  var feedCensoredResult = document.getElementById("feedCensoredResult");
  var censorToggle = document.getElementById("censorToggle");
  

  chrome.runtime.sendMessage({toggle: "get"}, function(response) {

    censorToggle.checked = response.toggleState;

    censorToggle.addEventListener("change", function() {
      if (this.checked) {
        console.log("Checkbox is checked.");
        chrome.runtime.sendMessage({toggle: true});
      } else {
        console.log("Checkbox is not checked.");
        chrome.runtime.sendMessage({toggle: false});
      }
    });

  });

  


  intervalID = setInterval(function() {

    chrome.runtime.sendMessage({popup: "update"}, function(response) {

      feedCensoredRatio.textContent = response.feedCensoredRatio;
      feedCensoredCount.textContent = response.feedCensoredCount;
      censoredRatio.textContent = response.censoredRatio;
      censoredCount.textContent = response.censoredCount;

      if (response.tweetCount == 1) {
        censoredResult.innerText = 1;
        censoredResult.style.color = "#b4e092";
      }
      else if (response.censoredRatio >= 50 && response.tweetCount >= 10) {
        censoredResult.style.color = "#e69393";
      }
      else {
        censoredResult.style.color = "#b4e092";
      }
    
      if (response.tweetCount == 1) {
        feedCensoredResult.innerText = 1;
        feedCensoredResult.style.color = "#b4e092";
      }
      else if (response.feedCensoredRatio >= 50 && response.feedTweetCount >= 10) {
        feedCensoredResult.style.color = "#e69393";
      }
      else {
        feedCensoredResult.style.color = "#b4e092";
      }

    });

  }, 800);

});









