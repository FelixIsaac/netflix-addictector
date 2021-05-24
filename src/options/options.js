// Remove option page animation
setTimeout(() => {
    document.getElementById('animation-css').remove();
    document.getElementsByClassName('netflix-animation')[0].remove();
    document.getElementsByTagName('main')[0].style.display = 'block';
}, 2730);

const initialOptions = Object.freeze({
    daily_limit: 60, // in minutes
    weekly_limit: 500, // in minutes
    block_type: 1, // enum: FIXED: 0, RANDOM: 0, BOTH: 0
    block_interval: 10, // in minutes
    block_next_episode_button: true, // shows block screen before clicking 'NEXT EPISODE' button
    block_next_episode: true, // show s block screen before an episode starts
});

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
    const saveSettingsBtn = document.getElementById('save-settings')

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
    });

    resetSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const confirmReset = confirm('Do you really want to reset your settings?');
        
        if (!confirmReset) return;
        chrome.runtime.sendMessage({ type: 'reset-settings' }, console.log);
    });

    saveSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        chrome.storage.sync.set({
            daily_limit: parseInt(dailyLimit.value),
            weekly_limit: parseInt(weeklyLimit.value),
            block_type: blockType.selectedIndex,
            block_interval: blockInterval.value,
            block_next_episode_button: blockNextEpisodeBtnCheckbox.checked,
            block_next_episode: blockNextEpisodeCheckbox.checked,
        })
    });
});