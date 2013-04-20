// Replace openURL
openURL = function (url) {
    chrome.tabs.create({url: url});
}
