chrome.storage.local.get('removing_screen', ({ removing_screen }) => removing_screen && removeNetflixScreen());

// queue
const netflixScreenBlockers = [] 

function removeNetflixScreen(reason, seconds = 30, removing_screen = true) {
    const { video } = window.video;
    if (!video) return window.video.addListener(() => removeNetflixScreen(reason, seconds, removing_screen), true);

    // adding to queue
    netflixScreenBlockers.push({ reason, seconds, active: false });
    blockScreen();

    function blockScreen() {
        if (!netflixScreenBlockers.length) return;
        if (netflixScreenBlockers.filter(({ active }) => active).length) return;
        netflixScreenBlockers[0].active = true;

        let { reason, seconds } = netflixScreenBlockers[0];
        const wasVideoPlaying = !video.paused;
        const reasons = [
            'Take a break for {{seconds}} seconds, take this time to not think about the show.',
            'Literally, really, take a break, go for a walk, get coffee, exercise, do some push-ups'
        ]

        reason ||= reasons.join('\n').replace('{{seconds}}', seconds);

        // add overlay
        getQuote((quote) => replaceScreen(reason, quote));
        video.pause();

        // hides video controls
        document.getElementById('appMountPoint').style.display = 'none';

        // prevents user from playing video
        const controller = new AbortController();
        const { signal } = controller;
        video.addEventListener('play', preventPlay, { signal });

        // prevents user from refreshing and bypassing
        chrome.storage.local.set({ removing_screen });

        // after set amount of seconds remove overlay, show video controls, and resumes video
        setTimeout(() => {
            controller.abort();
            video.removeEventListener('play', preventPlay);

            chrome.storage.local.set({ removing_screen: false });
            document.getElementById('content-block').remove();
            document.getElementById('appMountPoint').style.display = '';
            if (wasVideoPlaying) video.play();

            // updating the queue
            netflixScreenBlockers.shift();
            if (netflixScreenBlockers.length) blockScreen();
        }, seconds * 1000);

        function preventPlay(e) {
            e.preventDefault();
            video.pause();
        }
    }
}

function blockNetflixScreen(reason = 'You have exceeded your daily limit of Netflix', quote) {
    const { video } = window.video;
    if (!video) return window.video.addListener(() => blockNetflixScreen(reason, quote), true);

    // updates queue and prevent other blockers from running
    netflixScreenBlockers.push({ reason, active: true });
    
    // add overlay and removes video source
    // due to Chrome still playing audio after video element removal
    getQuote((quote) => replaceScreen(reason, quote));
    video.pause();
    video.src = "";

    // remove video and video controls 
    document.getElementById('appMountPoint').style.display = 'none';
    document.getElementsByClassName('sizing-wrapper')[0]?.remove();
}

function replaceScreen(reason, quote) {
    /**
     * ! !IMPORTANT! !
     * When updating blocked.html to JavaScript DOM Objects
     * Make sure that assets are declared in manifest.json
     * and get the resources assets through chrome.runtime.getURL
     * ! !IMPORTANT! !
     */


    const html = buildHTML();

    document.getElementById('content-block')?.remove();
    document.body.prepend(html);
    return html;

    function buildHTML() {
        const contentBlock = document.createElement('div');
        
        contentBlock.id = 'content-block';
        contentBlock.appendChild(prepareStyles());
        contentBlock.appendChild(buildImage());
        contentBlock.appendChild(buildTitle());
        contentBlock.appendChild(buildReason());
        contentBlock.appendChild(buildRemainingMinutes());
        contentBlock.appendChild(buildQuote());
        contentBlock.appendChild(buildAttribute());

        return contentBlock;

        function buildAttribute() {
            const iconAttr = document.createElement('div');
            const iconAttrBody = document.createElement('div');
            const freepikLink = document.createElement('a');
            const iconAttrAuthorLink = document.createElement('a');

            iconAttrAuthorLink.href = 'https://www.flaticon.com/';
            iconAttrAuthorLink.title = 'Flaticon';
            iconAttrAuthorLink.appendChild(document.createTextNode('www.flaticon.com'));

            freepikLink.href = 'https://www.freepik.com';
            freepikLink.title = 'Freepik';
            freepikLink.appendChild(document.createTextNode('Freepik'));

            iconAttrBody.appendChild(document.createTextNode(' Icons made by '));
            iconAttrBody.appendChild(freepikLink);
            iconAttrBody.appendChild(document.createTextNode(' from '));
            iconAttrBody.appendChild(iconAttrAuthorLink);

            iconAttr.className = 'attribute';
            iconAttr.appendChild(iconAttrBody);

            return iconAttr;
        }


        function buildQuote() {
            const quoteSection = document.createElement('section');
            const figure = document.createElement('figure');
            const blockquote = document.createElement('blockquote');
            const figcaption = document.createElement('figcaption');

            blockquote.appendChild(document.createTextNode(quote?.quote || 'Everyone is improving and working on themselves while you\'re not. Think about that.'));
            figcaption.appendChild(document.createTextNode(`\u2014 ${quote?.author || 'Felix Isaac Lim'}`));

            figure.appendChild(blockquote);
            figure.appendChild(figcaption);
            quoteSection.appendChild(figure);

            return quoteSection;
        }

        function buildRemainingMinutes() {
            const p = document.createElement('p');
            const strong = document.createElement('strong');

            chrome.storage.sync.get(['daily_limit', 'current_day'], ({ daily_limit, current_day }) => {
                const remaining_minutes = (daily_limit - current_day?.minutes_spent) || 0;
                if (remaining_minutes <= 0) return;

                strong.appendChild(document.createTextNode(`${remaining_minutes.toFixed(1)} remaining minutes!`));
                p.appendChild(strong);
            });

            return p;
        }

        function buildReason() {
            const p = document.createElement('p');
        
            p.className = 'reason';
            p.appendChild(document.createTextNode(reason));

            return p;
        }

        function buildTitle() {
            const paragraph = document.createElement('p');
            const span = document.createElement('span');

            span.appendChild(document.createTextNode('NO!'));
            paragraph.appendChild(document.createTextNode('Say '));
            paragraph.appendChild(span);
            paragraph.appendChild(document.createTextNode(' to your urges and impulsive watching'));

            return paragraph;
        }

        function buildImage() {
            const image = document.createElement('img');
            const imageContainer = document.createElement('div');

            image.src = chrome.runtime.getURL('/assets/images/no.svg');
            imageContainer.appendChild(image);

            return imageContainer;
        }

        function prepareStyles() {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL('/assets/css/blocked.css');
            
            return link;
        }
    }
}
