chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.status == 'complete' && tab.url != undefined) {
      chrome.tabs.query({ url: '*://*.netflix.com/*' }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { method: 'time' }, (response) => { 
          console.info(`Timer initialized. Response from content script: ${response || 'No response'}`);
        });
        
        // block netflix if over limit
        checkOverLimit((overLimit, reason) => {
          if (!overLimit) return;

          chrome.tabs.sendMessage(tabs[0].id, { method: 'block-netflix-screen', reason }, (response) => {
            console.info(`Netflix screen block initialized. Response from content script: ${response || 'No response'}`)
          });
        });

        checkInRange((inRange, reason) => {
          if (inRange) return;

          chrome.tabs.sendMessage(tabs[0].id, { method: 'block-netflix-screen', reason }, (response) => {
            console.info(`Netflix time range block initialized. Response from content script: ${response || 'No response'}`)
          });
        });

        showBadge(tabs[0].id);
      });
    }
});

function showBadge(tabId) {
  // showing a badge
  chrome.storage.sync.get('current_day', ({ current_day }) => {
    updateBadge(current_day.minutes_spent);
  });

  // badge auto update
  chrome.storage.onChanged.addListener(({ current_day }) => {
    let minutes_spent = current_day?.newValue?.minutes_spent;
    updateBadge(minutes_spent)
  });

  function updateBadge(minutes_spent) {
    minutes_spent ||= 0;

    chrome.action.setBadgeText({
      text: `${minutes_spent > 99 ? `99+` : minutes_spent.toFixed()}m`,
      tabId
    });

    chrome.action.setBadgeBackgroundColor({
      color: '#b81d24',
      tabId
    });
  }
}