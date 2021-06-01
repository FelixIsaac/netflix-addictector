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

// function add time is in utils.js
