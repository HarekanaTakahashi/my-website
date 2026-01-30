'use strict';

import { PUZZLES, calculateHints } from './data/picross-presets.js';
import { GAME_CONFIG } from './config/picross-config.js';

/**
 * Picross Game Implementation
 */

class PicrossGame {
    constructor() {
        this.currentPuzzle = null;
        this.puzzleData = null;
        this.playerGrid = null;
        this.rowHints = null;
        this.colHints = null;
        this.lives = GAME_CONFIG.MAX_LIVES;
        this.startTime = null;
        this.timerInterval = null;
        this.gameOver = false;
        this.completed = false;
        
        this.initElements();
        this.initEventListeners();
        this.loadBestTimes();
        this.populatePuzzleSelector();
        this.loadSavedGame();
    }
    
    initElements() {
        this.elements = {
            puzzleName: document.getElementById('puzzle-name'),
            puzzleDifficulty: document.getElementById('puzzle-difficulty'),
            lives: document.getElementById('lives'),
            timer: document.getElementById('timer'),
            puzzleSelect: document.getElementById('puzzle-select'),
            newGameBtn: document.getElementById('new-game'),
            clearBtn: document.getElementById('clear-board'),
            boardContainer: document.getElementById('board-container'),
            status: document.getElementById('status'),
            gameMessage: document.getElementById('game-message'),
            messageTitle: document.getElementById('message-title'),
            messageText: document.getElementById('message-text'),
            tryAgainBtn: document.getElementById('try-again-btn'),
            bestTimesList: document.getElementById('best-times-list')
        };
    }
    
    initEventListeners() {
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.elements.clearBtn.addEventListener('click', () => this.clearBoard());
        this.elements.puzzleSelect.addEventListener('change', (e) => {
            const puzzleId = e.target.value;
            this.loadPuzzle(puzzleId);
        });
        this.elements.tryAgainBtn.addEventListener('click', () => {
            this.hideMessage();
            this.startNewGame();
        });
        
        // Prevent context menu on right-click
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('cell')) {
                e.preventDefault();
            }
        });
    }
    
    populatePuzzleSelector() {
        this.elements.puzzleSelect.innerHTML = '';
        PUZZLES.forEach(puzzle => {
            const option = document.createElement('option');
            option.value = puzzle.id;
            option.textContent = `${puzzle.name} (${puzzle.difficulty})`;
            this.elements.puzzleSelect.appendChild(option);
        });
    }
    
    loadSavedGame() {
        const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.CURRENT_PUZZLE);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.loadPuzzle(data.puzzleId, data.playerGrid, data.lives, data.startTime);
                return;
            } catch (e) {
                console.error('Failed to load saved game:', e);
            }
        }
        // Start with first puzzle if no saved game
        this.loadPuzzle(PUZZLES[0].id);
    }
    
    saveGame() {
        if (!this.gameOver && !this.completed) {
            const data = {
                puzzleId: this.currentPuzzle.id,
                playerGrid: this.playerGrid,
                lives: this.lives,
                startTime: this.startTime
            };
            localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.CURRENT_PUZZLE, JSON.stringify(data));
        }
    }
    
    loadPuzzle(puzzleId, savedGrid = null, savedLives = null, savedStartTime = null) {
        this.currentPuzzle = PUZZLES.find(p => p.id === puzzleId);
        if (!this.currentPuzzle) return;
        
        const size = this.currentPuzzle.size;
        this.puzzleData = calculateHints(this.currentPuzzle.solution);
        this.rowHints = this.puzzleData.rowHints;
        this.colHints = this.puzzleData.colHints;
        
        // Initialize or restore player grid
        if (savedGrid) {
            this.playerGrid = savedGrid;
            this.lives = savedLives || GAME_CONFIG.MAX_LIVES;
            this.startTime = savedStartTime || Date.now();
        } else {
            this.playerGrid = Array(size).fill(null).map(() => Array(size).fill(GAME_CONFIG.CELL_STATE.EMPTY));
            this.lives = GAME_CONFIG.MAX_LIVES;
            this.startTime = Date.now();
        }
        
        this.gameOver = false;
        this.completed = false;
        
        this.elements.puzzleSelect.value = puzzleId;
        this.elements.puzzleName.textContent = this.currentPuzzle.name;
        this.elements.puzzleDifficulty.textContent = this.currentPuzzle.difficulty;
        
        this.updateLives();
        this.renderBoard();
        this.startTimer();
        this.saveGame();
    }
    
    startNewGame() {
        if (!this.gameOver && !this.completed && this.playerGrid.some(row => row.some(cell => cell !== GAME_CONFIG.CELL_STATE.EMPTY))) {
            if (!confirm(GAME_CONFIG.MESSAGES.CONFIRM_NEW_GAME)) {
                return;
            }
        }
        const puzzleId = this.elements.puzzleSelect.value;
        this.loadPuzzle(puzzleId);
    }
    
    clearBoard() {
        if (confirm('盤面をクリアしますか？')) {
            const size = this.currentPuzzle.size;
            this.playerGrid = Array(size).fill(null).map(() => Array(size).fill(GAME_CONFIG.CELL_STATE.EMPTY));
            this.renderBoard();
            this.saveGame();
        }
    }
    
    renderBoard() {
        const size = this.currentPuzzle.size;
        const cellSize = Math.min(25, Math.floor((window.innerHeight - 200) / (size + 5)));
        
        // Create board structure
        const wrapper = document.createElement('div');
        wrapper.className = 'board-wrapper';
        
        // Corner (empty space)
        const corner = document.createElement('div');
        corner.className = 'corner';
        wrapper.appendChild(corner);
        
        // Column hints
        const colHintsContainer = document.createElement('div');
        colHintsContainer.className = 'col-hints';
        const maxColHintLength = Math.max(...this.colHints.map(h => h.length));
        
        for (let col = 0; col < size; col++) {
            const colHint = document.createElement('div');
            colHint.className = 'col-hint';
            colHint.style.width = `${cellSize}px`;
            colHint.style.minHeight = `${maxColHintLength * 15}px`;
            
            this.colHints[col].forEach(num => {
                const span = document.createElement('span');
                span.className = 'hint-number';
                span.textContent = num;
                span.dataset.col = col;
                span.dataset.value = num;
                colHint.appendChild(span);
            });
            
            colHintsContainer.appendChild(colHint);
        }
        wrapper.appendChild(colHintsContainer);
        
        // Row hints
        const rowHintsContainer = document.createElement('div');
        rowHintsContainer.className = 'row-hints';
        const maxRowHintLength = Math.max(...this.rowHints.map(h => h.length));
        
        for (let row = 0; row < size; row++) {
            const rowHint = document.createElement('div');
            rowHint.className = 'row-hint';
            rowHint.style.height = `${cellSize}px`;
            rowHint.style.minWidth = `${maxRowHintLength * 20}px`;
            
            this.rowHints[row].forEach(num => {
                const span = document.createElement('span');
                span.className = 'hint-number';
                span.textContent = num;
                span.dataset.row = row;
                span.dataset.value = num;
                rowHint.appendChild(span);
            });
            
            rowHintsContainer.appendChild(rowHint);
        }
        wrapper.appendChild(rowHintsContainer);
        
        // Board grid
        const board = document.createElement('div');
        board.className = 'board';
        board.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
        board.style.gridTemplateRows = `repeat(${size}, ${cellSize}px)`;
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Apply current state
                if (this.playerGrid[row][col] === GAME_CONFIG.CELL_STATE.FILLED) {
                    cell.classList.add('filled');
                } else if (this.playerGrid[row][col] === GAME_CONFIG.CELL_STATE.MARKED) {
                    cell.classList.add('marked');
                }
                
                // Left click - fill
                cell.addEventListener('click', () => this.handleCellClick(row, col, 'fill'));
                
                // Right click - mark
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleCellClick(row, col, 'mark');
                });
                
                board.appendChild(cell);
            }
        }
        wrapper.appendChild(board);
        
        this.elements.boardContainer.innerHTML = '';
        this.elements.boardContainer.appendChild(wrapper);
        
        this.updateHintStyles();
    }
    
    handleCellClick(row, col, action) {
        if (this.gameOver || this.completed) return;
        
        const currentState = this.playerGrid[row][col];
        
        if (action === 'fill') {
            if (currentState === GAME_CONFIG.CELL_STATE.FILLED) {
                // Toggle off
                this.playerGrid[row][col] = GAME_CONFIG.CELL_STATE.EMPTY;
            } else {
                // Fill cell
                this.playerGrid[row][col] = GAME_CONFIG.CELL_STATE.FILLED;
                
                // Check if correct
                if (this.currentPuzzle.solution[row][col] !== 1) {
                    this.loseLife();
                    this.showError(row, col);
                    // Remove incorrect fill
                    this.playerGrid[row][col] = GAME_CONFIG.CELL_STATE.EMPTY;
                }
            }
        } else if (action === 'mark') {
            if (currentState === GAME_CONFIG.CELL_STATE.MARKED) {
                // Toggle off
                this.playerGrid[row][col] = GAME_CONFIG.CELL_STATE.EMPTY;
            } else if (currentState === GAME_CONFIG.CELL_STATE.EMPTY) {
                // Mark cell
                this.playerGrid[row][col] = GAME_CONFIG.CELL_STATE.MARKED;
            }
        }
        
        this.renderBoard();
        this.checkCompletion();
        this.saveGame();
    }
    
    showError(row, col) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('error');
            setTimeout(() => cell.classList.remove('error'), 300);
        }
    }
    
    updateHintStyles() {
        const size = this.currentPuzzle.size;
        
        // Check row hints
        for (let row = 0; row < size; row++) {
            const rowCells = this.playerGrid[row];
            const filled = rowCells.map((cell, col) => cell === GAME_CONFIG.CELL_STATE.FILLED ? 1 : 0);
            const hints = this.calculateRowHints(filled);
            const isComplete = JSON.stringify(hints) === JSON.stringify(this.rowHints[row]);
            
            document.querySelectorAll(`.hint-number[data-row="${row}"]`).forEach(span => {
                if (isComplete) {
                    span.classList.add('hint-complete');
                } else {
                    span.classList.remove('hint-complete');
                }
            });
        }
        
        // Check column hints
        for (let col = 0; col < size; col++) {
            const colCells = [];
            for (let row = 0; row < size; row++) {
                colCells.push(this.playerGrid[row][col] === GAME_CONFIG.CELL_STATE.FILLED ? 1 : 0);
            }
            const hints = this.calculateRowHints(colCells);
            const isComplete = JSON.stringify(hints) === JSON.stringify(this.colHints[col]);
            
            document.querySelectorAll(`.hint-number[data-col="${col}"]`).forEach(span => {
                if (isComplete) {
                    span.classList.add('hint-complete');
                } else {
                    span.classList.remove('hint-complete');
                }
            });
        }
    }
    
    calculateRowHints(cells) {
        const hints = [];
        let count = 0;
        for (let i = 0; i < cells.length; i++) {
            if (cells[i] === 1) {
                count++;
            } else if (count > 0) {
                hints.push(count);
                count = 0;
            }
        }
        if (count > 0) hints.push(count);
        return hints.length > 0 ? hints : [0];
    }
    
    loseLife() {
        this.lives--;
        this.updateLives();
        
        if (this.lives <= 0) {
            this.endGame(false);
        }
    }
    
    updateLives() {
        this.elements.lives.textContent = '❤️'.repeat(Math.max(0, this.lives));
    }
    
    checkCompletion() {
        const size = this.currentPuzzle.size;
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const shouldBeFilled = this.currentPuzzle.solution[row][col] === 1;
                const isFilled = this.playerGrid[row][col] === GAME_CONFIG.CELL_STATE.FILLED;
                
                if (shouldBeFilled !== isFilled) {
                    return;
                }
            }
        }
        
        // All correct!
        this.endGame(true);
    }
    
    endGame(won) {
        this.gameOver = true;
        this.completed = won;
        this.stopTimer();
        
        if (won) {
            const timeTaken = this.getElapsedTime();
            this.saveBestTime(this.currentPuzzle.id, timeTaken);
            this.showMessage(
                GAME_CONFIG.MESSAGES.WIN_TITLE,
                `${GAME_CONFIG.MESSAGES.WIN_TEXT}\nタイム: ${this.formatTime(timeTaken)}`
            );
        } else {
            this.showMessage(
                GAME_CONFIG.MESSAGES.GAME_OVER_TITLE,
                GAME_CONFIG.MESSAGES.GAME_OVER_TEXT
            );
        }
        
        localStorage.removeItem(GAME_CONFIG.STORAGE_KEYS.CURRENT_PUZZLE);
    }
    
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            const elapsed = this.getElapsedTime();
            this.elements.timer.textContent = this.formatTime(elapsed);
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    saveBestTime(puzzleId, time) {
        const bestTimes = this.loadBestTimes();
        if (!bestTimes[puzzleId] || time < bestTimes[puzzleId]) {
            bestTimes[puzzleId] = time;
            localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.BEST_TIMES, JSON.stringify(bestTimes));
            this.displayBestTimes();
        }
    }
    
    loadBestTimes() {
        try {
            const stored = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.BEST_TIMES);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }
    
    displayBestTimes() {
        const bestTimes = this.loadBestTimes();
        this.elements.bestTimesList.innerHTML = '';
        
        PUZZLES.forEach(puzzle => {
            if (bestTimes[puzzle.id]) {
                const div = document.createElement('div');
                div.className = 'best-time-item';
                div.textContent = `${puzzle.name}: ${this.formatTime(bestTimes[puzzle.id])}`;
                this.elements.bestTimesList.appendChild(div);
            }
        });
    }
    
    showMessage(title, text) {
        this.elements.messageTitle.textContent = title;
        this.elements.messageText.textContent = text;
        this.elements.gameMessage.classList.add('show');
    }
    
    hideMessage() {
        this.elements.gameMessage.classList.remove('show');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PicrossGame();
});
