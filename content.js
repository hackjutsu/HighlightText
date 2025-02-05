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
`;
document.head.appendChild(style);

// Get popup element
const popup = document.getElementById('highlight-popup');
let currentHighlightedSpan = null;
let isMouseOverPopup = false;
let currentSelection = null;

// Show popup when hovering over highlighted text
document.addEventListener('mouseover', function(e) {
    const target = e.target.closest('span[style*="background-color"]');
    if (target) {
        currentHighlightedSpan = target;
        currentSelection = null; // Clear any existing selection
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
    const selection = window.getSelection();
    
    if (selection.toString().length > 0 && !popup.contains(e.target)) {
        // Store the selection
        currentSelection = {
            range: selection.getRangeAt(0).cloneRange(),
            text: selection.toString()
        };
        currentHighlightedSpan = null; // Clear any existing highlight

        const rect = selection.getRangeAt(0).getBoundingClientRect();
        popup.style.display = 'block';
        popup.style.left = `${rect.left + window.scrollX}px`;
        popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    }
});

// Function to generate a unique ID for each highlight
function generateHighlightId() {
    return `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Function to save highlights to storage
function saveHighlights() {
    const highlights = [];
    document.querySelectorAll('span[style*="background-color"]').forEach(span => {
        highlights.push({
            id: span.dataset.highlightId,
            text: span.textContent,
            color: span.style.backgroundColor,
            path: getElementPath(span)
        });
    });

    chrome.storage.local.set({
        [window.location.href]: highlights
    });
}

// Function to get unique path to an element
function getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
        let index = 0;
        let sibling = current;
        while (sibling = sibling.previousElementSibling) {
            if (sibling.tagName === current.tagName) {
                index++;
            }
        }
        path.unshift(`${current.tagName}:nth-of-type(${index + 1})`);
        current = current.parentElement;
    }
    
    return path.join(' > ');
}

// Function to restore highlights from storage
function restoreHighlights() {
    chrome.storage.local.get([window.location.href], function(result) {
        const highlights = result[window.location.href] || [];
        
        highlights.forEach(highlight => {
            try {
                // Find exact text match
                const text = highlight.text;
                const regex = new RegExp(text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: function(node) {
                            return node.textContent.match(regex) ? 
                                NodeFilter.FILTER_ACCEPT : 
                                NodeFilter.FILTER_REJECT;
                        }
                    }
                );

                let node;
                while (node = walker.nextNode()) {
                    const range = document.createRange();
                    const textContent = node.textContent;
                    const startIndex = textContent.indexOf(text);
                    
                    if (startIndex >= 0) {
                        range.setStart(node, startIndex);
                        range.setEnd(node, startIndex + text.length);
                        
                        const span = document.createElement('span');
                        span.style.backgroundColor = highlight.color;
                        span.dataset.highlightId = highlight.id;
                        
                        range.surroundContents(span);
                        break;
                    }
                }
            } catch (error) {
                console.log('Could not restore highlight:', error);
            }
        });
    });
}

// Handle clicks on the popup
popup.addEventListener('click', function(e) {
    e.stopPropagation();

    if (e.target.classList.contains('color-option')) {
        const color = e.target.dataset.color;
        
        if (currentHighlightedSpan) {
            // Change color of existing highlight
            currentHighlightedSpan.style.backgroundColor = color;
            saveHighlights(); // Save after color change
        } else if (currentSelection) {
            // Create new highlight
            const newNode = document.createElement('span');
            newNode.style.backgroundColor = color;
            newNode.dataset.highlightId = generateHighlightId();
            
            try {
                const range = currentSelection.range;
                range.surroundContents(newNode);
                saveHighlights(); // Save after creating new highlight
            } catch (error) {
                console.log('Cannot highlight this selection:', error);
            }
        }
    } else if (e.target.classList.contains('remove-highlight') && currentHighlightedSpan) {
        const textContent = currentHighlightedSpan.textContent;
        currentHighlightedSpan.outerHTML = textContent;
        saveHighlights(); // Save after removing highlight
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

// Restore highlights immediately
setTimeout(restoreHighlights, 500); // Small delay to ensure page content is loaded 