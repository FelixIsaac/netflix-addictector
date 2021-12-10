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

const observer = new MutationObserver(observe);
const config = { subtree: true, childList: true };
observer.observe(document.documentElement, config);

function observe(mutations) {
    const videoContainer = mutations.filter(mutation => mutation.target.className === 'watch-video')[0]?.target;
    const video = videoContainer?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0];

    if (!video) return;
    window.video.video = video;
}

chrome.storage.sync.get('block_next_episode_button', ({ block_next_episode_button }) => {
    if (!block_next_episode_button) return;
    
    window.video.addListener(() => {
        addObserver();
        removeControls();
    });
    
    function addObserver() {
        const observer = new MutationObserver(observe);
        const config = { attributes: true, attributeFilter: ["style"], subtree: true, childList: true };
        
        observer.observe(document.querySelector('div[data-uia="player"]'), config);

        function observe(mutations) {
            mutations.some((mutation) => {
                if (!mutation.addedNodes.length) return false;
                
                return Array.from(mutation.addedNodes).some((addedNode) => {
                    return Array.from(addedNode.children).some((children) => {
                        const classes = Array.from(children.classList);
                        const controls = classes.includes("watch-video--bottom-controls-container");

                        if (controls) removeControls();
                        return controls;
                    });
                })
            })

            const nextEpisodeButton = document.querySelector('button[data-uia="next-episode-seamless-button"]')
            console.log('next episode button', nextEpisodeButton);
            if (!nextEpisodeButton) return;

            nextEpisodeButton.remove();
        }
    };

    function removeControls() {
        document.querySelector('button[data-uia="control-episodes"]')?.parentElement?.remove();
        document.querySelector('button[data-uia="control-next"]')?.parentElement?.remove();
        document.querySelector('button[data-uia="next-episode-seamless-button"]')?.remove();
    }
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
