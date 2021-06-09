window.video = {
    value: null,
    listeners: [],
    emit(...args) {
        this.listeners.forEach(({ fn, deleteAfterEmit }, index) => {
            fn(...args);

            if (deleteAfterEmit) {
                this.listeners = this.listeners.filter((v, i) => i !== index);
            };
        });
    },
    addListener(fn, deleteAfterEmit) {
        this.listeners.push({ fn, deleteAfterEmit });
    },
    get video() {
        return this.value;
    },
    set video(value) {
        this.value = value;
        this.emit(value, this.value);
    }
}

document.onreadystatechange = () => {
    const observer = new MutationObserver(observe);
    const config = { subtree: true, childList: true };
    observer.observe(document.documentElement, config);

    function observe(mutations) {
        const videoContainer = mutations.filter(mutation => mutation.target.className === 'VideoContainer')[0]?.target;
        const [video] = [...(videoContainer?.children[0]?.children[0]?.children || [])].filter(children => children.tagName === "VIDEO");

        if (!video) return;
        window.video.video = video;
    }
};

chrome.storage.sync.get('block_next_episode_button', ({ block_next_episode_button }) => {
    if (!block_next_episode_button) return;
    
    window.video.addListener(() => {
        addObserver();
        document.getElementsByClassName('button-nfplayerNextEpisode')[0]?.parentElement?.remove();
        document.getElementsByClassName('button-nfplayerEpisodes')[0]?.parentElement?.remove();
    });
    
    function addObserver() {
        const observer = new MutationObserver(observe);
        const config = { attributes: true, attributeFilter: ["style"] };
        observer.observe(document.getElementsByClassName('current-progress')[0], config);
    
        function observe() {
            const nextEpisodeButton = document.querySelector('button[data-uia=next-episode-seamless-button]')
            if (!nextEpisodeButton) return;

            nextEpisodeButton.remove();
            observer.disconnect();
        }
    };
});

chrome.runtime.onMessage.addListener((args, sender, sendResponse) => {
    const { method, tabId, reason, seconds } = args;

    switch(method.toLowerCase()) {
        case 'time':
            initTimer();
            sendResponse(`Timer initialized at tab ${tabId}`)
            break;
        case 'remove-netflix-screen':
            removeNetflixScreen(reason, seconds, args.removing_screen);
            sendResponse(`Removed Netflix screen at tab ${tabId}`)
            break;
        case 'block-netflix-screen':
            blockNetflixScreen(reason);
            sendResponse(`Blocked Netflix screen at tab ${tabId}`)
            break;
        case 'update-time':
            addTime(false, 0);
            sendResponse('Updated time');
            break;
    }
}); 
