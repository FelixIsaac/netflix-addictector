document.addEventListener('DOMContentLoaded', function () {
    const [percentageText] = document.getElementsByClassName('percentage');
    const [percentageCircle] = document.getElementsByClassName('circle');
    const [percentageAboutText] = document.getElementsByClassName('percentage-about');
    const weekHours = document.getElementById('week-hours');
    const monthHours = document.getElementById('month-hours');
    const installationHours = document.getElementById('installation-hours')
    const optionsButton = document.getElementById('options');

    optionsButton.addEventListener('click', () => chrome.runtime.openOptionsPage())

    chrome.storage.sync.get(['daily_limit', 'current_day', 'days'], ({
        daily_limit,
        current_day,
        days
    }) => {
        if (!current_day) {
            current_day = {
                day: Date.now(),
                minutes_spent: 0
            }

            chrome.storage.sync.set(current_day);
        }

        // overview stats
        const currentPercentage = ((current_day.minutes_spent / daily_limit) * 100).toFixed(2);
        percentageText.innerHTML = percentageText.innerHTML.replace('{{minutes_spent}}', parseFloat(current_day.minutes_spent.toFixed(1)));
        percentageAboutText.innerHTML = percentageAboutText.innerHTML.replace('{{time_limit}}', daily_limit);
        percentageCircle.style.strokeDasharray = `${currentPercentage}, 100`

        // hours spent
        weekHours.innerText = [...days.splice(days.length - 6), current_day]
            .map(days => days.minutes_spent/60)
            .reduce((a, b) => a + b, 0)
            .toFixed(1);
            
        monthHours.innerText = [...days.splice(days.length - 29), current_day]
            .map(days => days.minutes_spent/60)
            .reduce((a, b) => a + b, 0)
            .toFixed(1);
        
        installationHours.innerText = [...days, current_day]
            .map(days => days.minutes_spent/60)
            .reduce((a, b) => a + b, 0)
            .toFixed(1);
    })
});
