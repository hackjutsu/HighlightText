let isEnabled = true;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Create extension icon context menu
  chrome.contextMenus.create({
    id: "togglePanel",
    title: "Toggle Highlights Panel",
    contexts: ["action"]  // This makes it appear in extension icon context menu
  });

  // Set initial icon state
  updateIcon();
});

// Handle extension icon click (enable/disable)
chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.startsWith('chrome://')) {
    try {
      isEnabled = !isEnabled;
      updateIcon();
      chrome.tabs.sendMessage(tab.id, { 
        action: "toggleExtension",
        isEnabled: isEnabled 
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not toggle extension:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.log('Error toggling extension:', error);
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "togglePanel" && !tab.url.startsWith('chrome://')) {
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

// Update icon based on enabled state
function updateIcon() {
  const path = isEnabled ? {
    16: "images/icon16.png",
    48: "images/icon48.png",
    128: "images/icon128.png"
  } : {
    16: "images/icon16_disabled.png",
    48: "images/icon48_disabled.png",
    128: "images/icon128_disabled.png"
  };
  
  chrome.action.setIcon({ path });
} 