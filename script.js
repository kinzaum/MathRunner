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

let currentEquationText = "";
let targetAnswer = "";
let equationsSolved = 0;
const totalEquationsToWin = 10;

let isListening = false;
let isGameOver = false;
let isBoulderPaused = false;

// Positioning
let boulderPos = -200;
let snailPos = 50;
let boulderInterval;
let snailFrame = 1;

let customEquations = [];
let customIndex = 0;

window.addEventListener('load', () => {
    loadNewProblem();
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
        customEquations = inputContent.split('\n').filter(s => s.trim() !== "");
        customIndex = 0;
    }
    equationsSolved = 0;
    loadNewProblem();
    settingsPanel.style.display = 'none';
    toggleSettingsBtn.innerText = 'Show Setup';
});

// Clean spoken words/numbers into standardized strings
function clean(str) {
    if (!str) return "";
    let s = str.toLowerCase().trim();

    const map = {
        "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
        "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
        "ten": "10", "minus": "-", "negative": "-"
    };

    if (map[s]) return map[s];

    // Remove unwanted characters except numbers, dots, and minus signs
    s = s.replace(/[^0-9.\-]/g, "");
    return s;
}

// Generate a random single-digit math expression
function generateRandomProblem() {
    const ops = ['+', '-', '*', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10);
    let b = Math.floor(Math.random() * 10);
    
    if (op === '/' && b === 0) b = Math.floor(Math.random() * 9) + 1;
    
    let result;
    if (op === '+') result = a + b;
    else if (op === '-') result = a - b;
    else if (op === '*') result = a * b;
    else if (op === '/') {
        result = a / b;
        if (!Number.isInteger(result)) result = Number(result.toFixed(2));
    }
    
    let displayOp = op;
    if (op === '*') displayOp = '×';
    if (op === '/') displayOp = '÷';
    
    return {
        display: `${a} ${displayOp} ${b} =`,
        answer: result.toString()
    };
}

// Parse custom line like "5 + 3 = 8" or "5 + 3"
function parseCustomProblem(line) {
    if (line.includes('=')) {
        let parts = line.split('=');
        let display = parts[0].trim() + " =";
        let answer = Number(eval(parts[0].trim())).toString();
        return { display, answer };
    } else {
        let answer = Number(eval(line)).toString();
        return { display: line + " =", answer };
    }
}

function loadNewProblem() {
    let problem;
    if (customEquations.length > 0) {
        let line = customEquations[customIndex];
        problem = parseCustomProblem(line);
        customIndex = (customIndex + 1) % customEquations.length;
    } else {
        problem = generateRandomProblem();
    }

    currentEquationText = problem.display;
    targetAnswer = problem.answer;

    container.innerHTML = `<span class="word active" style="font-size: 40px; color: #34495e;">${currentEquationText} ?</span>`;
    isGameOver = false;
    transcriptDisplay.innerText = "Transcript: ";
}

nextBtn.addEventListener('click', () => {
    recognition.stop();
    clearInterval(boulderInterval);
    isListening = false;
    btn.innerText = "Start Game";
    loadNewProblem();
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

    let spokenAnswer = clean(latestResult);

    // Check if the spoken answer matches the correct target answer
    if (spokenAnswer === targetAnswer && spokenAnswer !== "") {
        snailPos += 30; // Move snail forward for a correct answer
        snail.style.left = snailPos + 'px';
        equationsSolved++;
        isBoulderPaused = false;

        if (equationsSolved < totalEquationsToWin) {
            loadNewProblem();
        } else {
            recognition.stop();
            clearInterval(boulderInterval);
            victoryScreen.style.display = 'flex';
        }
    }
};

document.getElementById('readBtn').addEventListener('click', () => {
    isBoulderPaused = true;
    clearInterval(boulderInterval);
    
    let textToRead = currentEquationText.replace('×', 'times').replace('÷', 'divided by').replace('=', 'equals');
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
    if (isListening) {
        recognition.stop();
        btn.innerText = "Start Game";
        isListening = false;
    } else {
        recognition.start();
        runCountdown(() => {
            isBoulderPaused = false;
            if (isGameOver) {
                equationsSolved = 0;
                loadNewProblem();
            }
            startBoulder();
        });
        btn.innerText = "Stop Game";
        isListening = true;
    }
});

restartBtn.addEventListener('click', () => {
    victoryScreen.style.display = 'none';
    equationsSolved = 0;
    loadNewProblem();
    btn.innerText = "Start Game";
    isListening = false;
});

retryBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    equationsSolved = 0;
    loadNewProblem();
    btn.innerText = "Start Game";
    isListening = false;
});
