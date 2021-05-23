const initialOptions = Object.freeze({
  daily_limit: 60, // in minutes
  weekly_limit: 500, // in minutes
  block_type: 1, // enum: FIXED: 1, RANDOM: 2, BOTH: 3
  block_next_episode_button: true, // shows block screen before clicking 'NEXT EPISODE' button
  block_next_episode: true, // show s block screen before an episode starts
})

const initialData = {
  current_day: {
    day: null,
    minutes_spent: 0
  },
  days: [], // Array of objects, each object with two fields (day, minutes_spent)
}

chrome.runtime.onInstalled.addListener(() => {
  // set init data
  chrome.storage.sync.get('days', ({ days }) => !days && chrome.storage.sync.set(initialData));
  resetSettings();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.status == 'complete' && tab.url != undefined) {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { method: "time" }, (response) => {
        console.info(`Timer initialized. Response from content script: ${response || 'No response'}`);
      });
    });
  }
});

function resetSettings() {
  chrome.storage.sync.set(initialOptions);
  console.info('Reset extension options across synced Google user data.')
}