document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get('daily_limit', ({ daily_limit }) => {
        const currentPercentage = 0;
        const [percentageText] = document.getElementsByClassName('percentage');
        const [percentageCircle] = document.getElementsByClassName('circle');
        
        percentageText.innerHTML = percentageText.innerHTML.replace('{{percentage}}', currentPercentage);
        percentageCircle.style.strokeDasharray = `${currentPercentage}, 100`
    })
});