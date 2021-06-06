const initialOptions = Object.freeze({
  daily_limit: 60, // in minutes
  weekly_limit: 500, // in minutes
  time_range: {
    enabled: true,
    start: '19:00',
    end: '22:00'
  },
  block_type: 0, // enum: FIXED: 0, RANDOM: 0, BOTH: 0
  block_interval: 10, // in minutes
  block_next_episode_button: true, // shows block screen before clicking 'NEXT EPISODE' button
  block_next_episode: true, // show s block screen before an episode starts
  enabled_quotes: [
    "age-quotes.json",
    "amazing-quotes.json",
    "attitude-quotes.json",
    "binge-quotes.json",
    "business-quotes.json",
    "chance-quotes.json",
    "change-quotes.json",
    "courage-quotes.json",
    "dreams-quotes.json",
    "experience-quotes.json",
    "failure-quotes.json",
    "great-quotes.json",
    "happiness-quotes.json",
    "health-quotes.json",
    "history-quotes.json",
    "inspirational-quotes.json",
    "intelligence-quotes.json",
    "life-quotes.json",
    "morning-quotes.json",
    "motivational-quotes.json",
    "positive-quotes.json",
    "quotes.json",
    "sad-quotes.json",
    "success-quotes.json",
    "sympathy-quotes.json",
    "time-quotes.json",
    "typefitCOM-quotes.json",
    "wisdom-quotes.json",
    "work-quotes.json"
  ], // array of enabled quotes
  quotes_index: {} // key, value object; key representing quote JSON and value is number after index
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
  chrome.storage.sync.get(Object.keys(initialData), (data) => {
    // Do not override initialized day history data on install
    for (let key in initialData) {
      if (!data[key]) chrome.storage.sync.set({ [key]: initialData[key] });
    }
  });

  // set init settings
  chrome.storage.sync.get(Object.keys(initialOptions), (options) => {
    // Do not override synced options on install
    for (let key in initialOptions) {
      if (!options[key]) chrome.storage.sync.set({ [key]: initialOptions[key] });
    }
  });

  chrome.runtime.setUninstallURL('https://forms.gle/D2fJi82TjC1UtVRv8', () => {});
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch(message.type) {
    case 'background-log':
      console[message.consoleType || 'log'](...message.args);
      break;
    case 'reset-settings':
      sendResponse('Settings reset')
      resetSettings();
      break;
  }
});
