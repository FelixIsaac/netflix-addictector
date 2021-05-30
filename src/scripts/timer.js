// timer data
let timer = null;
let timerStartTime = null;

/**
 * Initialize the timer and get everything ready
 */
function initTimer() {
    // attach event listeners to video
    const { video } = window.video;
    if (!video) return window.video.addListener(initTimer, true);

    video.addEventListener('playing', (e => {
        const netflixSource = /(blob:)?http(s)?:\/\/(www\.)?netflix\.com\/(\w*(-)?)*/;
        if (e.isTrusted && e.target.src.match(netflixSource)) startTimer(video);
    }));

    video.addEventListener('pause', (e => {
        const netflixSource = /(blob:)?http(s)?:\/\/(www\.)?netflix\.com\/(\w*(-)?)*/;
        if (e.isTrusted && e.target.src.match(netflixSource)) stopTimer(video);
    }));

    startTimer(video);
};

/**
 * Starts timer if video is not paused
 * @param {HTMLVideoElement} video Video node
 * @returns void
 */
function startTimer(video) {
    if (video.paused) return;

    // start timer
    setTimer(video);
    log('Starting timer');
};

/**
 * Stops timer if video is paused
 * @param {HTMLVideoElement} video Video node
 * @returns void
 */
function stopTimer(video) {
    if (!video.paused || !timer) return;
    
    // reset timer
    addTime(false, (Date.now() - timerStartTime)/60000, video);
    clearTimeout(timer);
    timer = null;
    timerStartTime = null
    log('Stopping timer');
};

function setTimer(video) {
    try {
        if (timer) return;
        
        timerStartTime = Date.now();
        timer = setTimeout(() => addTime(undefined, undefined, video), 6000);
    } catch (err) {
        setTimer(video);
        console.error(err);
        throw err;
    }
};

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
            !video.paused && repeats && setTimer(video);
        });
    });
}
