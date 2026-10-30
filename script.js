const btn = document.getElementById('toggleBtn');
const updateBtn = document.getElementById('updateBtn');
const inputField = document.getElementById('userInput');
const transcriptDisplay = document.getElementById('transcript-display');
const container = document.getElementById('sentence-container');
const boulder = document.getElementById('boulder');
const snail = document.getElementById('snail');
const victoryScreen = document.getElementById('victory-screen');
const restartBtn = document.getElementById('restartBtn');
const nextBtn = document.getElementById('nextBtn');
const gameOverScreen = document.getElementById('game-over-screen');
const retryBtn = document.getElementById('retryBtn');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownImg = document.getElementById('countdown-img');

// Panel Toggle Elements
const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
const settingsPanel = document.getElementById('settings-panel');

let words = [];
let currentWordIndex = 0;
let isListening = false;
let isGameOver = false;
let isBoulderPaused = false;

// Positioning
let boulderPos = -200;
let snailPos = 50;
let boulderInterval;
let snailFrame = 1;

// Function to generate random single-digit math expressions
function generateMathExpression() {
    const ops = ['+', '-', '*', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10);
    let b = Math.floor(Math.random() * 10);
    
    // Avoid division by zero
    if (op === '/' && b === 0) {
        b = Math.floor(Math.random() * 9) + 1;
    }
    
    let result;
    if (op === '+') result = a + b;
    else if (op === '-') result = a - b;
    else if (op === '*') result = a * b;
    else if (op === '/') {
        result = a / b;
        if (!Number.isInteger(result)) {
            result = Number(result.toFixed(2)); // Support decimals up to 2 places
        }
    }
    
    let displayOp = op;
    if (op === '*') displayOp = '×';
    if (op === '/') displayOp = '÷';
    
    return `${a} ${displayOp} ${b} = ${result}`;
}

// Generate 50 default math expressions
let sentences = [];
for (let i = 0; i < 50; i++) {
    sentences.push(generateMathExpression());
}

let currentSentenceIndex = 0;

window.addEventListener('load', () => {
    loadSentence();
});

// Panel Toggle Logic
toggleSettingsBtn.addEventListener('click', () => {
    const isHidden = settingsPanel.style.display === 'none';
    settingsPanel.style.display = isHidden ? 'flex' : 'none';
    toggleSettingsBtn.innerText = isHidden ? 'Hide Setup' : 'Show Setup';
});

updateBtn.addEventListener('click', () => {
    const inputContent = inputField.value.trim();
    if (inputContent) {
        sentences = inputContent.split('\n').filter(s => s.trim() !== "");
        currentSentenceIndex = 0;
    }
    loadSentence();
    settingsPanel.style.display = 'none';
    toggleSettingsBtn.innerText = 'Show Setup';
});

function clean(str) {
    if (!str) return "";
    let s = str.toLowerCase().trim();

    const map = {
        "zero": "0", "0": "0",
        "one": "1", "1": "1",
        "two": "2", "2": "2",
        "three": "3", "3": "3",
        "four": "4", "4": "4",
        "five": "5", "5": "5",
        "six": "6", "6": "6",
        "seven": "7", "7": "7",
        "eight": "8", "8": "8",
        "nine": "9", "9": "9",
        "ten": "10", "10": "10",
        "plus": "+", "+": "+", "add": "+", "and": "+",
        "minus": "-", "-": "-", "negative": "-", "take": "-",
        "times": "×", "multiplied": "×", "multiply": "×", "x": "×", "*": "×", "×": "×",
        "divided": "÷", "divide": "÷", "over": "÷", "/": "÷", "÷": "÷",
        "equals": "=", "equal": "=", "is": "=", "=": "="
    };

    if (map[s]) return map[s];

    s = s.replace(/[^a-z0-9\s.\-+×÷]/g, "").replace(/\s+/g, " ").trim();
    return map[s] || s;
}

function loadSentence() {
    const text = sentences[currentSentenceIndex].trim();

    container.innerHTML = "";
    currentWordIndex = 0;
    isGameOver = false;
    words = text.split(" ");

    words.forEach((word, index) => {
        const span = document.createElement('span');
        span.innerText = word + (index < words.length - 1 ? " " : "");
        span.className = 'word';
        span.id = `word-${index}`;
        span.dataset.cleanWord = clean(word);
        container.appendChild(span);
    });

    document.getElementById('word-0').classList.add('active');

    boulderPos = -200;
    snailPos = 50;
    boulder.style.left = boulderPos + 'px';
    snail.style.left = snailPos + 'px';
    transcriptDisplay.innerText = "Transcript: ";
}

nextBtn.addEventListener('click', () => {
    recognition.stop();
    clearInterval(boulderInterval);
    isListening = false;
    btn.innerText = "Start Game";
    
    currentSentenceIndex = (currentSentenceIndex + 1) % sentences.length;
    loadSentence();
});

setInterval(() => {
    if (!isGameOver) {
        snailFrame = (snailFrame % 4) + 1;
        snail.src = `snail${snailFrame}.png`;
    }
}, 200);

function startBoulder() {
    if (isBoulderPaused) return;
    clearInterval(boulderInterval);
    boulderInterval = setInterval(() => {
        boulderPos += 1;
        boulder.style.left = boulderPos + 'px';
        boulder.style.transform = `rotate(${boulderPos * 2}deg)`;
        if (boulderPos >= snailPos - 50) {
            isGameOver = true;
            snail.src = 'deadsnail.png';
            recognition.stop();
            clearInterval(boulderInterval);
            gameOverScreen.style.display = 'flex';
        }
    }, 50);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
    if (isGameOver) return;
    let latestResult = event.results[event.results.length - 1][0].transcript.toLowerCase();
    transcriptDisplay.innerText = "I heard: " + latestResult;

    let target = document.getElementById(`word-${currentWordIndex}`).dataset.cleanWord;
    let spoken = clean(latestResult);

    if (spoken === target || spoken.includes(target)) {
        const wordElement = document.getElementById(`word-${currentWordIndex}`);
        if (wordElement && !wordElement.classList.contains('correct')) {
            wordElement.className = 'word correct';
            snailPos += 20;
            snail.style.left = snailPos + 'px';
            currentWordIndex++;
            isBoulderPaused = false;

            if (currentWordIndex < words.length) {
                document.getElementById(`word-${currentWordIndex}`).classList.add('active');
            } else {
                recognition.stop();
                clearInterval(boulderInterval);
                victoryScreen.style.display = 'flex';
            }
        }
    }
};

document.getElementById('readBtn').addEventListener('click', () => {
    const currentWordEl = document.getElementById(`word-${currentWordIndex}`);
    if (!currentWordEl) return;
    isBoulderPaused = true;
    clearInterval(boulderInterval);
    
    let textToRead = currentWordEl.innerText.trim();
    if (textToRead === '+') textToRead = "plus";
    else if (textToRead === '-') textToRead = "minus";
    else if (textToRead === '×') textToRead = "times";
    else if (textToRead === '÷') textToRead = "divided by";
    else if (textToRead === '=') textToRead = "equals";

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.onend = () => {
        isBoulderPaused = false;
        startBoulder();
    };
    window.speechSynthesis.speak(utterance);
});

function runCountdown(callback) {
    countdownOverlay.style.display = 'flex';
    countdownImg.src = 'Number3.png';
    setTimeout(() => {
        countdownImg.src = 'Number2.png';
        setTimeout(() => {
            countdownImg.src = 'Number1.png';
            setTimeout(() => {
                countdownOverlay.style.display = 'none';
                callback();
            }, 1000);
        }, 1000);
    }, 1000);
}

btn.addEventListener('click', () => {
    if (words.length === 0) return alert("Load an equation first!");
    if (isListening) {
        recognition.stop();
        btn.innerText = "Start Game";
        isListening = false;
    } else {
        recognition.start();
        runCountdown(() => {
            isBoulderPaused = false;
            if (isGameOver) loadSentence();
            startBoulder();
        });
        btn.innerText = "Stop Game";
        isListening = true;
    }
});

restartBtn.addEventListener('click', () => {
    victoryScreen.style.display = 'none';
    loadSentence();
    btn.innerText = "Start Game";
    isListening = false;
});

retryBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    loadSentence();
    btn.innerText = "Start Game";
    isListening = false;
});
