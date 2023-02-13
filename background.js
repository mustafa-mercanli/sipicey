chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason.search(/install/g) === -1) {
        return
    }
    chrome.tabs.create({
        url: "/options.html",
        active: true
    })
})