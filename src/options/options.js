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
                const isBlockTypeDaily = reason.includes('daily');
    
                chrome.storage.sync.get(['daily_limit', 'weekly_limit'], ({ daily_limit, weekly_limit }) => {
                    let customMessages = [];
                    const messages = [
                        'When it is no longer exceeding, you can change your daily watch time limit.',
                        'For now, go do something nice to yourself, something meaningful, productive.',
                        'Something like, your a hobby (don\'t have one? that\'s fine, go online and search for one).',
                        'Or try something new, do some exercises, hangout with friends and family, take a shower :)'
                        // insert motivational quote
                    ];
    
                    if (isBlockTypeDaily) {
                        if (daily_limit === dailyLimit.value) return;
                        customMessages.push('Your daily limit has exceeded');
                        dailyLimit.value = daily_limit;
                    } else {
                        if (weekly_limit === weeklyLimit.value) return;
                        customMessages.push('Your weekly limit has exceeded');
                        weeklyLimit.value = weekly_limit;
                    }
                    
                    alert([...customMessages, ...messages].join('\n'));
                    save();
                })
            } else save();

            function save() {
                chrome.storage.sync.set({
                    daily_limit: Number(dailyLimit.value),
                    weekly_limit: Number(weeklyLimit.value),
                    time_range: {
                        enabled: timeRangeCheck.checked,
                        end: timeRangeEnd.value,
                        start: timeRangeStart.value
                    },
                    block_type: blockType.selectedIndex,
                    block_interval: Number(blockInterval.value),
                    block_next_episode_button: blockNextEpisodeBtnCheckbox.checked,
                    block_next_episode: blockNextEpisodeCheckbox.checked,
                }, () => alert('Saved extension settings'));
            }
        });
        
    });

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
});
