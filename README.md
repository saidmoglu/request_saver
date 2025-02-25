# request_saver
Chrome extension that saves requests periodically.

## Installation
In Chrome manage extensions page enable Developer mode. Load unpacked > select the folder containing this code.

## Usage
Click on the extension symbol (pin the symbol) to open the popup. Enter URLs to capture for. URLs are matched as a prefix, for example:
https://examplepage.com/ will match https://examplepage.com/subpage?params

Turn on capturing to start capturing. The extension saves the latest request every 5 minutes to request_saver/latest_request.txt under Downloads folder.

Restart capturing timer by turning capturing off and on, or clicking save now button.