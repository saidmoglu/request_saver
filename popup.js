document.addEventListener('DOMContentLoaded', function () {
    const captureSwitch = document.getElementById('captureSwitch');
    const urlList = document.getElementById('urlList');
    const saveButton = document.getElementById('saveButton');
    const timerElement = document.getElementById('timer');
    const saveNowButton = document.getElementById('saveNow');


    // Initialize the switch state and URLs based on stored values
    chrome.storage.sync.get(['capturing', 'urls'], (data) => {
        captureSwitch.checked = data.capturing || false;
        urlList.value = data.urls ? data.urls.join('\n') : '';
    });

    captureSwitch.addEventListener('change', function () {
        const capturing = captureSwitch.checked;
        chrome.storage.sync.set({ capturing: capturing }, () => {
            console.log('Capture state is set to ', capturing);

            // Send a message to the background script with the new state
            chrome.runtime.sendMessage({ capturing: capturing });
        });
    });

    saveButton.addEventListener('click', function () {
        const urls = urlList.value.split('\n').filter(url => url.trim() !== '');
        chrome.storage.sync.set({ urls: urls }, () => {
            console.log('URLs saved:', urls);

            // Send updated URLs list to the background script
            chrome.runtime.sendMessage({ updateUrls: urls });
        });
    });

    function updateTimerDisplay(milliseconds) {
        const seconds = Math.floor((milliseconds / 1000) % 60);
        const minutes = Math.floor((milliseconds / 1000 / 60) % 60);
        timerElement.textContent = `Time until next save: ${minutes}m ${seconds}s`;
    }

    function getTimeRemaining() {
        chrome.runtime.sendMessage({ action: "getTimeRemaining" }, (response) => {
            if (response) {
                updateTimerDisplay(response.timeRemaining);
            }
        });
    }

    saveNowButton.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: "saveNow" }, () => {
            getTimeRemaining();
        });
    });

    setInterval(getTimeRemaining, 1000); // Update every second

});