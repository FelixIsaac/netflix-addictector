const BlockTypeEnum = Object.freeze({
    FIXED: 0,
    RANDOM: 1,
    BOTH: 2
});

chrome.alarms.onAlarm.addListener(alarm => {
    switch (alarm.name) {
        case 'netflix-screen-blocker':
            chrome.storage.sync.get('block_type', ({ block_type }) => {
                // for random alarm   
                if (block_type === BlockTypeEnum.RANDOM) return; 

                chrome.tabs.query({ url: '*://*.netflix.com/*' }, (tabs) => {
                    if (!tabs.length) return;
                    chrome.tabs.sendMessage(tabs[0].id, { method: 'remove-netflix-screen' });
                });
            });
            break;
    }
});

// add alarms
function createNetflixScreenAlarm(block_type, block_interval) {
    const queries = []
    if (!block_type) queries.push('block_type');
    if (!block_interval) queries.push('block_interval');
    if (!queries.length) return createAlarm(block_type, block_interval);

    chrome.storage.sync.get(queries, ({
        block_type: _block_type,
        block_interval: _block_interval
    }) => {
        createAlarm(block_type || _block_type, block_interval || _block_interval);
    });

    function createAlarm(block_type, block_interval) {
        console.log(block_type, block_interval)
        if (block_type === BlockTypeEnum.RANDOM || block_type === BlockTypeEnum.BOTH) {
            chrome.alarms.create('random-netflix-screen-blocker', { periodInMinutes: 5 });
        }

        if (block_type === BlockTypeEnum.FIXED || block_type === BlockTypeEnum.BOTH) {
            chrome.alarms.create('netflix-screen-blocker', { periodInMinutes: Number(block_interval) });
        }
    }
};

// update alarms when options are changed
chrome.storage.onChanged.addListener(({ block_type, block_interval }) => {
    if (!(block_type || block_interval)) return;
    
    chrome.storage.sync.get(['block_type', 'block_interval'], ({
        block_type: _block_type,
        block_interval: _block_interval
    }) => {
        const { newValue: blockType } = block_type || { newValue: _block_type };
        const { newValue: blockInterval } = block_interval || { newValue: _block_interval };

        switch(blockType) {
            case BlockTypeEnum.FIXED:
                // remove random alarm, add fixed alarm
                chrome.alarms.clear('random-netflix-screen-blocker');
                break;
            case BlockTypeEnum.RANDOM:
                // remove fixed alarm, add random alarm
                chrome.alarms.clear('netflix-screen-blocker');
                break;
        }

        createNetflixScreenAlarm(blockType, blockInterval);
    });

    // if random block type
    if (block_type?.newValue === BlockTypeEnum.RANDOM) {
        chrome.alarms.create('random-netflix-screen-blocker', { periodInMinutes: 5 });
        return chrome.alarms.clear('netflix-screen-blocker');
    };
    
    // otherwise, not random block type
    chrome.alarms.create('netflix-screen-blocker', { periodInMinutes: Number(block_interval?.newValue) });
});

createNetflixScreenAlarm();