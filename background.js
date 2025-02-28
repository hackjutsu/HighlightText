let isEnabled = false;

// Add at the top of background.js
const FEEDBACK_FORM_URL = 'https://github.com/hackjutsu/HighlightText/issues';

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }
  
  try {
    chrome.contextMenus.create({
      id: "togglePanel",
      title: "Toggle Highlights Panel",
      contexts: ["action"]
    });
    updateIcon();
  } catch (error) {
    ErrorTracker.track(error, 'extension_init');
  }

  // Set up uninstall URL
  chrome.runtime.setUninstallURL(FEEDBACK_FORM_URL);
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (!tab.url.startsWith('chrome://')) {
    try {
      isEnabled = !isEnabled;
      updateIcon();
      chrome.tabs.sendMessage(tab.id, { 
        action: "toggleExtension",
        isEnabled: isEnabled 
      });
    } catch (error) {
      ErrorTracker.track(error, 'toggle_extension');
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "togglePanel" && tab?.url && !tab.url.startsWith('chrome://')) {
    // Only allow panel toggle if extension is enabled
    if (isEnabled) {
      try {
        chrome.tabs.sendMessage(tab.id, { action: "toggleHighlightsPanel" });
      } catch (error) {
        ErrorTracker.track(error, 'toggle_panel');
      }
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

// Add tab update listener to sync state on page load
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab?.url && !tab.url.startsWith('chrome://')) {
    try {
      chrome.tabs.sendMessage(tabId, {
        action: "toggleExtension",
        isEnabled: isEnabled
      });
    } catch (error) {
      ErrorTracker.track(error, 'tab_update');
    }
  }
});

// Add message handler for getting initial state
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getState") {
        sendResponse({ isEnabled: isEnabled });
    }
    return true;  // Required for async response
});

// Add cleanup function
async function cleanupData() {
    return new Promise((resolve) => {
        chrome.storage.local.clear(() => {
            resolve();
        });
    });
}

// Add message listener for cleanup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "cleanupData") {
        cleanupData().then(() => {
            sendResponse({ success: true });
        });
        return true; // Required for async response
    }
}); 