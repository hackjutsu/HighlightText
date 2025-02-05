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

// Handle clicks on the popup
popup.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent click from bubbling

    if (e.target.classList.contains('color-option')) {
        const color = e.target.dataset.color;
        
        if (currentHighlightedSpan) {
            // Change color of existing highlight
            currentHighlightedSpan.style.backgroundColor = color;
        } else if (currentSelection) {
            // Create new highlight
            const newNode = document.createElement('span');
            newNode.style.backgroundColor = color;
            
            try {
                const range = currentSelection.range;
                range.surroundContents(newNode);
            } catch (error) {
                console.log('Cannot highlight this selection:', error);
            }
        }
    } else if (e.target.classList.contains('remove-highlight') && currentHighlightedSpan) {
        // Only remove highlight if we're working with an existing highlight
        const textContent = currentHighlightedSpan.textContent;
        currentHighlightedSpan.outerHTML = textContent;
    }

    // Hide popup after action
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