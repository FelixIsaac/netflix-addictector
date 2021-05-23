chrome.runtime.onMessage.addListener(({ method }) => {
    switch(method.toLowerCase()) {
        case 'time':
            initTimer();
            break;
    }
})