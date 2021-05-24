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
  chrome.storage.sync.get(initialData, (data) => {
    // Do not override initialized day history data on install
    for (let key of Object.keys(initialData)) {
      if (!data[key]) chrome.storage.sync.set(data[key]);
    }
  });

  // set init settings
  chrome.storage.sync.get(initialOptions, (options) => {
    // Do not override synced options on install
    for (let key of Object.keys(initialOptions)) {
      if (!options[key]) chrome.storage.sync.set(options[key]);
    }
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.status == 'complete' && tab.url != undefined) {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { method: "time" }, (response) => {
        console.info(`Timer initialized. Response from content script: ${response || 'No response'}`);

        // showing a badge
        chrome.storage.onChanged.addListener(({ current_day }) => {
          if (!current_day) return;
          let minutes_spent = current_day.newValue.minutes_spent;

          chrome.action.setBadgeText({
            text: `${minutes_spent > 99 ? `99+` : minutes_spent.toFixed()} m`,
            tabId
          });

          chrome.action.setBadgeBackgroundColor({
            color: '#b81d24',
            tabId
          });
        });
      });

    });
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch(message.type) {
    case 'background-log':
      console[message.consoleType || 'log'](...message.args);
      break;
  }
})

function resetSettings() {
  chrome.storage.sync.set(initialOptions);
  console.info('Reset extension options across synced Google user data.')
}