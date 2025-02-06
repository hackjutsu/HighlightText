// Add popup HTML to the page
const popupHTML = `
    <div id="highlight-popup" style="display: none; position: absolute; background: white; 
        border: 1px solid #ccc; border-radius: 4px; padding: 5px; box-shadow: 2px 2px 10px rgba(0,0,0,0.2);">
        <div class="color-options">
            <div class="color-option" data-color="rgba(255, 235, 59, 0.3)" style="background: rgba(255, 235, 59, 0.3)"></div>
            <div class="color-option" data-color="rgba(76, 175, 80, 0.3)" style="background: rgba(76, 175, 80, 0.3)"></div>
            <div class="color-option" data-color="rgba(244, 67, 54, 0.3)" style="background: rgba(244, 67, 54, 0.3)"></div>
            <div class="color-option" data-color="rgba(33, 150, 243, 0.3)" style="background: rgba(33, 150, 243, 0.3)"></div>
            <div class="remove-highlight" title="Remove highlight">✕</div>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', popupHTML);

// Add at the beginning of your content.js, after the popup HTML
const panelHTML = `
    <div id="highlights-panel" style="display: none;">
        <div class="panel-header">
            <span>Highlights</span>
            <div class="panel-controls">
                <button class="download-highlights" title="Download highlights">📥</button>
                <button class="close-panel">×</button>
            </div>
        </div>
        <div class="highlights-list"></div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', panelHTML);

// Add styles for the color options
const style = document.createElement('style');
style.textContent = `
    .color-options {
        display: flex;
        align-items: center;
        gap: 3px;
    }
    .color-option {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        cursor: pointer;
        display: inline-block;
        border: 1px solid #ddd;
        vertical-align: middle;
    }
    .color-option:hover {
        transform: scale(1.1);
    }
    .remove-highlight {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        cursor: pointer;
        color: #f44336;
        font-size: 14px;
        border: 1px solid #f44336;
        border-radius: 50%;
        vertical-align: middle;
    }
    .remove-highlight:hover {
        transform: scale(1.1);
        background: #fff0f0;
    }
    #highlights-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 300px;
        height: 100vh;
        background: white;
        box-shadow: -2px 0 5px rgba(0,0,0,0.1);
        z-index: 10000;
        display: flex;
        flex-direction: column;
    }
    .panel-header {
        padding: 10px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .close-panel {
        border: none;
        background: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
    }
    .close-panel:hover {
        color: #000;
    }
    .highlights-list {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
    }
    .highlight-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        margin-bottom: 8px;
        border-radius: 4px;
    }
    .highlight-text {
        flex-grow: 1;
        cursor: pointer;
        margin-right: 8px;
    }
    .highlight-delete {
        border: none;
        background: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 4px 8px;
        border-radius: 4px;
    }
    .highlight-delete:hover {
        color: #f44336;
        background: rgba(244, 67, 54, 0.1);
    }
    .panel-controls {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    .download-highlights {
        border: none;
        background: none;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        padding: 4px;
    }
    .download-highlights:hover {
        color: #000;
    }
`;
document.head.appendChild(style);

// Get popup element
const popup = document.getElementById('highlight-popup');
let currentHighlightedSpan = null;
let isMouseOverPopup = false;
let currentSelection = null;

// Add a unique class to our highlights to distinguish them from other spans
const HIGHLIGHT_CLASS = 'text-highlighter-extension';

// Show popup when hovering over highlighted text
document.addEventListener('mouseover', function(e) {
    // Don't show hover menu if there's an active text selection
    const selection = window.getSelection();
    if (selection.toString().length > 0) return;

    const target = e.target.closest('span[style*="background-color"]');
    if (target) {
        currentHighlightedSpan = target;
        currentSelection = null;
        const rect = target.getBoundingClientRect();
        
        popup.style.display = 'block';
        popup.style.left = `${rect.right + window.scrollX + 5}px`;
        popup.style.top = `${rect.top + window.scrollY}px`;
    }
});

// Track mouse over popup
popup.addEventListener('mouseenter', function() {
    isMouseOverPopup = true;
});

popup.addEventListener('mouseleave', function() {
    isMouseOverPopup = false;
    setTimeout(() => {
        if (!isMouseOverPopup && !document.querySelector('span[style*="background-color"]:hover')) {
            popup.style.display = 'none';
            currentHighlightedSpan = null;
        }
    }, 100);
});

// Handle text selection
document.addEventListener('mouseup', function(e) {
    if (!isExtensionEnabled) return;  // Skip if disabled
    
    const selection = window.getSelection();
    
    // Skip if selection was made by double click
    if (e.detail > 1) {
        popup.style.display = 'none';
        currentSelection = null;
        currentHighlightedSpan = null;
        return;
    }
    
    if (selection.toString().length > 0 && !popup.contains(e.target)) {
        // Store the selection
        currentSelection = {
            range: selection.getRangeAt(0).cloneRange(),
            text: selection.toString()
        };
        currentHighlightedSpan = null;

        // Position popup near the mouse cursor
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const popupWidth = popup.offsetWidth;
        const popupHeight = popup.offsetHeight;
        
        // Calculate position, keeping popup within viewport
        let left = e.clientX;
        let top = e.clientY + 20; // 20px below cursor
        
        // Adjust if popup would overflow right edge
        if (left + popupWidth > viewportWidth) {
            left = viewportWidth - popupWidth - 10;
        }
        
        // Adjust if popup would overflow bottom edge
        if (top + popupHeight > viewportHeight) {
            top = e.clientY - popupHeight - 10; // Show above cursor
        }
        
        popup.style.display = 'block';
        popup.style.left = `${left + window.scrollX}px`;
        popup.style.top = `${top + window.scrollY}px`;
    }
});

// Function to generate a unique ID for each highlight
function generateHighlightId() {
    return `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

let isExtensionEnabled = true;

// Function to toggle visibility of all highlights
function toggleHighlightsVisibility(show) {
    document.querySelectorAll('span[style*="background-color"]').forEach(span => {
        span.style.backgroundColor = show ? span.dataset.originalColor : 'transparent';
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleExtension") {
        isExtensionEnabled = request.isEnabled;
        
        // Hide popup and panel if disabling
        if (!isExtensionEnabled) {
            popup.style.display = 'none';
            panel.style.display = 'none';
        }
        
        // Toggle visibility of existing highlights
        toggleHighlightsVisibility(isExtensionEnabled);
    }
});

// Update the click handler for the popup
popup.addEventListener('click', function(e) {
    e.stopPropagation();

    if (e.target.classList.contains('color-option')) {
        const color = e.target.dataset.color;
        
        if (currentHighlightedSpan) {
            currentHighlightedSpan.style.backgroundColor = color;
            currentHighlightedSpan.dataset.originalColor = color;
            currentHighlightedSpan.classList.add(HIGHLIGHT_CLASS);
            saveHighlights();
            updateHighlightsList();
        } else if (currentSelection && isExtensionEnabled) {
            try {
                const range = currentSelection.range;
                const span = document.createElement('span');
                span.style.backgroundColor = color;
                span.dataset.originalColor = color;
                span.classList.add(HIGHLIGHT_CLASS);
                
                try {
                    range.surroundContents(span);
                } catch (e) {
                    const extracted = range.extractContents();
                    span.appendChild(extracted);
                    range.insertNode(span);
                }
                
                saveHighlights();
                updateHighlightsList();
            } catch (error) {
                console.log('Cannot highlight this selection:', error);
            }
        }
    } else if (e.target.classList.contains('remove-highlight') && currentHighlightedSpan) {
        const textContent = currentHighlightedSpan.textContent;
        currentHighlightedSpan.outerHTML = textContent;
        saveHighlights();
        updateHighlightsList();
    }

    popup.style.display = 'none';
    currentSelection = null;
    currentHighlightedSpan = null;
});

// Hide popup when clicking outside
document.addEventListener('mousedown', function(e) {
    if (!popup.contains(e.target) && !e.target.closest('span[style*="background-color"]')) {
        popup.style.display = 'none';
        currentSelection = null;
        currentHighlightedSpan = null;
    }
});

// Add panel functionality
const panel = document.getElementById('highlights-panel');
const highlightsList = panel.querySelector('.highlights-list');

// Function to update highlights list
function updateHighlightsList() {
    highlightsList.innerHTML = '';
    // Only select spans with our specific class
    const highlights = document.querySelectorAll(`span.${HIGHLIGHT_CLASS}`);
    
    highlights.forEach(span => {
        const text = span.textContent.trim();
        if (!text) return;
        
        const item = document.createElement('div');
        item.className = 'highlight-item';
        
        const textContainer = document.createElement('div');
        textContainer.className = 'highlight-text';
        const displayText = text.length > 100 ? text.slice(0, 100) + '...' : text;
        textContainer.textContent = displayText.replace(/\s+/g, ' ');
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'highlight-delete';
        deleteButton.innerHTML = '×';
        deleteButton.title = 'Delete highlight';
        
        // Add click handlers
        textContainer.addEventListener('click', () => {
            // Only scroll to highlight if it still exists in the document
            if (document.body.contains(span)) {
                span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                span.style.transition = 'background-color 0.3s';
                const originalColor = span.style.backgroundColor;
                span.style.backgroundColor = 'rgba(255, 255, 0, 0.8)';
                setTimeout(() => {
                    span.style.backgroundColor = originalColor;
                }, 1000);
            } else {
                // Remove this item if the highlight no longer exists
                item.remove();
            }
        });
        
        deleteButton.addEventListener('click', () => {
            if (document.body.contains(span)) {
                span.outerHTML = span.textContent;
            }
            item.remove();
            saveHighlights();
        });
        
        item.appendChild(textContainer);
        item.appendChild(deleteButton);
        item.style.backgroundColor = span.style.backgroundColor;
        highlightsList.appendChild(item);
    });
}

// Function to save panel state
function savePanelState(isVisible) {
    chrome.storage.local.set({
        [`${window.location.href}_panel`]: isVisible
    });
}

// Function to restore panel state
function restorePanelState() {
    chrome.storage.local.get([`${window.location.href}_panel`], function(result) {
        const isVisible = result[`${window.location.href}_panel`];
        if (isVisible) {
            panel.style.display = 'flex';
            updateHighlightsList();
        }
    });
}

// Update the panel toggle handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleHighlightsPanel") {
        const newDisplay = panel.style.display === 'none' ? 'flex' : 'none';
        panel.style.display = newDisplay;
        savePanelState(newDisplay === 'flex');
        if (newDisplay === 'flex') {
            updateHighlightsList();
        }
    }
});

// Update the close panel button handler
panel.querySelector('.close-panel').addEventListener('click', () => {
    panel.style.display = 'none';
    savePanelState(false);
});

// Update download functionality
function downloadHighlights() {
    const highlights = [];
    // Only get highlights with our specific class and non-empty content
    document.querySelectorAll(`span.${HIGHLIGHT_CLASS}`).forEach(span => {
        const text = span.textContent.trim();
        if (text) {
            highlights.push(text);
        }
    });

    // Skip download if no valid highlights
    if (highlights.length === 0) {
        return;
    }

    // Create metadata and content
    const metadata = {
        url: window.location.href,
        title: document.title,
        date: new Date().toLocaleString(),
        totalHighlights: highlights.length
    };

    // Create text content with metadata
    const content = [
        `URL: ${metadata.url}`,
        `Page Title: ${metadata.title}`,
        `Date: ${metadata.date}`,
        `Number of Highlights: ${metadata.totalHighlights}`,
        '\nHighlights:',
        ...highlights.map((text, index) => `\n${index + 1}. "${text}"`)
    ].join('\n');

    // Create download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highlights-${document.title.slice(0, 30)}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Add click handler for download button
panel.querySelector('.download-highlights').addEventListener('click', downloadHighlights);

// Add to your initialization code (where you have setTimeout for restoreHighlights)
setTimeout(() => {
    restoreHighlights();
    restorePanelState();
}, 500);

// Simplified save function
function saveHighlights() {
    const highlights = [];
    document.querySelectorAll('span[style*="background-color"]').forEach(span => {
        highlights.push({
            text: span.textContent,
            color: span.style.backgroundColor
        });
    });

    chrome.storage.local.set({
        [window.location.href]: highlights
    });
}

// Simplified restore function
function restoreHighlights() {
    chrome.storage.local.get([window.location.href], function(result) {
        const highlights = result[window.location.href] || [];
        
        highlights.forEach(highlight => {
            try {
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.includes(highlight.text)) {
                        const range = document.createRange();
                        const startIndex = node.textContent.indexOf(highlight.text);
                        range.setStart(node, startIndex);
                        range.setEnd(node, startIndex + highlight.text.length);

                        const span = document.createElement('span');
                        span.style.backgroundColor = isExtensionEnabled ? highlight.color : 'transparent';
                        span.dataset.originalColor = highlight.color;
                        span.classList.add(HIGHLIGHT_CLASS);
                        
                        try {
                            range.surroundContents(span);
                            break;
                        } catch (error) {
                            console.log('Could not restore highlight:', error);
                        }
                    }
                }
            } catch (error) {
                console.log('Could not restore highlight:', error);
            }
        });

        if (panel.style.display !== 'none') {
            updateHighlightsList();
        }
    });
} 