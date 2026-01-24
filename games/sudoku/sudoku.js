'use strict';

// Import puzzle presets and solutions
import { puzzles, solutions } from './data/sudoku-presets.js';
// Import puzzle generator
import { generateSudoku } from './sudoku-generator.js';

// Game state
let currentPuzzle = [];
let currentSolution = [];
let board = [];
let memos = []; // 9x9 array, each cell contains a Set of memo numbers
let selectedCell = null;
let inputMode = 'number'; // 'number' or 'memo'
let lives = 3;
let gameOver = false;
let useGenerator = false; // Toggle between preset and generated puzzles

// Initialize
function init() {
    newGame();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Mode toggle buttons
    document.getElementById('input-mode').addEventListener('click', () => {
        setInputMode('number');
    });
    
    document.getElementById('memo-mode').addEventListener('click', () => {
        setInputMode('memo');
    });

    // Number pad buttons
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const number = parseInt(btn.dataset.number);
            if (selectedCell !== null) {
                if (inputMode === 'number') {
                    placeNumber(selectedCell, number);
                } else {
                    toggleMemo(selectedCell, number);
                }
            }
        });
    });

    // Control buttons
    document.getElementById('new-game').addEventListener('click', newGame);
    document.getElementById('clear').addEventListener('click', clearBoard);
    
    // Generator toggle
    document.getElementById('use-generator').addEventListener('change', (e) => {
        useGenerator = e.target.checked;
        newGame(); // Start new game with new puzzle type
    });

    // Keyboard input
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '9') {
            const number = parseInt(e.key);
            if (selectedCell !== null) {
                if (inputMode === 'number') {
                    placeNumber(selectedCell, number);
                } else {
                    toggleMemo(selectedCell, number);
                }
            }
        } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
            if (selectedCell !== null) {
                placeNumber(selectedCell, 0);
            }
        } else if (e.key === 'm' || e.key === 'M') {
            // Toggle mode with 'm' key
            setInputMode(inputMode === 'number' ? 'memo' : 'number');
        }
    });
}

// Set input mode
function setInputMode(mode) {
    inputMode = mode;
    document.getElementById('input-mode').classList.toggle('active', mode === 'number');
    document.getElementById('memo-mode').classList.toggle('active', mode === 'memo');
}

// Start a new game
function newGame() {
    if (useGenerator) {
        // Generate a new random puzzle
        const difficulties = ['easy', 'medium', 'hard'];
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        const generated = generateSudoku(difficulty);
        currentPuzzle = generated.puzzle;
        currentSolution = generated.solution;
    } else {
        // Use preset puzzles
        const puzzleIndex = Math.floor(Math.random() * puzzles.length);
        currentPuzzle = puzzles[puzzleIndex];
        currentSolution = solutions[puzzleIndex];
    }
    
    // Copy puzzle to board
    board = currentPuzzle.map(row => [...row]);
    
    // Initialize memos
    memos = [];
    for (let i = 0; i < 9; i++) {
        memos[i] = [];
        for (let j = 0; j < 9; j++) {
            memos[i][j] = new Set();
        }
    }
    
    selectedCell = null;
    inputMode = 'number';
    lives = 3;
    gameOver = false;
    setInputMode('number');
    renderBoard();
    updateLivesDisplay();
    const puzzleType = useGenerator ? 'ランダム生成' : 'プリセット';
    setStatus(`新しいゲームを開始しました！（${puzzleType}）`, 'info');
}

// Clear user inputs
function clearBoard() {
    if (gameOver) return;
    
    board = currentPuzzle.map(row => [...row]);
    
    // Clear memos
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            memos[i][j].clear();
        }
    }
    
    selectedCell = null;
    renderBoard();
    setStatus('ボードをクリアしました', 'info');
}

// Toggle memo number
function toggleMemo(index, number) {
    if (gameOver) return;
    
    const row = Math.floor(index / 9);
    const col = index % 9;
    
    // Can't modify given cells
    if (currentPuzzle[row][col] !== 0) {
        return;
    }
    
    // Can't add memo if cell has a number
    if (board[row][col] !== 0) {
        return;
    }
    
    // Toggle memo
    if (memos[row][col].has(number)) {
        memos[row][col].delete(number);
    } else {
        memos[row][col].add(number);
    }
    
    renderBoard();
}

// Clear memos when placing a number
function clearRelatedMemos(row, col, number) {
    // Clear from same row
    for (let c = 0; c < 9; c++) {
        memos[row][c].delete(number);
    }
    
    // Clear from same column
    for (let r = 0; r < 9; r++) {
        memos[r][col].delete(number);
    }
    
    // Clear from same 3x3 block
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = blockRow; r < blockRow + 3; r++) {
        for (let c = blockCol; c < blockCol + 3; c++) {
            memos[r][c].delete(number);
        }
    }
}

// Render the board
function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            const value = board[row][col];
            const isGiven = currentPuzzle[row][col] !== 0;
            
            if (value !== 0) {
                cell.textContent = value;
                if (isGiven) {
                    cell.classList.add('given');
                } else {
                    cell.classList.add('user');
                }
            } else if (memos[row][col].size > 0) {
                // Display memos in 3x3 grid
                const memoContainer = document.createElement('div');
                memoContainer.className = 'memo-container';
                
                for (let i = 1; i <= 9; i++) {
                    const memoNum = document.createElement('div');
                    memoNum.className = 'memo-num';
                    if (memos[row][col].has(i)) {
                        memoNum.textContent = i;
                    }
                    memoContainer.appendChild(memoNum);
                }
                
                cell.appendChild(memoContainer);
            }
            
            const index = row * 9 + col;
            if (selectedCell === index && !isGiven) {
                cell.classList.add('selected');
            }
            
            // Check for errors
            if (!isGiven && value !== 0 && hasError(row, col, value)) {
                cell.classList.add('error');
            }
            
            // Add click listener
            if (!isGiven) {
                cell.addEventListener('click', () => {
                    selectedCell = index;
                    renderBoard();
                });
            }
            
            boardElement.appendChild(cell);
        }
    }
}

// Place a number in the selected cell
function placeNumber(index, number) {
    if (gameOver) return;
    
    const row = Math.floor(index / 9);
    const col = index % 9;
    
    // Can't modify given cells
    if (currentPuzzle[row][col] !== 0) {
        return;
    }
    
    // Clear memos in this cell
    if (number !== 0) {
        memos[row][col].clear();
        // Clear related memos in row, column, and block
        clearRelatedMemos(row, col, number);
    }
    
    board[row][col] = number;
    
    // Check if the number is wrong (doesn't match solution)
    if (number !== 0 && number !== currentSolution[row][col]) {
        lives--;
        updateLivesDisplay();
        
        if (lives <= 0) {
            gameOver = true;
            setStatus('💀 ゲームオーバー！ライフが0になりました', 'error');
            return;
        } else {
            setStatus(`❌ 間違えました！残りライフ: ${lives}`, 'error');
            renderBoard();
            return;
        }
    }
    
    renderBoard();
    
    // Check for completion
    if (isBoardComplete()) {
        if (isBoardCorrect()) {
            gameOver = true;
            setStatus('🎉 おめでとうございます！完成です！', 'success');
        } else {
            setStatus('❌ まだ間違いがあります', 'error');
        }
    } else if (number !== 0 && hasError(row, col, number)) {
        setStatus('⚠️ 重複があります！', 'error');
    } else {
        setStatus('', '');
    }
}

// Check if a placement has errors (duplicates in row, column, or block)
function hasError(row, col, value) {
    if (value === 0) return false;
    
    // Check row
    for (let c = 0; c < 9; c++) {
        if (c !== col && board[row][c] === value) {
            return true;
        }
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
        if (r !== row && board[r][col] === value) {
            return true;
        }
    }
    
    // Check 3x3 block
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = blockRow; r < blockRow + 3; r++) {
        for (let c = blockCol; c < blockCol + 3; c++) {
            if ((r !== row || c !== col) && board[r][c] === value) {
                return true;
            }
        }
    }
    
    return false;
}

// Check if board is complete (all cells filled)
function isBoardComplete() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                return false;
            }
        }
    }
    return true;
}

// Check if board is correct (matches solution)
function isBoardCorrect() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== currentSolution[row][col]) {
                return false;
            }
        }
    }
    return true;
}

// Set status message
function setStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = 'status ' + type;
}

// Update lives display
function updateLivesDisplay() {
    const livesElement = document.getElementById('lives');
    const hearts = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    livesElement.textContent = hearts;
}

// Start the game
init();
