function log(consoleType = console.log, ...args) {
    if (!(chrome && chrome.runtime)) return;
    
    if (typeof consoleType !== 'function') {
        args.unshift(consoleType);
        consoleType = console.log;
    }

    chrome.runtime.sendMessage({
        type: 'background-log',
        consoleType,
        args
    });
};

/**
 * Converts milliseconds to date DD/MM/YYYY format
 * @param {Number} ms Milliseconds
 * @returns {String}
 */
function msToDate(ms) {
    const pad = "0"
    const date = new Date(ms);
    const day = date.getDate();
    const month = date.getMonth() + 1
    const year = date.getFullYear();

    return `${padLeft(day, 2)}/${padLeft(month, 2)}/${year}`;
}

/**
 * Pads a string
 * @param {number|string} nr String to pad
 * @param {number} n Number of paddings
 * @param {string} str Custom padding
 * @returns {string}
 */
function padLeft(nr, n, str){
    return Array(n-String(nr).length+1).join(str||'0')+nr;
}

/**
 * Reset extension settings/options
 */
function resetSettings() {
    chrome.storage.sync.set(initialOptions);
    console.info('Reset extension options across synced Google user data.')
}

/**
 * Populate day entries/records, used for development purposes
 */
function populateData(dayCount = 100) {
    const newDays = Array(dayCount).fill().map((d, i) => ({
        day: Date.now() - (i*8.64e+7),
        minutes_spent: Math.floor(Math.random() * 60) * 1.3
    })).reverse();

    chrome.storage.sync.set({ days: newDays }, () => console.info('Populated data'));
}

/**
 * Checks if user is over daily or weekly limit
 * @param {function} callback
 */
function checkOverLimit(callback) {
    chrome.storage.sync.get(['daily_limit', 'weekly_limit', 'current_day', 'days'], ({
      daily_limit,
      weekly_limit,
      current_day,
      days
    }) => {
        const weekMinutes = [...days.splice(days.length - 6), current_day]
            .map(days => days.minutes_spent)
            .reduce((a, b) => a + b, 0);

        const overDaily = current_day.minutes_spent >= daily_limit
        const overWeekly = weekMinutes >= weekly_limit;
        
        callback(overDaily || overWeekly, `You have exceeded your ${overDaily ? 'daily' : 'weekly'} limit of Netflix`);
    });
}

function checkInRange(callback) {
    chrome.storage.sync.get('time_range', ({ time_range }) => {
        let reason;
        const leftRange = Math.sign(toMin(time_range.end) - toMin()) >= 0 
        const rightRange = Math.sign(toMin(time_range.start) - toMin()) <= 0;
        const inRange = leftRange && rightRange;

        if (!inRange) {
            const date = new Date(`${new Date().toDateString()}, ${leftRange ? time_range.start : time_range.end}`)
                .toLocaleTimeString();

            reason = `It is ${leftRange ? `not ${date} yet` : `past ${date} already :(`}`;
        } 

        callback(!time_range.enabled || inRange, reason);
    });

    function toMin(formattedTime = `${new Date().getHours()}:${new Date().getMinutes()}`) {
        const [hours, minutes] = formattedTime.split(':').map(Number);
        return (hours * 60) + minutes;
    };
}

function addTime(repeats = true, time = 1/10, video) {
    chrome.storage.sync.get('current_day', ({ current_day }) => {
        if (!current_day || msToDate(current_day?.day) !== msToDate(Date.now())) {
            // new day, push current day to day records and set new day object
            if (current_day) {
                chrome.storage.sync.get('days', ({ days }) => {
                    // check if max days
                    if (days.length + 1 >= 140) {
                        // arhieve day array
                        chrome.storage.sync.get(null, data => {
                            const arhieveEntries = Object.keys(data).filter(keyName => keyName.startsWith('days_arhieve_'));
                            const dayArhieveKey =  `days_arhieve_${arhieveEntries.length}`;
                            chrome.storage.sync.set({ [dayArhieveKey]: days });

                               // resets days
                            chrome.storage.sync.set(
                                { days: [current_day] },
                                () => log('New day, created day entry')
                            );
                        });
                    } else {
                        // noraml appending current day to day entries
                        chrome.storage.sync.set(
                            { days: [...days, current_day] },
                            () => log('New day, created day entry')
                        );
                    }
                });
            }

            // day not found
            current_day = {
                day: Date.now(),
                minutes_spent: 0
            }
        };

        current_day = {
            ...current_day,
            minutes_spent: current_day.minutes_spent += time // defaults to 6 seconds / 60 seconds (1 minute)
        }

        // set updated current day
        chrome.storage.sync.set({ current_day }, () => {
            log('Added time. Current minutes spent:', current_day.minutes_spent);
            checkOverLimit((overLimit, reason) => overLimit && blockNetflixScreen(reason));
            checkInRange((inRange, reason) => !inRange && blockNetflixScreen(reason));

            timer = null;
            timerStartTime = null
            repeats && !video?.paused && setTimer(video);
        });
    });
}
