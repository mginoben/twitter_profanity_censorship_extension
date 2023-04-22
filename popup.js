intervalID = setInterval(function() {

  chrome.runtime.sendMessage({popup: "update"}, function(response) {
    // Listen for message from background.js
    document.getElementById("censoredCount").textContent = response.censoredCount;
    document.getElementById("censoredRatio").textContent = response.censoredRatio;
    document.getElementById("feedCensoredCount").textContent = response.feedCensoredCount;
    document.getElementById("feedCensoredRatio").textContent = response.feedCensoredRatio;
  });
  
}, 600);