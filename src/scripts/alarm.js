const BlockTypeEnum = Object.freeze({
    FIXED: 0,
    RANDOM: 1,
    BOTH: 2
});

chrome.alarms.onAlarm.addListener(alarm => {
    switch (alarm.name) {
        case 'netflix-screen-blocker':
            chrome.tabs.query({ url: '*://*.netflix.com/*' }, (tabs) => {
                if (!tabs.length) return;
                chrome.tabs.sendMessage(tabs[0].id, { method: 'remove-netflix-screen' }, callback);

                function callback(response) {
                    console.log(response);
                    // for random alarm   
                    chrome.storage.sync.get('block_type', ({ block_type}) => {
                        if (block_type !== BlockTypeEnum.RANDOM) return;
                    })
                }
            });
            break;
    }
});

// add alarms
// chrome.alarms.get('netflix-screen-blocker', (alarm) => {
//     // prevent duplicates
//     if (alarm) return;

    chrome.storage.sync.get(['block_type', 'block_interval'], ({ block_type, block_interval }) => {
        if (block_type === BlockTypeEnum.RANDOM) return;
        chrome.alarms.create('netflix-screen-blocker', { periodInMinutes: Number(block_interval) });
    });
// })

// update alarms when options are changed