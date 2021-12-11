const debugMode = Object.fromEntries(new URLSearchParams(window.location.search).entries()).debug === 'true';

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
                    custom_quotes: {
                        enabled: quotesCustomCheckbox.checked,
                        quotes: parseQuotes(customQuotes.value)
                    }
                };

                if (!loadingQuotes) {
                    saving.enabled_quotes = [...document.getElementsByClassName('quote-category')].filter(({ checked }) => checked).map(({ dataset }) => dataset.key)
                };

                if (dailyLimit.value > weeklyLimit.value / 7) {
                    delete saving.daily_limit;
                    message = 'Saved extension settings except for settings with errors';
                    return;
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
            quotesCustomCheckbox.checked = data.custom_quotes.enabled;

            customQuotes.value = data.custom_quotes.quotes
                ?.map(({ quote, author }) => `${quote}${author ? ` - ${author}` : ''}`)
                ?.join('\n');
    
            blockTypeFormLogic(blockType);
            timeRangeFormLogic(timeRangeCheck);
            await renderQuotes(data.enabled_quotes);

            onUpdate(addListeners);
            checkErrors();
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
            customQuotes,
            fancyEditorNewQuote,
            fancyEditorNewQuoteAuthor,
            ...document.getElementsByClassName('quote-category')
        ].forEach((element) => {
            element.removeEventListener('change', changed);
            element.addEventListener('change', changed)

            element.removeEventListener('input', changed);
            element.addEventListener('input', changed)
        });

        function changed() {
            try {
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

        document.querySelectorAll('button[data-name="quote-type-toggler"]')
            .forEach((button) => button.addEventListener('click', toggleQuoteTypes));
        
        themeTogglerBtn.onclick = function(e) {
            e.preventDefault();
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark"
            const newBtnName = currentTheme === "dark" ? "Turn off the lights" : "Turn on the lights"
            
            document.documentElement.setAttribute("data-theme", newTheme);
            themeTogglerBtn.innerHTML = newBtnName;
        }

        fancyEditorBtn.onclick = function (e) {
            e.preventDefault();

            // change UI
            fancyEditorBtn.innerHTML = fancyEditorContainer.hidden ? "Switch back to text editor" : "Switch to <i>Fancy editor</i>"
            customQuotes.hidden = !customQuotes.hidden;
            fancyEditorContainer.hidden = !fancyEditorContainer.hidden;

            if (fancyEditorContainer.hidden) {
                chrome.storage.sync.get('custom_quotes', ({ custom_quotes }) => {
                    customQuotes.value = custom_quotes.quotes
                        ?.map(({ quote, author }) => `${quote}${author ? ` - ${author}` : ''}`)
                        ?.join('\n');
                })
            } else {
                // change data from text to fancy
                const quotes = parseQuotes(customQuotes.value);
        
                chrome.storage.sync.set({
                    custom_quotes: { quotes }
                });
        
                renderFancyEditor({ quotes })
            }
        }

        fancyEditorAddQuote.onclick = function (e) {
            e.preventDefault();

            // change data from text to fancy
            const quotes = parseQuotes(customQuotes.value);
            
            quotes.push({
                quote: fancyEditorNewQuote.value,
                author: fancyEditorNewQuoteAuthor.value
            })
        
            chrome.storage.sync.set({
                custom_quotes: { quotes }
            });
        
            renderFancyEditor({ quotes });

            fancyEditorNewQuote.value = "";
            fancyEditorNewQuoteAuthor.value = "";
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
        }
    }

    function checkErrors() {
        {
            const message = 'Daily limit (multiplied by 7) cannot exceed weekly limit'

            if (dailyLimit.value > weeklyLimit.value / 7) {
                showError(dailyLimit, message, true);
            } else {
                removeMessage(dailyLimit, message);
            }
        }

        {
            const message = 'It is not recommended to set daily watch time limit to more than 2 hours per day';

            if (Number(dailyLimit.value) >= 120) {
                showWarning(dailyLimit, message, true);
            } else {
                removeMessage(dailyLimit, message);
            }
        }

        {
            const message = 'It is not recommended to set weekly watch time limit to more than 10 hours per week';
           
            if (Number(weeklyLimit.value) >= 600) {
                showWarning(weeklyLimit, message, true);
            } else {
                removeMessage(weeklyLimit, message);
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
        
        custom_quotes.quotes.reverse().forEach((quote) => {
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

                    chrome.storage.sync.set({ custom_quotes });

                    // back to delete button
                    actionBtnToDelete();
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
            const updatedQuotes = custom_quotes.quotes.filter((quote) => (
                quoteToDelete.quote !== quote.quote &&
                quoteToDelete?.author !== quote?.author
            ));

            chrome.storage.sync.set({
                custom_quotes: {
                    ...custom_quotes,
                    quotes: updatedQuotes
                }
            })
        }
    }

    // version shown
    document.querySelector('h1 sup').innerText = `v${chrome.runtime.getManifest().version}`;
});