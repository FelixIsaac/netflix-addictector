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
    chrome.storage.onChanged.addListener(({ daily_limit, current_day, days }) => (daily_limit || current_day || days) && updatePopup());
    
    updatePopup();
    updateQuote();

    setInterval(updateQuote, 30 * 1000); // 30 second interval

    function updatePopup() {
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
        });
    };

    function getQuote(callback) {
        chrome.storage.local.get('quotes', async ({ quotes }) => {
            if (!quotes) {
                const { quotes } = await (await fetch('https://netflix-addictector-api.herokuapp.com/quotes')).json();
                return chrome.storage.local.set({ quotes }, () => getQuote(callback));
            }

            return callback(quotes[Math.floor(Math.random() * quotes.length - 1)]);
        });
    }

    function updateQuote() {
        getQuote(({ quote, author }) => {
            quoteContent.innerText = quoteContent.innerText.replace('{{quote}}', quote);
            quoteAuthor.innerText = quoteAuthor.innerText.replace('{{author}}', author);
        });
    }
});

// check if new day by adding time
chrome.tabs.query({ url: '*://*.netflix.com/*' }, (tabs) => {
    if (!tabs.length) return;
    chrome.tabs.sendMessage(tabs[0].id, { method: 'update-time' });
});
