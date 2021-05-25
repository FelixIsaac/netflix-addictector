const initialOptions = Object.freeze({
    daily_limit: 60, // in minutes
    weekly_limit: 500, // in minutes
    block_type: 0, // enum: FIXED: 0, RANDOM: 0, BOTH: 0
    block_interval: 10, // in minutes
    block_next_episode_button: true, // shows block screen before clicking 'NEXT EPISODE' button
    block_next_episode: true, // show s block screen before an episode starts
  });
  
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
        if (!data[key]) chrome.storage.sync.set({ [key]: data[key]});
      }
    });
  
    // set init settings
    chrome.storage.sync.get(initialOptions, (options) => {
      // Do not override synced options on install
      for (let key of Object.keys(initialOptions)) {
        if (!options[key]) chrome.storage.sync.set({ [key]: options[key] });
      }
    });
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch(message.type) {
      case 'background-log':
        console[message.consoleType || 'log'](...message.args);
        break;
      case 'reset-settings':
        sendResponse('Settings reset')
        resetSettings();
    }
  });
  