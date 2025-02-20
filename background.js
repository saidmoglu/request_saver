let capturing = false;
let curlCommand = "";
let firstTime = true;
let urlsToMonitor = [];
let fileName = "request_saver/latest_request.txt";

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
    chrome.storage.sync.set({ capturing: false, urls: ["https://examplepage.com/"] });
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
    if (!capturing) return;
    if (details.method === "GET") {
        let newCurlCommand = `curl '${details.url}'\n-X ${details.method}`;
        details.requestHeaders.forEach(header => {
            newCurlCommand += `\n-H '${header.name}: ${header.value}'`;
        });
        curlCommand = newCurlCommand;
        if (firstTime) {
            saveCurlToFile();
            firstTime = false;
        }
    }
}


function saveCurlToFile() {
    if (!capturing || !curlCommand) return;
    console.log("Saving CURL command to file");
    const curldata = 'data:text/plain;charset=utf-8,' + encodeURIComponent(curlCommand);

    // Search for existing download file and remove it
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
        }
    });
}

setInterval(saveCurlToFile, 600000); // Save every 10 minutes
