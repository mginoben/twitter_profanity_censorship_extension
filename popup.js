intervalID = setInterval(function() {

  chrome.runtime.sendMessage({popup: "update"}, function(response) {
    // Listen for message from background.js
    document.getElementById("censoredCount").textContent = response.abusiveCount;
    document.getElementById("censoredRatio").textContent = response.abusiveRatio;
  });
  
}, 600);