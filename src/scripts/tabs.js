chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.status == 'complete' && tab.url != undefined) {
      chrome.tabs.query({ url: '*://*.netflix.com/*' }, (tabs) => {
        // update time data: check if new day by adding time
        chrome.tabs.sendMessage(tabs[0].id, { method: 'update-time' }, console.info);

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

        chrome.tabs.sendMessage(tabs[0].id, { method: 'time', tabId: tabs[0].id }, (response) => { 
          console.info(`Timer initialized. Response from content script: ${response || 'No response'}`);
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
        });
      });
    }
});