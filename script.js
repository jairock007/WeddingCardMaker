const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const addTextBtn = document.getElementById('addTextBtn');
const fontSelect = document.getElementById('fontSelect');
const colorPicker = document.getElementById('colorPicker');
const sizeInput = document.getElementById('sizeInput');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const prevBackgroundBtn = document.getElementById('prevBackgroundBtn');
const nextBackgroundBtn = document.getElementById('nextBackgroundBtn');
const customizePagesBtn = document.getElementById('customizePagesBtn');
const customizeModal = document.getElementById('customizeModal');
const pageList = document.getElementById('pageList');
const saveOrderBtn = document.getElementById('saveOrderBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

let backgroundImages = [
    '7.jpg',
    '4.jpeg',
    '5.jpeg'
];

let currentBackgroundIndex = 0;
let backgroundImage = new Image();
backgroundImage.src = backgroundImages[currentBackgroundIndex];

let texts = {};
backgroundImages.forEach(img => {
    texts[img] = [];
});

let undoStack = {};
let redoStack = {};
backgroundImages.forEach(img => {
    undoStack[img] = [];
    redoStack[img] = [];
});

let isDragging = false;
let selectedText = null;
let offsetX, offsetY;
let isEditing = false;

backgroundImage.onload = function() {
    drawTexts();
};

function saveState() {
    const currentImage = backgroundImages[currentBackgroundIndex];
    undoStack[currentImage].push(JSON.stringify(texts[currentImage]));
    redoStack[currentImage] = [];
}

function undo() {
    const currentImage = backgroundImages[currentBackgroundIndex];
    if (undoStack[currentImage].length > 0) {
        redoStack[currentImage].push(JSON.stringify(texts[currentImage]));
        texts[currentImage] = JSON.parse(undoStack[currentImage].pop());
        drawTexts();
    }
}

function redo() {
    const currentImage = backgroundImages[currentBackgroundIndex];
    if (redoStack[currentImage].length > 0) {
        undoStack[currentImage].push(JSON.stringify(texts[currentImage]));
        texts[currentImage] = JSON.parse(redoStack[currentImage].pop());
        drawTexts();
    }
}

function addText() {
    const text = textInput.value;
    const font = fontSelect.value;
    const color = colorPicker.value;
    const size = parseInt(sizeInput.value);
    
    saveState();
    texts[backgroundImages[currentBackgroundIndex]].push({
        text,
        font,
        color,
        size,
        x: Math.random() * (canvas.width - 100),
        y: Math.random() * (canvas.height - 50)
    });
    drawTexts();
    textInput.value = '';
}

function drawTexts() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    const currentTexts = texts[backgroundImages[currentBackgroundIndex]] || [];
    currentTexts.forEach(t => {
        ctx.font = `${t.size}px ${t.font}`;
        ctx.fillStyle = t.color;
        
        t.x = Math.max(0, Math.min(t.x, canvas.width - ctx.measureText(t.text).width));
        t.y = Math.max(t.size, Math.min(t.y, canvas.height));
        
        ctx.fillText(t.text, t.x, t.y);
        if (t === selectedText) {
            drawDottedRectangle(t);
        }
    });
}

function drawDottedRectangle(text) {
    ctx.save();
    ctx.strokeStyle = 'black';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    const metrics = ctx.measureText(text.text);
    const width = metrics.width;
    const height = text.size;
    ctx.strokeRect(text.x - 2, text.y - height, width + 4, height + 4);
    ctx.restore();
}

function getTextAt(x, y) {
    const currentTexts = texts[backgroundImages[currentBackgroundIndex]];
    for (let i = currentTexts.length - 1; i >= 0; i--) {
        const t = currentTexts[i];
        ctx.font = `${t.size}px ${t.font}`;
        const metrics = ctx.measureText(t.text);
        if (x >= t.x && x <= t.x + metrics.width &&
            y >= t.y - t.size && y <= t.y) {
            return t;
        }
    }
    return null;
}

function updateSelectedText() {
    if (selectedText) {
        selectedText.font = fontSelect.value;
        selectedText.color = colorPicker.value;
        selectedText.size = parseInt(sizeInput.value);
        drawTexts();
    }
}

function changeBackgroundImage(direction) {
    if (direction === 'next') {
        currentBackgroundIndex = (currentBackgroundIndex + 1) % backgroundImages.length;
    } else if (direction === 'prev') {
        currentBackgroundIndex = (currentBackgroundIndex - 1 + backgroundImages.length) % backgroundImages.length;
    }
    backgroundImage.src = backgroundImages[currentBackgroundIndex];
    backgroundImage.onload = function() {
        drawTexts();
    };
    selectedText = null;
    isEditing = false;
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    selectedText = getTextAt(x, y);
    if (selectedText) {
        isDragging = true;
        isEditing = true;
        offsetX = x - selectedText.x;
        offsetY = y - selectedText.y;
        textInput.value = selectedText.text;
        fontSelect.value = selectedText.font;
        colorPicker.value = selectedText.color;
        sizeInput.value = selectedText.size;
    } else {
        selectedText = null;
        isEditing = false;
    }
    drawTexts();
}

function openCustomizeModal() {
    customizeModal.style.display = 'block';
    renderPageList();
}

function closeCustomizeModal() {
    customizeModal.style.display = 'none';
}

function renderPageList() {
    pageList.innerHTML = '';
    backgroundImages.forEach((img, index) => {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        
        // Create a small canvas for the preview
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 100;  // Set width and height as needed
        previewCanvas.height = 175;
        previewCanvas.className = 'page-preview';
        
        pageItem.innerHTML = `
            <span>Page ${index + 1}: ${img}</span>
            <div class="page-controls">
                <button onclick="movePage(${index}, 'up')">↑</button>
                <button onclick="movePage(${index}, 'down')">↓</button>
            </div>
        `;
        
        pageItem.insertBefore(previewCanvas, pageItem.firstChild);
        pageList.appendChild(pageItem);
        
        // Draw the preview
        drawPreview(previewCanvas, img);
    });
}

function drawPreview(canvas, imageSrc) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
        // Draw the background image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Draw the associated texts
        const scale = canvas.width / backgroundImage.width;
        ctx.scale(scale, scale);
        
        texts[imageSrc].forEach(t => {
            ctx.font = `${t.size}px ${t.font}`;
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        });
    };
    img.src = imageSrc;
}

function movePage(index, direction) {
    const length = backgroundImages.length;
    let newIndex;

    if (direction === 'up') {
        newIndex = (index - 1 + length) % length;
    } else if (direction === 'down') {
        newIndex = (index + 1) % length;
    }

    // Swap the images
    [backgroundImages[index], backgroundImages[newIndex]] = [backgroundImages[newIndex], backgroundImages[index]];
    
    // If the current background is one of the swapped images, update the currentBackgroundIndex
    if (currentBackgroundIndex === index) {
        currentBackgroundIndex = newIndex;
    } else if (currentBackgroundIndex === newIndex) {
        currentBackgroundIndex = index;
    }

    renderPageList();
}

function saveNewOrder() {
    // Set the current background index to 0 (first image in the new order)
    currentBackgroundIndex = 0;
    
    // Update the background image to the first image in the new order
    backgroundImage.src = backgroundImages[currentBackgroundIndex];
    
    // Close the modal
    closeCustomizeModal();
    
    // Wait for the image to load before drawing texts
    backgroundImage.onload = function() {
        drawTexts();
    };
}

canvas.addEventListener('mousedown', handleCanvasClick);
canvas.addEventListener('mousemove', (e) => {
    if (isDragging && selectedText) {
        const rect = canvas.getBoundingClientRect();
        selectedText.x = e.clientX - rect.left - offsetX;
        selectedText.y = e.clientY - rect.top - offsetY;
        drawTexts();
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDragging) {
        saveState();
    }
    isDragging = false;
});

textInput.addEventListener('input', () => {
    if (isEditing && selectedText) {
        selectedText.text = textInput.value;
        drawTexts();
    }
});

addTextBtn.addEventListener('click', addText);
fontSelect.addEventListener('change', updateSelectedText);
colorPicker.addEventListener('input', updateSelectedText);
sizeInput.addEventListener('input', updateSelectedText);
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
prevBackgroundBtn.addEventListener('click', () => changeBackgroundImage('prev'));
nextBackgroundBtn.addEventListener('click', () => changeBackgroundImage('next'));
customizePagesBtn.addEventListener('click', openCustomizeModal);
closeModalBtn.addEventListener('click', closeCustomizeModal);
saveOrderBtn.addEventListener('click', saveNewOrder);

window.onclick = function(event) {
    if (event.target == customizeModal) {
        closeCustomizeModal();
    }
}

drawTexts();