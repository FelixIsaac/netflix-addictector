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

        observer.disconnect();
        window.video.video = video;
    }
};

chrome.runtime.onMessage.addListener(({ method, tabId }, sender, sendResponse) => {
    switch(method.toLowerCase()) {
        case 'time':
            initTimer(tabId);
            sendResponse(`Timer initialized at tab ${tabId}`)
            break;
        case 'remove-netflix-screen':
            removeNetflixScreen();
            sendResponse(`Removed Netflix screen at tab ${tabId}`)
            break;
        case 'block-netflix-screen':
            blockNetflixScreen(reason);
            sendResponse(`Blocked Netflix screen at tab ${tabId}`)
            break;
    }
}); 