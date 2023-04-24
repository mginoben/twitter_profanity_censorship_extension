
window.addEventListener('load', function() {

  var censoredCount = document.getElementById("censoredCount");
  var censoredRatio = document.getElementById("censoredRatio");
  var feedCensoredCount = document.getElementById("feedCensoredCount");
  var feedCensoredRatio = document.getElementById("feedCensoredRatio");
  var censoredResult = document.getElementById("censoredResult");
  var feedCensoredResult = document.getElementById("feedCensoredResult");

  

  intervalID = setInterval(function() {

    chrome.runtime.sendMessage({popup: "update"}, function(response) {

      feedCensoredRatio.textContent = response.feedCensoredRatio;
      feedCensoredCount.textContent = response.feedCensoredCount;
      censoredRatio.textContent = response.censoredRatio;
      censoredCount.textContent = response.censoredCount;
    
      if (response.censoredRatio >= 50 && response.tweetCount >= 10) {
        censoredResult.style.color = "#e69393";
      }
      else {
        censoredResult.style.color = "#b4e092";
      }
    
      if (response.feedCensoredRatio >= 50 && response.feedTweetCount >= 10) {
        feedCensoredResult.style.color = "#e69393";
      }
      else {
        feedCensoredResult.style.color = "#b4e092";
      }

    });

  }, 600);




});


// window.addEventListener('load', function() {
  
//   chrome.runtime.onConnect.addListener(function(port) {
//     if (port.name === "popupScript") {
//       port.postMessage("ready");
//       port.onMessage.addListener(function(msg) {
//         console.log(msg);
//       });
//     }
//   });
  
//   chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
//     if (message.currentTab) {
//       console.log("GEGERERE");
//     }
//   });
// });

// // Listen for messages sent from the background script
// window.addEventListener("message", function(event) {
//   if (event.source == window && event.data.message) {
//     console.log(event.data.message);
//   }
// });








