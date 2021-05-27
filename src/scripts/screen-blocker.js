chrome.storage.local.get('removing_screen', ({ removing_screen }) => removing_screen && removeNetflixScreen());

function removeNetflixScreen(reason, seconds = 30) {
    const { video } = window.video;
    if (!video) return window.video.addListener(() => removeNetflixScreen(reason, seconds), true);

    const wasVideoPlaying = !video.paused;
    reason ||= 'Take a break for 30 seconds, take this time to not think about the show.\nLiterally take a break, go for a walk, get coffee';

    // add overlay and pauses video
    replaceScreen(reason);
    video.pause();

    // hides video controls
    document.getElementById('appMountPoint').style.display = 'none';

    // prevents user from playing video
    const controller = new AbortController();
    const { signal } = controller;
    video.addEventListener('play', preventPlay, { signal });

    // prevents user from refreshing and bypassing
    chrome.storage.local.set({ removing_screen: true });

    // after set amount of seconds remove overlay, show video controls, and resumes video
    setTimeout(() => {
        chrome.storage.local.set({ removing_screen: false });
        document.getElementById('content-block').remove();
        document.getElementById('appMountPoint').style.display = '';
        controller.abort();
        if (wasVideoPlaying) video.play();
    }, seconds * 1000);

    function preventPlay(e) {
        e.preventDefault();
        video.pause();
    }
}

function blockNetflixScreen(reason = 'You have exceeded your daily limit of Netflix') {
    const { video } = window.video;
    if (!video) return window.video.addListener(() => blockNetflixScreen(reason), true);

    // add overlay and removes video source
    // due to Chrome still playing audio after video element removal
    replaceScreen(reason);
    video.src = "";

    // remove video and video controls 
    document.getElementById('appMountPoint').style.display = 'none';
    document.getElementsByClassName('sizing-wrapper')[0].remove();
}

function replaceScreen(reason) {
    const html = `
    <div id="content-block">
        <style>
            #content-block {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                background-color: #141414;
                color: #f5f5f1
            }

            #content-block svg {
                width: 400px;
                height: 400px;
            }

            #content-block p {
                font-size: 3rem;
            }

            #content-block p span {
                color: #e50914;
            }

            #content-block .reason {
                font-size: 2rem;
            }

            #content-block .attribute {
                margin-top: 4rem;
            }
        </style>
        <div>
            <svg enable-background="new 0 0 511.812 511.812" viewBox="0 0 511.812 511.812" xmlns="http://www.w3.org/2000/svg"><g><g id="_x3C_Group_x3E__5_"><path d="m479.066 169.663 14.527-14.675c14.543-14.543 14.543-38.121 0-52.664l-84.106-84.106c-14.543-14.543-38.121-14.543-52.664 0l-81.766 81.766c-10.526 10.526-27.591 10.526-38.116 0l-38.536-38.536-24.894-24.894-18.336-18.336c-14.543-14.543-38.121-14.543-52.664 0l-69.86 69.862-3.736 9.643c-14.543 14.543-14.543 38.121 0 52.664l19.87 20.386 61.415 61.403c10.386 10.384.554 32.065-9.802 42.479l-53.457 53.757-22.111 23.608c-14.543 14.543-14.543 38.121 0 52.664l77.719 81.355c14.543 14.543 38.121 14.543 52.664 0l20.853-13.524 60.876-60.876c10.526-10.526 33.958-20.289 44.484-9.764l58.33 58.33c27.486 27.486 65.682 37.249 93.168 9.764l7.362-7.362 53.308-53.308c14.543-14.543 14.543-38.121 0-52.664l-13.47-13.697-66.373-66.032c-11.694-11.634-11.698-30.559-.009-42.198z" fill="#e27f86"/><g fill="#df646e"><path d="m434.88 468.012-1.96 1.96-17.36 17.36-6.07 6.07c-14.55 14.55-38.12 14.55-52.67 0l-81.76-81.76c-9.04-9.04-22.89-10.31-33.29-3.83l1.02-1.02 25.15-25.15c10.53-10.53 27.59-10.53 38.12 0l81.76 81.76c12.8 12.8 32.58 14.33 47.06 4.61z"/><path d="m180.57 468.012-25.39 25.39c-14.55 14.55-38.12 14.55-52.67 0l-84.1-84.1c-14.55-14.55-14.55-38.12 0-52.67l14.71-14.32 13.79-13.87 2.1-2.11c-14.54 14.54-14.15 38.42.4 52.97l84.1 84.1c12.8 12.8 32.58 14.33 47.06 4.61z"/><path d="m131.4 244.652-31 30c.32-.32.64-.66.94-.99 9.4-10.46 9.07-26.57-1-36.64l-61.41-61.4-20.52-20.63c-14.55-14.55-14.55-38.12 0-52.67l8.28-8.28 7.21-7.21c-2.06 11.59 1.38 23.96 10.33 32.92l25.7 25.87 61.41 61.4c10.39 10.39 10.41 27.22.06 37.63z"/></g><g><path d="m294.39 344.258c-20.583 0-40.614-8.671-56.284-24.34-15.181-15.181-22.298-33.151-22.298-54.621s6.606-40.325 21.787-55.507c1.84-1.84 3.722-4.9 5.702-6.536 14.359-11.868 32.234-18.325 51.101-18.325 21.47 0 41.655 8.361 56.836 23.542 29.38 29.38 31.216 76.034 5.509 107.574-1.714 2.103-5.53 4.127-7.489 6.086-15.668 15.67-34.28 22.127-54.864 22.127zm.009-118.855c-10.658 0-20.678 4.151-28.216 11.687-7.537 7.537-11.687 17.557-11.687 28.216 0 10.658 4.15 20.679 11.687 28.216 15.559 15.557 40.873 15.559 56.432 0 15.558-15.558 15.558-40.874 0-56.432-7.537-7.536-17.557-11.687-28.216-11.687z" fill="#faf063"/></g><g><path d="m309.399 330.647c-20.583 0-41.166-7.835-56.835-23.504-15.181-15.181-23.543-35.366-23.543-56.836 0-17.891 5.825-34.879 16.545-48.833-2.791 2.144-5.472 4.467-8.003 6.997-15.181 15.182-23.543 35.366-23.543 56.836s8.361 41.655 23.543 56.836c15.669 15.67 36.252 23.504 56.835 23.504 20.584 0 41.167-7.835 56.836-23.504 2.543-2.544 4.858-5.228 6.989-8.01-14.352 10.994-31.582 16.514-48.824 16.514z" fill="#f8e837"/></g><g><g><path d="m79.085 344.307c-10.966-.39-18.766-8.692-18.766-19.665l-.596-119.106c0-8.248 4.271-15.309 11.872-18.511 2.508-1.056 5.132-2.121 7.705-2.146 6.594-.064 12.961 3.108 16.85 8.738l41.256 59.74c1.681 2.434 6.878 2.051 6.85-.907l-1.085-47.362c-.108-11.176 8.118-20.325 19.294-20.432.066-.001.134-.001.2-.001 11.086 0 20.125 8.931 20.232 20.041l1.124 116.228c.001.065.001.13.001.196 0 10.428-6.04 19.053-15.389 21.973-9.061 2.832-17.809-1.904-23.462-10.069l-40.511-56.511c-1.672-2.422-4.924.202-4.924 3.145v45.515c-.001 11.422-9.138 19.543-20.651 19.134z" fill="#faf063"/></g></g><g fill="#f5de46"><path d="m154.201 277.106c2.83 4.002 9.13 1.966 9.082-2.935l-.859-88.828c-.001-.145.039-.543.04-.687-11.165.12-20.148 9.518-20.04 20.687l.45 46.535c.003 1.297-1.124 2.343-2.058 2.621-1.157.328-2.554.072-3.325-1.026z"/><path d="m98.76 325.652c-10.966-.39-19.5-9.736-19.5-20.709v-119.086c0-.236.032-.743.04-.978-2.568.026-5.184.544-7.687 1.599-7.602 3.202-12.352 10.717-12.352 19.379v119.087c0 10.973 8.533 20.319 19.5 20.709 11.442.407 20.849-8.692 20.964-20.016-.322.003-.639.027-.965.015z"/><path d="m179.581 326.877c-7.032 2.855-15.114.182-19.448-6.048l-51.304-73.704c-2.797-4.018-9.104-2.039-9.104 2.856v29.933c.031-1.237.776-2.335 1.882-2.779 1.258-.505 2.752-.073 3.598 1.074 12.942 18.741 25.884 37.481 38.825 56.222 5.654 8.165 15.542 11.75 24.603 8.918 14.559-4.856 15.216-19.107 15.216-19.107s-1.453 1.492-4.268 2.635z"/></g><g><path d="m452.739 348.628c0 2.703-.447 5.301-1.27 7.725-3.216 9.465-18.968 15.309-22.724 15.309-13.255 0-23.234-12.426-23.234-23.035 0-5.136 6.038-19.514 15.503-22.73 2.424-.824 5.022-1.27 7.725-1.27 13.255.001 24 10.746 24 24.001z" fill="#faf063"/><g><g><g><path d="m428.101 291.183c-13.255 0-19.526-18.266-19.526-31.521l-.511-94.979c0-10.552 3.486-21.203 12.95-24.418 2.424-.824 5.022-1.27 7.725-1.27 13.255 0 24 10.745 24 24v107.633c0 2.703-.447 5.301-1.27 7.725-3.216 9.465-12.817 12.83-23.368 12.83z" fill="#faf063"/></g></g></g></g><g fill="#f5de46"><path d="m443.739 357.628c-13.255 0-24-10.745-24-24 0-2.703.453-5.298 1.277-7.723-9.464 3.216-16.277 12.171-16.277 22.723 0 13.255 10.745 24 24 24 10.552 0 19.507-6.813 22.723-16.277-2.424.824-5.02 1.277-7.723 1.277z"/><path d="m419.739 262.117v-114.122c0-2.703.453-5.298 1.277-7.723-9.464 3.216-16.277 12.171-16.277 22.723v107.109c0 13.226 10.477 24.362 23.702 24.522 10.681.13 19.774-6.722 23.02-16.275-8.138 2.765-31.567 2.078-31.722-16.234z"/></g></g><g><path d="m485.471 337.679c-2.903-2.953-7.651-2.992-10.606-.089-2.953 2.904-2.993 7.653-.089 10.606l13.515 13.742c10.845 10.405 11.922 30.541-.001 42.057l-53.308 53.308c-2.929 2.929-2.929 7.678 0 10.606 2.346 2.163 6.712 3.401 10.607 0l53.307-53.308c16.763-15.989 17.653-46.329.045-63.226z"/><path d="m410.259 482.027-6.075 6.074c-5.616 5.617-13.085 8.71-21.028 8.71s-15.411-3.093-21.027-8.71l-81.767-81.766c-13.434-13.432-35.29-13.431-48.723 0l-81.766 81.766c-5.617 5.617-13.085 8.71-21.028 8.71-7.944 0-15.412-3.093-21.029-8.71l-53.797-53.797c-2.929-2.929-7.678-2.929-10.606 0-2.929 2.929-2.929 7.678 0 10.606l53.797 53.797c8.45 8.45 19.685 13.104 31.635 13.104s23.185-4.654 31.635-13.104l81.766-81.766c7.584-7.584 19.926-7.584 27.51 0l81.766 81.766c8.45 8.45 19.685 13.104 31.635 13.104s23.186-4.654 31.635-13.104l6.074-6.074c2.93-2.929 2.93-7.678.001-10.607-2.93-2.927-7.679-2.927-10.608.001z"/><path d="m27.887 336.936-14.783 14.396c-8.45 8.45-13.104 19.685-13.104 31.635s4.654 23.185 13.104 31.635l5.5 5.5c1.464 1.464 3.384 2.197 5.303 2.197s3.839-.732 5.303-2.197c2.929-2.929 2.929-7.678 0-10.606l-5.5-5.5c-5.617-5.617-8.71-13.085-8.71-21.028 0-7.944 3.093-15.412 8.64-20.958l14.712-14.326c2.967-2.89 3.031-7.638.141-10.606-2.89-2.97-7.639-3.031-10.606-.142z"/><path d="m33.61 180.91c1.466 1.474 3.392 2.211 5.318 2.211 1.913 0 3.826-.727 5.289-2.182 2.937-2.921 2.95-7.67.029-10.606l-20.536-20.648c-10.846-10.405-11.923-30.541 0-42.057l84.105-84.105c10.405-10.846 30.541-11.923 42.057 0l18.336 18.336c2.929 2.929 7.678 2.929 10.606 0 2.929-2.929 2.929-7.678 0-10.606l-18.336-18.336c-16.028-16.774-46.326-17.662-63.27 0l-84.104 84.104c-16.77 16.016-17.658 46.327-.015 63.255z"/><path d="m231.639 105.288c13.431 13.433 35.288 13.433 48.724 0l81.766-81.766c10.403-10.846 30.541-11.923 42.056 0l84.106 84.105c10.852 10.429 11.928 30.539-.027 42.084l-14.526 14.675c-2.914 2.944-2.89 7.692.054 10.606 2.365 2.157 6.718 3.365 10.606-.054l14.5-14.648c16.774-16.028 17.661-46.326 0-63.27l-84.105-84.105c-16.03-16.774-46.326-17.662-63.271 0l-81.765 81.765c-7.585 7.585-19.926 7.585-27.511 0l-38.536-38.536c-2.929-2.929-7.678-2.929-10.606 0-2.929 2.929-2.929 7.678 0 10.606z"/><path d="m237.48 322.55c-2.637 3.194-2.187 7.921 1.008 10.559 15.647 12.922 35.504 20.038 55.911 20.038 23.497 0 45.565-9.127 62.14-25.701 34.263-34.264 34.263-90.015 0-124.278-16.598-16.598-38.666-25.739-62.14-25.739s-45.542 9.141-62.139 25.739c-16.598 16.598-25.739 38.666-25.739 62.139 0 13.296 2.875 26.045 8.543 37.893 1.788 3.736 6.266 5.317 10.003 3.528 3.736-1.788 5.316-6.266 3.528-10.003-4.694-9.81-7.074-20.381-7.074-31.418 0-19.467 7.581-37.768 21.346-51.533 13.764-13.765 32.065-21.345 51.532-21.345s37.769 7.581 51.532 21.345c28.415 28.415 28.415 74.649 0 103.065-13.74 13.74-32.041 21.308-51.532 21.308-16.93 0-33.394-5.897-46.36-16.604-3.193-2.638-7.922-2.186-10.559 1.007z"/><path d="m294.4 312.687c12.139 0 24.277-4.621 33.519-13.861 18.482-18.482 18.482-48.556-.001-67.039-8.953-8.954-20.857-13.884-33.519-13.884s-24.565 4.931-33.52 13.884c-8.953 8.953-13.884 20.857-13.884 33.52 0 12.662 4.931 24.566 13.885 33.52 9.242 9.24 21.381 13.86 33.52 13.86zm-22.914-70.293c6.121-6.12 14.259-9.491 22.913-9.491s16.792 3.371 22.912 9.491c12.635 12.634 12.635 33.191 0 45.826-12.633 12.631-33.191 12.633-45.824 0-6.121-6.12-9.491-14.257-9.491-22.913s3.37-16.793 9.49-22.913z"/><path d="m162.392 177.412c-15.293.147-27.616 12.71-27.468 28.004l.308 31.851-32.911-47.657c-7.425-10.75-21.563-14.867-33.62-9.789-10.291 4.335-16.941 14.555-16.941 26.036v119.086c0 15.028 11.992 27.68 26.733 28.205 14.183.878 29.099-11.876 28.742-27.719v-30.723l29.44 43.903c6.98 10.453 21.001 15.703 33.068 11.899 12.06-3.612 20.766-15.646 20.651-29.328l.001-116.3c-.146-15.146-12.587-27.469-27.732-27.469zm13.004 27.539-.001 116.228c.227 6.292-3.901 13.09-10.125 15.01-5.899 1.846-12.392-.563-16.171-5.988l-37.666-56.17c-.019-.028-.038-.056-.058-.084-2.625-3.802-7.351-5.434-11.765-4.058-4.411 1.375-7.375 5.404-7.375 10.024v45.515c-.045 5.785-5.019 12.93-13.209 12.729-6.764-.241-12.266-6.168-12.266-13.214v-119.086c0-5.348 3.12-10.256 7.764-12.212 5.542-2.333 12.044-.448 15.454 4.49l41.255 59.741c2.639 3.821 7.387 5.445 11.813 4.042 4.427-1.404 7.371-5.467 7.326-10.11l-.45-46.535c-.068-7.023 5.591-12.792 12.613-12.86h.127c6.956-.003 12.668 5.656 12.734 12.538z"/><path d="m460.239 348.628c0-17.369-14.131-31.5-31.5-31.5s-31.5 14.131-31.5 31.5 14.131 31.5 31.5 31.5 31.5-14.131 31.5-31.5zm-31.5 16.5c-9.098 0-16.5-7.402-16.5-16.5s7.402-16.5 16.5-16.5 16.5 7.402 16.5 16.5-7.402 16.5-16.5 16.5z"/><path d="m397.239 162.995v107.633c0 17.369 14.131 31.5 31.5 31.5s31.5-14.131 31.5-31.5v-107.633c0-17.369-14.131-31.5-31.5-31.5s-31.5 14.131-31.5 31.5zm48 0v107.633c0 9.098-7.402 16.5-16.5 16.5s-16.5-7.402-16.5-16.5v-107.633c0-9.098 7.402-16.5 16.5-16.5s16.5 7.402 16.5 16.5z"/></g></g></svg>
            <p>Say <span>NO!</span> to your urges and impulsive watching</p>
            <p class="reason">{{reason}}</p>
            
            <div class="attribute">
                <div>
                    Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from 
                    <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>
                </div>
            </div>
        </div>
    </div>`.replace('{{reason}}', reason);

    document.body.insertAdjacentHTML('afterbegin', html)
    return html;
}