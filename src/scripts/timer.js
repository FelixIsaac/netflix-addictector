// timer data
let timer = null;

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
        console.info('Failed to search for a video element, retrying');
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
    console.log('starting timer');
};

/**
 * Stops timer if video is paused
 * @param {HTMLVideoElement} video Video node
 * @returns void
 */
function stopTimer(video) {
    if (!video.paused) return;
    
    // reset timer
    addTime(false);
    clearTimeout(timer);
    timer = null;
    console.log('stopping timer');
};

function setTimer() {
    try {
        if (!timer) timer = setTimeout(addTime, 6000);
    } catch (err) {
        setTimer();
        console.error(err);
        throw err;
    }
};

function addTime(repeats = true) {
    chrome.storage.sync.get('current_day', ({ current_day }) => {
        if (!current_day) current_day = {
            day: Date.now(),
            minutes_spent: 0
        }

        console.log('adding time. current time:', current_day.minutes_spent)

        current_day = {
            ...current_day,
            minutes_spent: current_day.minutes_spent += (1/10) // 6 seconds / 60 seconds (1 minute)
        }

        // set updated current day
        chrome.storage.sync.set({ current_day }, () => {
            console.log('added time');
            timer = null;
            repeats && setTimer();
        })
    });
}