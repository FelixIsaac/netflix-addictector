chrome.runtime.onMessage.addListener(({ method, tabId }, sender, sendResponse) => {
    switch(method.toLowerCase()) {
        case 'time':
            initTimer(tabId);
            sendResponse('Timer initialized at tab', tabId)
            break;
        case 'remove-netflix-screen':
            removeNetflixScreen();
            break;
    }
}); 