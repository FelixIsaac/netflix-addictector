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
   
    updateHTML();
    addListeners();
    blockType.onchange = (e) => blockTypeFormLogic(e.target);
    timeRangeCheck.onchange = (e) => timeRangeFormLogic(e.target);

    resetSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const confirmReset = confirm('Do you really want to reset your settings?');
        
        if (!confirmReset) return;
        chrome.runtime.sendMessage({ type: 'reset-settings' }, (response) => {
            console.log(response);
            location.reload();
        });
    });

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
                    enabled_quotes: [...document.getElementsByClassName('quote-category')].filter(({ checked }) => checked).map(({ dataset }) => dataset.key)
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
                

                chrome.storage.sync.set(saving, () => {
                    updateHTML();
                    alert(message);
                });

                window.onbeforeunload = null;
            }
        });
    });

    function updateHTML() {
        chrome.storage.sync.get(null, (data) => {
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
            timeRangeEnd
        ].forEach((element) => element.onchange = changed);

        function changed() {
            try {
                window.onbeforeunload = () => ""
            } catch (err) {}
        }
    }

    async function renderQuotes() {
        const { quotes: quotesCategories } = await ((await fetch('https://netflix-addictector-api.herokuapp.com/')).json());

        chrome.storage.sync.get('enabled_quotes', ({ enabled_quotes }) => {
            const html = quotesCategories.map((category) => {
                // <div>
                //   <input type="checkbox" class="quote-category" data-key="" id="quotes-category"/>
                //   <label for="quotes-category"></label>
                // </div>
                
                return `<div>
                  <input
                    type="checkbox"
                    class="quote-category"
                    data-key="${category}"
                    id="quotes-category-${category}"
                    ${enabled_quotes.includes(category) ? 'checked' : ''}
                  />
                  <label
                    for="quotes-category-${category}">
                    ${generateName(category)}
                  </label>
                </div>`
            });

            return quotesContainer.innerHTML = html.join('\n');
        });


        function generateName(name) {
            let newName = name.split('.')[0].split('-').map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(' ');
            if (newName === "Quotes") newName = "General Quotes";
            return newName;
        }
    }

    renderQuotes();
});
