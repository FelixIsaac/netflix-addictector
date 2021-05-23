document.addEventListener("DOMContentLoaded", function() { 
    const currentPercentage = 40;
    const [percentageText] = document.getElementsByClassName('percentage');
    const [percentageCircle] = document.getElementsByClassName('circle');
    
    percentageText.innerHTML = percentageText.innerHTML.replace('{{percentage}}', currentPercentage);
    percentageCircle.style.strokeDasharray = `${currentPercentage}, 100`
});

// // Initialize butotn with users's prefered color
// let changeColor = document.getElementById("changeColor");

// chrome.storage.sync.get("color", ({ color }) => {
//   changeColor.style.backgroundColor = color;
// });

// // When the button is clicked, inject setPageBackgroundColor into current page
// changeColor.addEventListener("click", async () => {
//   let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     function: setPageBackgroundColor,
//   });
// });

// // The body of this function will be execuetd as a content script inside the
// // current page
// function setPageBackgroundColor() {
//   chrome.storage.sync.get("color", ({ color }) => {
//     document.body.style.backgroundColor = color;
//   });
// }