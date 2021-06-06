chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.status == 'complete' && tab.url != undefined) {
      chrome.tabs.query({ url: '*://*.netflix.com/*' }, (tabs) => {
        // check if new day by adding time
        chrome.tabs.sendMessage(tabs[0].id, { method: 'update-time' });

        chrome.tabs.sendMessage(tabs[0].id, { method: 'time', tabId: tabs[0].id }, (response) => { 
          console.info(`Timer initialized. Response from content script: ${response || 'No response'}`);
        });

        // block netflix if over limit
        checkOverLimit((overLimit, reason) => {
          if (!overLimit) return;

          chrome.tabs.sendMessage(tabs[0].id, { method: 'block-netflix-screen', reason, tabId: tabs[0].id }, (response) => {
            console.info(`Netflix screen block initialized. Response from content script: ${response || 'No response'}`)
          });
        });

        // block netflix if not in range
        checkInRange((inRange, reason) => {
          if (inRange) return;

          chrome.tabs.sendMessage(tabs[0].id, { method: 'block-netflix-screen', reason, tabId: tabs[0].id }, (response) => {
            console.info(`Netflix time range block initialized. Response from content script: ${response || 'No response'}`)
          });
        });

        // block netflix when in next episode
        chrome.storage.sync.get('block_next_episode', ({ block_next_episode }) => {
          if (!block_next_episode) return;

          chrome.tabs.sendMessage(tabs[0].id, {
            method: 'remove-netflix-screen',
            tabId: tabs[0].id,
            seconds: 120, // 2 min
            removing_screen: false
          }, (response) => {
            console.info(`Netflix next episode block initialized. Response from content script: ${response || 'No response'}`)
          })
        })

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
    if (minutes_spent === undefined || minutes_spent === null) return;

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
