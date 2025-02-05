// Add popup HTML to the page
const popupHTML = `
    <div id="highlight-popup" style="display: none; position: absolute; background: white; 
        border: 1px solid #ccc; border-radius: 4px; padding: 5px; box-shadow: 2px 2px 10px rgba(0,0,0,0.2);">
        <div class="color-option" data-color="rgba(255, 235, 59, 0.3)" style="background: rgba(255, 235, 59, 0.3)"></div>
        <div class="color-option" data-color="rgba(76, 175, 80, 0.3)" style="background: rgba(76, 175, 80, 0.3)"></div>
        <div class="color-option" data-color="rgba(244, 67, 54, 0.3)" style="background: rgba(244, 67, 54, 0.3)"></div>
        <div class="color-option" data-color="rgba(33, 150, 243, 0.3)" style="background: rgba(33, 150, 243, 0.3)"></div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', popupHTML);

// Add styles for the color options
const style = document.createElement('style');
style.textContent = `
    .color-option {
        width: 20px;
        height: 20px;
        margin: 3px;
        border-radius: 50%;
        cursor: pointer;
        display: inline-block;
        border: 1px solid #ddd;
    }
    .color-option:hover {
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);

// Get popup element
const popup = document.getElementById('highlight-popup');

// Store the current selection
let currentSelection = null;

// Handle text selection
document.addEventListener('mouseup', function(e) {
    const selectedText = window.getSelection();
    
    if (selectedText.toString().length > 0) {
        // Store the current selection
        currentSelection = {
            range: selectedText.getRangeAt(0).cloneRange(),
            text: selectedText.toString()
        };
        
        // Show popup near the selected text
        const rect = selectedText.getRangeAt(0).getBoundingClientRect();
        
        popup.style.display = 'block';
        popup.style.left = `${rect.left + window.scrollX}px`;
        popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    }
});

// Hide popup when clicking outside
document.addEventListener('mousedown', function(e) {
    if (!popup.contains(e.target)) {
        popup.style.display = 'none';
        currentSelection = null;
    }
});

// Handle color selection
popup.addEventListener('click', function(e) {
    if (e.target.classList.contains('color-option')) {
        const color = e.target.dataset.color;
        
        if (currentSelection) {
            const newNode = document.createElement('span');
            newNode.style.backgroundColor = color;
            
            try {
                // Use the stored selection
                newNode.appendChild(currentSelection.range.extractContents());
                currentSelection.range.insertNode(newNode);
            } catch (e) {
                console.log('Cannot highlight this selection:', e);
            }
        }
        
        popup.style.display = 'none';
        currentSelection = null;
    }
}); 