chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "showHighlights",
    title: "Show Highlights Panel",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "showHighlights") {
    chrome.tabs.sendMessage(tab.id, { action: "toggleHighlightsPanel" });
  }
}); 