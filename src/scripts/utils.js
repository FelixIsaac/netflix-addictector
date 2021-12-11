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

        const overDaily = (current_day.minutes_spent || 0) >= daily_limit
        const overWeekly = (weekMinutes || 0) >= weekly_limit;
        
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

function generateQuotes(callback) {
    chrome.storage.sync.get(['enabled_quotes', 'quotes_index'], async ({ enabled_quotes, quotes_index }) => {
        const url = "https://netflix-addictector-api.herokuapp.com/quotes/fromcategories";
        const limit = Math.ceil(30 / enabled_quotes.length) || 1;

        const categories = enabled_quotes.map((category) => ({
            category,
            after: quotes_index[category],
            limit
        }));

        const options = {
            method: 'POST',
            headers: {
                'Accept': 'applcation/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ categories })
        }

        const { quotes, errors } = await (await fetch(url, options)).json();
        const afterOverflowErrors = errors.filter(({ errorCode }) => errorCode === 3);

        if (afterOverflowErrors.length) {
            // no more quotes in the "?after" index, reset index
            afterOverflowErrors.forEach(({ category }) => {
                // assign -limit as later it will add limit
                // which will cancel out and become zero
                quotes_index[category] = -limit;
            });
        }

        // update quotes index
        Object.keys(quotes_index).forEach((category) => {
            quotes_index[category] = quotes_index[category] + limit
        });

        chrome.storage.sync.set({ quotes_index });

        // set local storage quotes, storing 30 quotes
        chrome.storage.local.set({
            quotes: quotes.map((quote) => ({ ...quote, seen: false }))
        }, callback);
    });
}

function getQuote(callback) {
    chrome.storage.sync.get('custom_quotes', async ({ custom_quotes }) => {
        if (custom_quotes.enabled && Math.random() > 0.8 && custom_quotes.quotes.length) {
            const unseenQuotes = custom_quotes.quotes.filter(({ seen }) => !seen);
    
            // mark all as unseen if all is seen
            if (!unseenQuotes.length) {
                custom_quotes.quotes.forEach(quote => {
                    quote.seen = false;
                });
    
                chrome.storage.sync.set({ custom_quotes });
                return getQuote(callback);
            };
    
            const randomIndex = Math.floor(Math.random() * unseenQuotes.length);
            const randomQuote = unseenQuotes[randomIndex];
    
            custom_quotes.quotes[custom_quotes.quotes.findIndex(({ quote }) => quote === randomQuote.quote)].seen = true; // mark quote as seen
            chrome.storage.sync.set({ custom_quotes });
            callback({ ...randomQuote, custom: true });
        } else {
            chrome.storage.local.get(['quotes'], async ({ quotes }) => {
                // generate quotes if none in local storage, else gives a random quote
                if (!quotes || !quotes?.length) return generateQuotes(() => getQuote(callback));
        
                const unseenQuotes = quotes.filter(({ seen }) => !seen);
        
                // regenerates quotes if all is seen
                if (!unseenQuotes.length) return generateQuotes(() => getQuote(callback));
        
                const randomIndex = Math.floor(Math.random() * unseenQuotes.length);
                const randomQuote = unseenQuotes[randomIndex];
        
                quotes[quotes.findIndex(({ quote }) => quote === randomQuote.quote)].seen = true; // mark quote as seen
                chrome.storage.local.set({ quotes });
                callback(randomQuote);
            });
        };
    });
}

function parseQuotes(text) {
    const regex = /(.+)( ?- ?)(.+)|(.+)/gm;
    const quotes = [];
    let m = null;

    while ((m = regex.exec(text)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        
        const newQuote = {
            quote: (m[1] || m[4]).trim(),
            author: m[3]?.trim() || '',
            seen: false
        };

        const isUnique = !quotes.filter(({ quote, author }) => (
            newQuote.quote === quote && newQuote.author === author
        )).length

        if (isUnique) quotes.push(newQuote);
    }

    return [...quotes];
}

function saveQuotes(quotes) {
    if (!(quotes && Array.isArray(quotes))) return;

    chrome.storage.sync.get('custom_quotes', async ({ custom_quotes }) => {
        chrome.storage.sync.set({
            custom_quotes: {
                ...custom_quotes,
                quotes
            }
        })
    })
}
