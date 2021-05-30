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
