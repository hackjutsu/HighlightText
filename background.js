// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Skip chrome:// URLs and other restricted pages
  if (!tab.url.startsWith('chrome://')) {
    try {
      chrome.tabs.sendMessage(tab.id, { action: "toggleHighlightsPanel" }, (response) => {
        if (chrome.runtime.lastError) {
          // Silently handle error when content script is not available
          console.log('Could not toggle panel:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.log('Error toggling panel:', error);
    }
  }
});

// Handle context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "showHighlights",
    title: "Show Highlights Panel",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "showHighlights" && !tab.url.startsWith('chrome://')) {
    try {
      chrome.tabs.sendMessage(tab.id, { action: "toggleHighlightsPanel" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not toggle panel:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.log('Error toggling panel:', error);
    }
  }
}); 