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