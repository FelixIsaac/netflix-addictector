// timer data
let timer = null;
let timerStartTime = null;

/**
 * Initialize the timer and get everything ready
 */
let searchingVideoTimeout;
function initTimer() {
    // attach event listeners to video
    try {
        const video = document.querySelector('video');

        video.addEventListener('playing', (e => {
            const netflixSource = /(blob:)?http(s)?:\/\/(www\.)?netflix\.com\/(\w*(-)?)*/;
            if (e.isTrusted && e.target.src.match(netflixSource)) startTimer(video);
        }));

        video.addEventListener('pause', (e => {
            const netflixSource = /(blob:)?http(s)?:\/\/(www\.)?netflix\.com\/(\w*(-)?)*/;
            if (e.isTrusted && e.target.src.match(netflixSource)) stopTimer(video);
        }));

        startTimer(video);
    } catch (err) {
        log('Failed to search for a video element, retrying');
        if (!searchingVideoTimeout) {
            searchingVideoTimeout = setTimeout(() => {
                searchingVideoTimeout = undefined;
                initTimer();
            }, 250);
        }
    }
};

/**
 * Starts timer if video is not paused
 * @param {HTMLVideoElement} video Video node
 * @returns void
 */
function startTimer(video) {
    if (video.paused) return;

    // start timer
    setTimer();
    log('Starting timer');
};

/**
 * Stops timer if video is paused
 * @param {HTMLVideoElement} video Video node
 * @returns void
 */
function stopTimer(video) {
    if (!video.paused) return;
    
    // reset timer
    log('Timer start time', (Date.now() - timerStartTime)/60000)
    addTime(false, (Date.now() - timerStartTime)/60000);
    clearTimeout(timer);
    timer = null;
    timerStartTime = null
    log('Stopping timer');
};

function setTimer() {
    try {
        if (timer) return;
        
        timerStartTime = Date.now();
        timer = setTimeout(addTime, 6000);
    } catch (err) {
        setTimer();
        console.error(err);
        throw err;
    }
};

function addTime(repeats = true, time = 1/10) {
    chrome.storage.sync.get('current_day', ({ current_day }) => {
        if (!current_day || msToDate(current_day?.day) !== msToDate(Date.now())) {
            // new day, push current day to day records and set new day object
            if (current_day) {
                chrome.storage.sync.get('days', ({ days }) => {
                    chrome.storage.sync.set(
                        { days: [...days, current_day] },
                        () => log('New day, created day entry')
                    );
                });
            }

            // day not found
            current_day = {
                day: Date.now(),
                minutes_spent: 0
            }
        };

        log('Adding time. current time:', current_day.minutes_spent)

        current_day = {
            ...current_day,
            minutes_spent: current_day.minutes_spent += time // defaults to 6 seconds / 60 seconds (1 minute)
        }

        // set updated current day
        chrome.storage.sync.set({ current_day }, () => {
            log('added time');
            timer = null;
            timerStartTime = null
            repeats && setTimer();
        });
    });
}