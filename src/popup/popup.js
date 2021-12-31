document.addEventListener('DOMContentLoaded', function () {
    const [percentageText] = document.getElementsByClassName('percentage');
    const [percentageCircle] = document.getElementsByClassName('circle');
    const [percentageAboutText] = document.getElementsByClassName('percentage-about');
    const weekHours = document.getElementById('week-hours');
    const monthHours = document.getElementById('month-hours');
    const installationHours = document.getElementById('installation-hours')
    const optionsButton = document.getElementById('options');
    const quoteContent = document.getElementsByTagName('blockquote')[0];
    const quoteAuthor = document.querySelector('section figure figcaption');

    optionsButton.addEventListener('click', () => chrome.runtime.openOptionsPage());
    chrome.storage.onChanged.addListener(updateChanges);

    updatePopup();
    updateQuote();

    setInterval(updateQuote, 30 * 1000); // 30 second interval

    function updatePopup() {
        chrome.storage.sync.get(['daily_limit', 'current_day', 'days'], ({
            daily_limit,
            current_day,
            days
        }) => {
            if (!current_day || msToDate(current_day?.day) !== msToDate(Date.now())) {
                chrome.tabs.query({ active: true }, (tabs) => {
                    tabs.forEach(tab => {
                        console.log(tab)
                        chrome.tabs.sendMessage(tab.id, { method: 'update-time' })
                    });
                });
            }

            // overview stats
            const currentPercentage = ((current_day.minutes_spent / daily_limit) * 100).toFixed(2);
            percentageText.textContent = percentageText.textContent.replace('{{minutes_spent}}', parseFloat(current_day.minutes_spent.toFixed(1)));
            percentageAboutText.children[0].textContent = percentageAboutText.children[0].textContent.replace('{{time_limit}}', daily_limit);
            percentageCircle.style.strokeDasharray = `${currentPercentage}, 100`

            // hours spent
            weekHours.innerText = [...days.splice(days.length - 6), current_day]
                .map(days => days.minutes_spent / 60)
                .reduce((a, b) => a + b, 0)
                .toFixed(1);

            monthHours.innerText = [...days.splice(days.length - 29), current_day]
                .map(days => days.minutes_spent / 60)
                .reduce((a, b) => a + b, 0)
                .toFixed(1);

            installationHours.innerText = [...days, current_day]
                .map(days => days.minutes_spent / 60)
                .reduce((a, b) => a + b, 0)
                .toFixed(1);
        });
    };

    function updateQuote() {
        getQuote(({ quote, author }) => {
            quoteContent.innerText = quoteContent.innerText.replace('{{quote}}', quote);
            quoteAuthor.innerText = quoteAuthor.innerText.replace('{{author}}', author);
        });
    };
});

window.addEventListener('beforeunload', updateChanges)

function updateChanges({ daily_limit, current_day, days }) {
    if (daily_limit || current_day || days) updatePopup();
};