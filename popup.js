document.addEventListener('DOMContentLoaded', function () {
    const captureSwitch = document.getElementById('captureSwitch');
    const urlList = document.getElementById('urlList');
    const saveButton = document.getElementById('saveButton');
    const saveNowButton = document.getElementById('saveNowButton');


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

    saveNowButton.addEventListener('click', function () {
        // Send a message to the background script to save immediately
        chrome.runtime.sendMessage({ saveNow: true });
    });

});