const debugMode = Object.fromEntries(new URLSearchParams(window.location.search).entries()).debug === 'true';

/**
 * Dark theme
 */
chrome.storage.local.get('theme', ({ theme }) => {
    if (!theme) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const newColorScheme = e.matches ? "dark" : "light";
            setTheme(newColorScheme);
        });

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            toggleTheme();
        }
    };

    if (theme === "dark") toggleTheme();
});

// plays netflix intro audio
if (!debugMode) {
    const audio = new Audio('../assets/audio/intro.mp3');
    audio.play();
}

// Remove option page animation
setTimeout(() => {
    document.getElementById('animation-css').remove();
    document.getElementsByClassName('netflix-animation')[0].remove();
    document.getElementsByTagName('main')[0].style.display = 'block';
}, debugMode ? 0 : 2730);

const BlockTypeEnum = Object.freeze({
    FIXED: 0,
    RANDOM: 1,
    BOTH: 2
});

const initOptions = {
    daily_limit: 60, // in minutes
    weekly_limit: 500, // in minutes
    time_range: {
        enabled: true,
        start: '19:00',
        end: '22:00'
    },
    block_type: 0, // enum: FIXED: 0, RANDOM: 0, BOTH: 0
    block_interval: 10, // in minutes
    block_next_episode_button: true, // shows block screen before clicking 'NEXT EPISODE' button
    block_next_episode: true, // show s block screen before an episode starts
    custom_quotes: {
        enabled: false,
        quotes: []
    },
    enabled_quotes: [
        "age-quotes.json",
        "amazing-quotes.json",
        "attitude-quotes.json",
        "binge-quotes.json",
        "business-quotes.json",
        "chance-quotes.json",
        "change-quotes.json",
        "courage-quotes.json",
        "dreams-quotes.json",
        "experience-quotes.json",
        "failure-quotes.json",
        "great-quotes.json",
        "happiness-quotes.json",
        "health-quotes.json",
        "history-quotes.json",
        "inspirational-quotes.json",
        "intelligence-quotes.json",
        "life-quotes.json",
        "morning-quotes.json",
        "motivational-quotes.json",
        "positive-quotes.json",
        "quotes.json",
        "sad-quotes.json",
        "success-quotes.json",
        "sympathy-quotes.json",
        "time-quotes.json",
        "typefitCOM-quotes.json",
        "wisdom-quotes.json",
        "work-quotes.json"
    ], // array of enabled quotes
    quotes_index: {} // key, value object; key representing quote JSON and value is number after index
};

let changedOptions = { ...initOptions };
let loadingQuotes = true;

document.addEventListener('DOMContentLoaded', function () {
    // get page elements
    const dailyLimit = document.getElementById('daily-limit');
    const weeklyLimit = document.getElementById('weekly-limit');
    const blockNextEpisodeBtnCheckbox = document.getElementById('block-next-epi-btn');
    const blockNextEpisodeCheckbox = document.getElementById('block-next-epi');
    const blockType = document.getElementById('block-type');
    const blockTypeDescription = document.querySelector('label[for="block-type"] small')
    const blockInterval = document.getElementById('block-interval');
    const resetSettingsBtn = document.getElementById('reset-settings')
    const saveSettingsBtn = document.getElementById('save-settings');
    const themeTogglerBtn = document.getElementById('theme-toggler')
    const timeRangeCheck = document.getElementById('time-range');
    const timeRangeStart = document.getElementById('time-range-start');
    const timeRangeEnd = document.getElementById('time-range-end');
    const quotesContainer = document.getElementById('quotes-container');
    const regenerateQuotesBtn = document.getElementById('regenerate-quotes');
    const quotesGeneratedSection = document.getElementById('quotes-generated');
    const quotesCustomCheckbox = document.getElementById('quotes-custom-enable');
    const quotesCustomSection = document.getElementById('quotes-custom');
    const [customQuotes] = document.getElementsByTagName('textarea');
    const fancyEditorBtn = document.getElementById('fancy-editor');
    const fancyEditorContainer = document.getElementById('fancy-editor-container');
    const quoteSettings = document.getElementById('quote-settings');
    const [fancyEditorNewQuote, fancyEditorNewQuoteAuthor, fancyEditorAddQuote]
        = document.getElementById("fancy-editor--new-quote").children;

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
                });
            } else save();

            function save(message = 'Saved extension settings') {
                updateData();
                const saving = { ...changedOptions };

                /**
                 * Disrupt saving on errors
                 */
                if (Number(dailyLimit.value) > Number(weeklyLimit.value)) {
                    delete saving.daily_limit;
                    message = 'Saved extension settings except for settings with errors';
                    return;
                }

                if (
                    !changedOptions.enabled_quotes.length
                    && !changedOptions.custom_quotes.enabled
                    && !changedOptions.custom_quotes.quotes.length
                ) {
                    return alert('There are settings with errors. Failed to save settings');
                }

                if (fancyEditorNewQuote.value || fancyEditorNewQuoteAuthor.value) {
                    return alert('You did not save your custom quote')
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
            // Update data
            changedOptions = data;

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

            /**
             * Time range section
             */
            timeRangeCheck.checked = data.time_range.enabled;
            timeRangeStart.value = data.time_range.start;
            timeRangeEnd.value = data.time_range.end;

            /**
             * Quotes
             */
            quotesCustomCheckbox.checked = data.custom_quotes.enabled;

            customQuotes.value = data.custom_quotes.quotes
                ?.map(({ quote, author }) => `${quote}${author ? ` - ${author}` : ''}`)
                ?.join('\n');

            /**
             * Rendering components
             */
            blockTypeFormLogic(blockType);
            timeRangeFormLogic(timeRangeCheck);
            updateThemeBtn(themeTogglerBtn);
            await renderQuotes(data.enabled_quotes);

            onUpdate(addListeners);
            checkErrors();
        });
    }

    function blockTypeFormLogic(target) {
        const { selectedIndex, value } = target;

        const tooltip = [
            'pauses Netflix episode screen every 30 seconds.',
            'pauses Netflix episode screen randomly, without a set interval.',
            'pauses Netflix episode screen every set interval for 30 seconds and at random.'
        ][selectedIndex]


        blockTypeDescription.innerText = `'${value}' type, ${tooltip}`;
        blockInterval.disabled = selectedIndex === BlockTypeEnum['RANDOM'];
    }

    function timeRangeFormLogic(target) {
        const { checked } = target;
        timeRangeStart.disabled = !checked;
        timeRangeEnd.disabled = !checked;
    }

    function showMessage(element, messageString, type, options) {
        const { parentElement } = element;
        const messageClass = `${type.toLowerCase()}-message`;

        // find duplicates
        const duplicates = [...parentElement.children]
            .filter(children => (
                children.className === messageClass
                && children.innerText.toLowerCase() === messageString.toLowerCase()
            ))

        if (duplicates.length) {
            // toggle error if same error message
            duplicates.forEach((duplicate, i) => {
                if (options.disableToggle && i === 0) return;
                duplicate.remove()
            });

            return;
        }

        const error = document.createElement('div');
        const message = document.createElement('p');

        message.appendChild(document.createTextNode(messageString));
        error.className = messageClass;
        error.appendChild(message);

        // only one element or do have
        parentElement.prepend(error);
    }

    function removeMessage(element, messageString) {
        const duplicates = [...element.parentElement.children]
            .filter(children => children.innerText.toLowerCase() === messageString.toLowerCase())

        duplicates.forEach((duplicate) => duplicate.remove());
    }

    function showError(element, errorMessage, disableToggle = false) {
        showMessage(element, errorMessage, 'error', { disableToggle });
    }

    function showWarning(element, warningMessage, disableToggle = false) {
        showMessage(element, warningMessage, 'warning', { disableToggle });
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
            quotesCustomCheckbox,
            ...document.getElementsByClassName('quote-category')
        ].forEach((element) => {
            element.removeEventListener('change', changed);
            element.addEventListener('change', changed)

            element.removeEventListener('input', changed);
            element.addEventListener('input', changed)
        });

        function changed() {
            try {
                updateData();
                checkErrors();
                window.onbeforeunload = () => ""
            } catch (err) { }
        }

        regenerateQuotesBtn.removeEventListener('click', regenerateQuotes);
        regenerateQuotesBtn.addEventListener('click', regenerateQuotes);

        resetSettingsBtn.removeEventListener('click', resetSettingsFunc);
        resetSettingsBtn.addEventListener('click', resetSettingsFunc);

        blockType.removeEventListener('change', ({ target }) => blockTypeFormLogic(target));
        blockType.addEventListener('change', ({ target }) => blockTypeFormLogic(target));

        timeRangeCheck.removeEventListener('change', ({ target }) => timeRangeFormLogic(target));
        timeRangeCheck.addEventListener('change', ({ target }) => timeRangeFormLogic(target));

        quoteSettings.addEventListener('click', (e) => {
            e.preventDefault();
            e.target.remove();
            document.getElementById('quotes').hidden = false;
        })

        document.querySelectorAll('button[data-name="quote-type-toggler"]')
            .forEach((button) => button.addEventListener('click', toggleQuoteTypes));

        customQuotes.onchange = () => {
            changedOptions.custom_quotes.quotes = parseQuotes(customQuotes.value);
        };

        /**
         * Dark mode
         */

        themeTogglerBtn.onclick = function (e) {
            e.preventDefault();
            toggleTheme(themeTogglerBtn);
        }

        /**
         * Custom quotes editor
         */

        fancyEditorBtn.onclick = function (e) {
            e.preventDefault();

            // change UI
            fancyEditorBtn.innerHTML = fancyEditorContainer.hidden ? "Use text editor" : "Use <i>Fancy editor</i>"
            customQuotes.hidden = !customQuotes.hidden;
            fancyEditorContainer.hidden = !fancyEditorContainer.hidden;

            if (fancyEditorContainer.hidden) {
                customQuotes.value = changedOptions.custom_quotes.quotes
                    ?.map(({ quote, author }) => `${quote}${author ? ` - ${author}` : ''}`)
                    ?.join('\n');
            } else {
                // change data from text to fancy
                const quotes = parseQuotes(customQuotes.value);

                changedOptions.custom_quotes.quotes = quotes;
                renderFancyEditor({ quotes })
            }
        }

        fancyEditorAddQuote.onclick = function (e) {
            e.preventDefault();

            const newQuote = fancyEditorNewQuote.value;
            const newQuoteAuthor = fancyEditorNewQuoteAuthor.value;

            if (!newQuote) return;

            changedOptions.custom_quotes.quotes.push({
                quote: newQuote,
                author: newQuoteAuthor
            });

            renderFancyEditor({
                quotes: changedOptions.custom_quotes.quotes
            });

            fancyEditorNewQuote.value = "";
            fancyEditorNewQuoteAuthor.value = "";

            updateData();
            checkErrors();
        }

        if (debugMode) {
            // debug UI
            const parseQuotesBtn = document.getElementById('parse-quotes');
            parseQuotesBtn.hidden = false;

            parseQuotesBtn.onclick = function (e) {
                e.preventDefault();

                const result = parseQuotes(customQuotes.value);
                console.log(result);
            }
        }

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

        function toggleQuoteTypes(e) {
            e.preventDefault();

            quotesGeneratedSection.hidden = !quotesGeneratedSection.hidden;
            quotesCustomSection.hidden = !quotesCustomSection.hidden;
            renderFancyEditor({ quotes: parseQuotes(customQuotes.value) });
        }
    }

    function checkErrors() {
        {
            const message = 'Daily limit cannot exceed weekly limit'

            if (Number(dailyLimit.value) > Number(weeklyLimit.value)) {
                showError(dailyLimit.parentElement, message, true);
            } else {
                removeMessage(dailyLimit.parentElement, message);
            }
        }

        {
            const message = 'It is not recommended to set daily watch time limit to more than 2 hours per day';

            if (Number(dailyLimit.value) >= 120) {
                showWarning(dailyLimit.parentElement, message, true);
            } else {
                removeMessage(dailyLimit.parentElement, message);
            }
        }

        {
            const message = 'It is not recommended to set weekly watch time limit to more than 10 hours per week';

            if (Number(weeklyLimit.value) >= 600) {
                showWarning(weeklyLimit.parentElement, message, true);
            } else {
                removeMessage(weeklyLimit.parentElement, message);
            }
        }

        {
            const warningMessage = [
                'It is not recommended to set more than 15 minutes per Netflix screen block/rest',
                ', as one episode could be as low as 20 minutes'
            ].join('');

            if (Number(blockInterval.value) >= 15) {
                showWarning(blockInterval, warningMessage, true)
            } else {
                removeMessage(blockInterval, warningMessage);
            }
        }

        {
            const message = 'You must have at least 1 generate quote OR custom quote';

            if (
                !changedOptions.enabled_quotes.length
                && !changedOptions.custom_quotes.enabled
                && !changedOptions.custom_quotes.quotes.length
            ) {
                showError(quotesGeneratedSection, message, true)
            } else {
                removeMessage(quotesGeneratedSection, message);
            }
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

    async function renderFancyEditor(custom_quotes) {
        [...fancyEditorContainer.children]
            .filter((child) => child['data-name'] === "fancy-editor-render")
            .forEach((child) => child.remove());

        const quotesToRender = [...custom_quotes.quotes];
        quotesToRender.reverse().forEach((quote) => {
            // <div class="flex-2" style="margin: 14px 0 14px 0;">
            //     <input type="text" style="width: 70%; text-overflow: ellipsis;" placeholder="Quote/Message"/>
            //     <input type="text" style="width: 19%; text-overflow: ellipsis;" placeholder="Author (optional)"/>
            //     <button class="secondary" style="width: 100px">Delete</button>
            // </div>

            const flexDiv = document.createElement('div');
            const quoteInput = document.createElement('input');
            const authorInput = document.createElement('input');
            const actionBtn = document.createElement('button');

            quoteInput.type = "text";
            quoteInput.style = "width: 70%; text-overflow: ellipsis;";
            quoteInput.placeholder = "Quote/Message";
            quoteInput.value = quote.quote;

            quoteInput.removeEventListener('input', actionBtnToEdit);
            quoteInput.addEventListener('input', actionBtnToEdit)

            authorInput.type = "text";
            authorInput.style = "width: 19%; text-overflow: ellipsis;";
            authorInput.placeholder = "Author (optional)";
            authorInput.value = quote?.author;

            authorInput.removeEventListener('input', actionBtnToEdit)
            authorInput.addEventListener('input', actionBtnToEdit)

            actionBtn.style = "width: 100px"
            actionBtnToDelete();

            flexDiv.className = "flex-2";
            flexDiv['data-name'] = "fancy-editor-render"
            flexDiv.style = "margin: 14px 0 14px 0;";
            flexDiv.appendChild(quoteInput);
            flexDiv.appendChild(authorInput);
            flexDiv.appendChild(actionBtn);

            fancyEditorContainer.prepend(flexDiv);

            function actionBtnToEdit() {
                actionBtn.innerText = "EDIT";
                actionBtn.className = "edit"

                actionBtn.onclick = (e) => {
                    e.preventDefault();

                    // save changes
                    const quoteIndex = custom_quotes.quotes.findIndex((quoteToFind) => (
                        quoteToFind.quote === quote.quote && quoteToFind?.author === quote?.author
                    ));

                    custom_quotes.quotes[quoteIndex].quote = quoteInput.value;
                    custom_quotes.quotes[quoteIndex].author = authorInput.value;

                    changedOptions.custom_quotes.quotes = custom_quotes.quotes;

                    // back to delete button
                    actionBtnToDelete();
                    updateData();
                    checkErrors();
                }
            }

            function actionBtnToDelete() {
                actionBtn.className = "secondary"
                actionBtn.innerText = "DELETE";

                actionBtn.onclick = (e) => {
                    e.preventDefault();

                    flexDiv.remove();
                    deleteQuote(quote);
                }
            }
        });

        function deleteQuote(quoteToDelete) {
            const updatedQuotes = changedOptions.custom_quotes.quotes.filter((quote) => (
                quoteToDelete.quote !== quote.quote &&
                quoteToDelete?.author !== quote?.author
            ));

            changedOptions.custom_quotes.quotes = updatedQuotes;
            updateData();
            checkErrors();
        };
    }

    function updateData() {
        changedOptions.daily_limit = Math.max(Number(dailyLimit.value) || 0, 1);
        changedOptions.weekly_limit = Math.max(Number(weeklyLimit.value) || 0, 1);
        changedOptions.block_type = blockType.selectedIndex;
        changedOptions.block_interval = Number(blockInterval.value);
        changedOptions.block_next_episode_button = blockNextEpisodeBtnCheckbox.checked;
        changedOptions.block_next_episode = blockNextEpisodeCheckbox.checked;

        changedOptions.time_range = {
            enabled: timeRangeCheck.checked,
            end: timeRangeEnd.value,
            start: timeRangeStart.value
        },

            changedOptions.custom_quotes.enabled = quotesCustomCheckbox.checked;

        if (!loadingQuotes) {
            changedOptions.enabled_quotes = [...document.getElementsByClassName('quote-category')]
                .filter(({ checked }) => checked)
                .map(({ dataset }) => dataset.key);
        };
    }

    // version shown
    document.querySelector('h1 sup').innerText = `v${chrome.runtime.getManifest().version}`;
});

function toggleTheme(btn) {
    const currentTheme = getTheme();
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme, btn)
}

function getTheme() {
    return document.documentElement.getAttribute("data-theme");
}

function setTheme(newTheme, btn) {
    document.documentElement.setAttribute("data-theme", newTheme);

    // set theme data
    chrome.storage.local.set({ theme: newTheme });

    if (btn) updateThemeBtn(btn);
}

function updateThemeBtn(btn) {
    const currentTheme = getTheme();
    const newBtnName = currentTheme === "dark" ? "Turn on the lights" : "Turn off the lights"
    btn.innerHTML = newBtnName;
}