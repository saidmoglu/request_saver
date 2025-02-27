let capturing = false;
let intervalId;
const timeLimit = 300000; // 5 minutes
let timeRemaining = timeLimit;
let curlCommand = "";
let firstTime = true;
let urlsToMonitor = [];
let fileName = "request_saver/latest_request.txt";

let my_urls = [];

function loadUrls() {
    fetch(chrome.runtime.getURL('my_urls.txt'))
        .then(response => response.text())
        .then(text => {
            my_urls = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            console.log("Loaded URLs:", my_urls);
            chrome.storage.sync.set({ capturing: false, urls: my_urls });
        })
        .catch(error => {
            console.error("Failed to load URLs:", error);
        });
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
    loadUrls(); //Load urls at startup
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.hasOwnProperty('capturing')) {
        console.log(`Capturing value is changed: ${message.capturing}`);
        capturing = message.capturing;
        firstTime = true;
    }
    if (message.hasOwnProperty('updateUrls')) {
        console.log(`Updated URLs: ${message.updateUrls}`);
        urlsToMonitor = message.updateUrls.map(url => url + '*');
        firstTime = true;
        updateWebRequestListener();
    }
    if (message.action === "getTimeRemaining") {
        sendResponse({ timeRemaining });
    } else if (message.action === "saveNow") {
        saveCurlToFileInner();
        startTimer(); // Reset and restart the timer when the user manually saves
    }
});

chrome.storage.sync.get('urls', (data) => {
    urlsToMonitor = (data.urls || []).map(url => url + '*');
    updateWebRequestListener();
});

function updateWebRequestListener() {
    chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersHandler);
    if (urlsToMonitor.length > 0) {
        chrome.webRequest.onBeforeSendHeaders.addListener(
            onBeforeSendHeadersHandler,
            { urls: urlsToMonitor },
            ["requestHeaders", "extraHeaders"]
        );
    }
}

function onBeforeSendHeadersHandler(details) {
    if (details.method === "GET") {
        let newCurlCommand = `curl '${details.url}'\n-X ${details.method}`;
        details.requestHeaders.forEach(header => {
            newCurlCommand += `\n-H '${header.name}: ${header.value}'`;
        });
        curlCommand = newCurlCommand;
        if (firstTime && capturing) {
            saveCurlToFile();
            firstTime = false;
            startTimer(); // Start the timer after the first request is captured
        }
    }
}


function saveCurlToFile() {
    if (!capturing) return;
    saveCurlToFileInner();
}

function saveCurlToFileInner() {
    if (!curlCommand) {
        console.log("No CURL command to save");
        return;
    }
    console.log("Saving CURL command to file");
    const curldata = 'data:text/plain;charset=utf-8,' + encodeURIComponent(curlCommand);

    // Search for existing downloaded file and remove it
    chrome.downloads.search({ filenameRegex: fileName, state: 'complete' }, function (items) {
        items.forEach((item) => {
            console.log("Found existing file, erasing and removing:", item);
            chrome.downloads.removeFile(item.id, () => {
                if (chrome.runtime.lastError) {
                    console.log('Error removing file:', chrome.runtime.lastError.message);
                }
                chrome.downloads.erase({ id: item.id }, () => {
                    if (chrome.runtime.lastError) {
                        console.log('Error erasing file:', chrome.runtime.lastError.message);
                    }
                });
            });
        });
    });
    chrome.downloads.download({
        url: curldata,
        filename: fileName,
        saveAs: false
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.error("Download failed:", chrome.runtime.lastError);
        } else {
            console.log("File download initiated with ID:", downloadId);
            curlCommand = ""; // Clear the command after saving
        }
    });
}

function startTimer() {
    clearInterval(intervalId);
    timeRemaining = timeLimit;

    intervalId = setInterval(() => {
        timeRemaining -= 1000;

        if (timeRemaining <= 0) {
            saveCurlToFile();
            timeRemaining = timeLimit;
        }
    }, 1000);
}

startTimer(); // Start the timer when the extension is loaded
