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
    const blockInterval = document.getElementById('block-interval');
    const resetSettingsBtn = document.getElementById('reset-settings')
    const saveSettingsBtn = document.getElementById('save-settings');
    const timeRangeCheck = document.getElementById('time-range');
    const timeRangeStart = document.getElementById('time-range-start');
    const timeRangeEnd = document.getElementById('time-range-end');

    blockType.onchange = (e) => {
        blockInterval.disabled = e.target.selectedIndex === BlockTypeEnum['RANDOM'];
    };

    timeRangeCheck.onchange = (e) => {
        const { checked } = e.target;
        timeRangeStart.disabled = !checked;
        timeRangeEnd.disabled = !checked;
    }

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
        
        chrome.storage.sync.set({
            daily_limit: Number(dailyLimit.value),
            weekly_limit: Number(weeklyLimit.value),
            time_range: {
                enabled: timeRangeCheck.checked,
                end: Number(timeRangeEnd.value),
                start: Number(timeRangeStart.value)
            },
            block_type: blockType.selectedIndex,
            block_interval: Number(blockInterval.value),
            block_next_episode_button: blockNextEpisodeBtnCheckbox.checked,
            block_next_episode: blockNextEpisodeCheckbox.checked,
        }, () => alert('Saved extension settings'))
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
        blockInterval.disabled = blockType.selectedIndex === BlockTypeEnum['RANDOM'];
        timeRangeCheck.checked = data.time_range.enabled;
        timeRangeStart.value = data.time_range.start;
        timeRangeStart.disabled = !timeRangeStart.value
        timeRangeEnd.value = data.time_range.end;
        timeRangeEnd.disabled = !timeRangeStart.value
    });
});