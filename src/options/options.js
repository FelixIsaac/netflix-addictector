// Remove option page animation
setTimeout(() => {
    document.getElementById('animation-css').remove();
    document.getElementsByClassName('netflix-animation')[0].remove();
    document.getElementsByTagName('main')[0].style.display = 'block';
}, 2730);

const BlockTypeEnum = Object.freeze({
    FIXED: 0,
    RANDOM: 1,
    BOTH: 2
});

let loadingQuotes = true;

document.addEventListener('DOMContentLoaded', function () {
    // get page elements
    const dailyLimit = document.getElementById('daily-limit');
    const weeklyLimit = document.getElementById('weekly-limit');
    const blockNextEpisodeBtnCheckbox = document.getElementById('block-next-epi-btn');
    const blockNextEpisodeCheckbox = document.getElementById('block-next-epi');
    const blockType = document.getElementById('block-type');
    const blockTypeToolTip = document.querySelector('label[for="block-type"] .tooltip-toggle');
    const blockInterval = document.getElementById('block-interval');
    const resetSettingsBtn = document.getElementById('reset-settings')
    const saveSettingsBtn = document.getElementById('save-settings');
    const timeRangeCheck = document.getElementById('time-range');
    const timeRangeStart = document.getElementById('time-range-start');
    const timeRangeEnd = document.getElementById('time-range-end');
    const quotesContainer = document.getElementById('quotes-container');
    const regenerateQuotesBtn = document.getElementById('regenerate-quotes');
   
    updateHTML(addListeners);

    saveSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();

        checkOverLimit((overLimit, reason) => {
            // prevents user from increasing limit when limit is reached
            if (overLimit) {
                
                chrome.storage.sync.get(['daily_limit', 'weekly_limit'], ({ daily_limit, weekly_limit }) => {
                    if (daily_limit === Number(dailyLimit?.value) && weekly_limit === Number(weeklyLimit?.value)) return save();
                    let customMessages = [];
                    const isBlockTypeDaily = reason.includes('daily');
                    const messages = [
                        'When it is no longer exceeding, you can change your daily watch time limit.',
                        'For now, go do something nice to yourself, something meaningful, productive.',
                        'Something like, your a hobby (don\'t have one? that\'s fine, go online and search for one).',
                        'Or try something new, do some exercises, hangout with friends and family, take a shower :)'
                        // insert motivational quote
                    ];

                    
                    if (isBlockTypeDaily) {
                        customMessages.push('Your daily limit has exceeded');
                        dailyLimit.value = daily_limit;
                    } else {
                        customMessages.push('Your weekly limit has exceeded');
                        weeklyLimit.value = weekly_limit;
                    }
                    
                    alert([...customMessages, ...messages].join('\n\n'));
                    save('Reverted watch time limit changes and saved other extension settings');
                })
            } else save();

            function save(message = 'Saved extension settings') {
                const saving = {
                    daily_limit: Math.max(Number(dailyLimit.value) || 0, 1),
                    weekly_limit: Math.max(Number(weeklyLimit.value) || 0, 1),
                    time_range: {
                        enabled: timeRangeCheck.checked,
                        end: timeRangeEnd.value,
                        start: timeRangeStart.value
                    },
                    block_type: blockType.selectedIndex,
                    block_interval: Number(blockInterval.value),
                    block_next_episode_button: blockNextEpisodeBtnCheckbox.checked,
                    block_next_episode: blockNextEpisodeCheckbox.checked,
                };

                if (!loadingQuotes) {
                    saving.enabled_quotes = [...document.getElementsByClassName('quote-category')].filter(({ checked }) => checked).map(({ dataset }) => dataset.key)
                };

                if (Math.sign(Number(weeklyLimit.value) - (Number(dailyLimit.value) * 7)) === -1) {
                    delete saving.daily_limit;
                    showError(dailyLimit, 'Daily limit (multiplied by 7) cannot exceed weekly limit');
                    message = 'Saved extension settings except for settings with errors';
                }

                if (Number(dailyLimit.value) >= 120) {
                    showWarning(dailyLimit, 'It is not recommended to set daily watch time limit to more than 2 hours per day')
                }

                if (Number(weeklyLimit.value) >= 600) {
                    showWarning(weeklyLimit, 'It is not recommended to set weekly watch time limit to more than 10 hours per week')
                }

                if (Number(blockInterval.value) >= 15) {
                    const warningMessage = [
                        'It is not recommended to set more than 15 minutes per Netflix screen block/rest',
                        ', as one episode could be as low as 20 minutes'
                    ].join('');

                    showWarning(blockInterval, warningMessage)
                }
                

                chrome.storage.sync.get(null, (data) => {
                    // keep unset settings
                    chrome.storage.sync.set({ ...data, ...saving }, () => {
                        alert(message + ', refreshing page...');
                        window.onbeforeunload = null;
                        location.reload();
                    });
                })
            }
        });
    });

    function updateHTML(onUpdate) {
        chrome.storage.sync.get(null, async (data) => {
            /**
             * Limit watch time section
             */
            dailyLimit.value = data.daily_limit;
            weeklyLimit.value = data.weekly_limit;
    
            /**
             * Screen block section
             */
            blockNextEpisodeBtnCheckbox.checked = data.block_next_episode_button;
            blockNextEpisodeCheckbox.checked = data.block_next_episode;
            blockType.selectedIndex = data.block_type;
            blockInterval.value = data.block_interval;
            timeRangeCheck.checked = data.time_range.enabled;
            timeRangeStart.value = data.time_range.start;
            timeRangeEnd.value = data.time_range.end;
    
            blockTypeFormLogic(blockType);
            timeRangeFormLogic(timeRangeCheck);
            await renderQuotes(data.enabled_quotes);

            onUpdate(addListeners);
        });
    }

    function blockTypeFormLogic(target) {
        const { selectedIndex, value } = target;
    
        const tooltip = [
            'blocks Netflix episode screen every set interval for 30 seconds.',
            'blocks Netflix episode screen randomly, without a set interval',
            'blocks Netflix episode screen every set interval for 30 seconds and at random'
        ][selectedIndex]
    
    
        blockTypeToolTip.setAttribute('aria-label', `'${value}' type, ${tooltip}`);
        blockInterval.disabled = selectedIndex === BlockTypeEnum['RANDOM'];
    }

    function timeRangeFormLogic(target) {
        const { checked } = target;
        timeRangeStart.disabled = !checked;
        timeRangeEnd.disabled = !checked;
    }

    function showError(element, errorMessage) {
        const { parentElement } = element;
        const errorMessages = [...parentElement.children].filter(children => children.className === 'error-message');
       
        if (errorMessages.length > 1) errorMessages.slice(1).forEach(e => e.remove());
        if (errorMessages[0]) return errorMessages[0].children[0].innerText = errorMessage;
        
        // only one element or do have
        parentElement.insertAdjacentHTML('afterbegin', `<div class="error-message"><p>${errorMessage}</p></div>`)
    }

    function showWarning(element, warningMessage) {
        const { parentElement } = element;
        const warningMessages = [...parentElement.children].filter(children => children.className === 'warning-message');
       
        if (warningMessages.length > 1) warningMessages.slice(1).forEach(e => e.remove());
        if (warningMessages[0]) return warningMessages[0].children[0].innerText = warningMessage;
        
        // only one element or do have
        parentElement.insertAdjacentHTML('afterbegin', `<div class="warning-message"><p>${warningMessage}</p></div>`)
    }

    function addListeners() {
        [
            dailyLimit,
            weeklyLimit,
            blockNextEpisodeBtnCheckbox,
            blockNextEpisodeCheckbox,
            blockType, 
            blockInterval,
            timeRangeCheck, 
            timeRangeStart,
            timeRangeEnd,
            ...document.getElementsByClassName('quote-category')
        ].forEach((element) => {
            element.removeEventListener('change', changed);
            element.addEventListener('change', changed)
        });

        function changed() {
            try {
                window.onbeforeunload = () => ""
            } catch (err) {}
        }

        regenerateQuotesBtn.removeEventListener('click', regenerateQuotes);
        regenerateQuotesBtn.addEventListener('click', regenerateQuotes);

        resetSettingsBtn.removeEventListener('click', resetSettingsFunc);
        resetSettingsBtn.addEventListener('click', resetSettingsFunc);

        blockType.removeEventListener('change', ({ target }) => lockTypeFormLogic(target));
        blockType.addEventListener('change', ({ target }) => lockTypeFormLogic(target));
        
        timeRangeCheck.removeEventListener('change', ({ target }) => timeRangeFormLogic(target));
        timeRangeCheck.addEventListener('change', ({ target }) => timeRangeFormLogic(target));

        function regenerateQuotes(e, confirmed = false) {
            e?.preventDefault();

            // ask user and alert unsaved changes
            if (window.onbeforeunload && e && !confirmed) {
                regenerateQuotes(undefined, confirm('You have may unsaved quotes settings changes, continue?'));
                return;
            }

            // user clicked 'Cancel'
            if (!confirmed && !e) return;

            generateQuotes(() => alert('Regenerated quotes based on enabled quotes'));
            alert('Regenerating quotes...');
        }

        function resetSettingsFunc(e) {
            e.preventDefault();
            const confirmReset = confirm('Do you really want to reset your settings?');
            
            if (!confirmReset) return;
            chrome.runtime.sendMessage({ type: 'reset-settings' }, () => {
                window.onbeforeunload = null;
                location.reload()
            });
        }
    }

    async function renderQuotes(enabled_quotes) {
        const { quotes: quotesCategories } = await (await fetch('https://netflix-addictector-api.herokuapp.com/'))?.json();

        if (!quotesCategories) return renderQuotes();

        // remove children of quotes container
        quotesContainer.textContent = '';

        quotesCategories.forEach((category) => {
            // <div>
            //   <input type="checkbox" class="quote-category" data-key="" id="quotes-category"/>
            //   <label for="quotes-category"></label>
            // </div>
            
            const quoteContainer = document.createElement('div');
            const input = document.createElement('input');
            const label = document.createElement('label');

            label.htmlFor = `quotes-category-${category}`;
            label.appendChild(document.createTextNode(generateName(category)));

            input.type = 'checkbox';
            input.className = 'quote-category';
            input.setAttribute('data-key', category);
            input.id = `quotes-category-${category}`;
            input.checked = enabled_quotes.includes(category);

            quoteContainer.appendChild(input);
            quoteContainer.appendChild(label);
            quotesContainer.appendChild(quoteContainer);
            return;
        });

        loadingQuotes = false; 

        function generateName(name) {
            let newName = name.split('.')[0].split('-').map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(' ');
            if (newName === "Quotes") newName = "General Quotes";
            return newName;
        };
    }
});
