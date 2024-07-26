const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const addTextBtn = document.getElementById('addTextBtn');
const fontSelect = document.getElementById('fontSelect');
const colorPicker = document.getElementById('colorPicker');
const sizeInput = document.getElementById('sizeInput');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const changeBackgroundBtn = document.getElementById('changeBackgroundBtn');
const prevBackgroundBtn = document.getElementById('prevBackgroundBtn');
const nextBackgroundBtn = document.getElementById('nextBackgroundBtn');

let texts = [];
let undoStack = [];
let redoStack = [];
let isDragging = false;
let selectedText = null;
let offsetX, offsetY;
let isEditing = false;

let backgrounds = [
    '1.jpeg',
    '2.jpg',
    '3.jpg'
];
let currentBackgroundIndex = 0;
let backgroundImage = new Image();
backgroundImage.src = backgrounds[currentBackgroundIndex];
backgroundImage.onload = function() {
    drawTexts();
}

function saveState() {
    undoStack.push(JSON.stringify(texts));
    redoStack = [];
}

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(JSON.stringify(texts));
        texts = JSON.parse(undoStack.pop());
        drawTexts();
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(JSON.stringify(texts));
        texts = JSON.parse(redoStack.pop());
        drawTexts();
    }
}

function addText() {
    const text = textInput.value;
    const font = fontSelect.value;
    const color = colorPicker.value;
    const size = parseInt(sizeInput.value);

    saveState();
    texts.push({
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
    texts.forEach(t => {
        ctx.font = `${t.size}px ${t.font}`;
        ctx.fillStyle = t.color;
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
    for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
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

// Background Change Functions
function nextBackground() {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % backgrounds.length;
    backgroundImage.src = backgrounds[currentBackgroundIndex];
}

function previousBackground() {
    currentBackgroundIndex = (currentBackgroundIndex - 1 + backgrounds.length) % backgrounds.length;
    backgroundImage.src = backgrounds[currentBackgroundIndex];
}

canvas.addEventListener('mousedown', (e) => {
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
});

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
prevBackgroundBtn.addEventListener('click', previousBackground);
nextBackgroundBtn.addEventListener('click', nextBackground);

drawTexts();
