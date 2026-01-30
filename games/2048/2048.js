'use strict';

// Import game configuration
import { GAME_CONFIG } from './config/2048-config.js';

class Game2048 {
    constructor() {
        this.size = GAME_CONFIG.BOARD_SIZE;
        this.board = [];
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.gameOver = false;
        this.won = false;
        
        this.boardElement = document.getElementById('board');
        this.currentScoreElement = document.getElementById('current-score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessageElement = document.getElementById('game-message');
        this.messageTitleElement = document.getElementById('message-title');
        this.messageTextElement = document.getElementById('message-text');
        
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.init();
    }
    
    init() {
        this.setupBoard();
        this.addRandomTile();
        this.addRandomTile();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupBoard() {
        this.board = [];
        for (let i = 0; i < this.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.board[i][j] = 0;
            }
        }
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            let moved = false;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    moved = this.move('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    moved = this.move('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    moved = this.move('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    moved = this.move('right');
                    break;
            }
            
            if (moved) {
                this.addRandomTile();
                this.updateDisplay();
                this.checkGameState();
            }
        });
        
        // Touch controls
        this.boardElement.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        this.boardElement.addEventListener('touchend', (e) => {
            if (this.gameOver) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;
            
            const minSwipeDistance = GAME_CONFIG.TOUCH.MIN_SWIPE_DISTANCE;
            
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
                // Horizontal swipe
                const moved = dx > 0 ? this.move('right') : this.move('left');
                if (moved) {
                    this.addRandomTile();
                    this.updateDisplay();
                    this.checkGameState();
                }
            } else if (Math.abs(dy) > minSwipeDistance) {
                // Vertical swipe
                const moved = dy > 0 ? this.move('down') : this.move('up');
                if (moved) {
                    this.addRandomTile();
                    this.updateDisplay();
                    this.checkGameState();
                }
            }
        }, { passive: true });
        
        // New game button
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.restart();
        });
        
        // Try again button
        document.getElementById('try-again-btn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < GAME_CONFIG.TILE_SPAWN.VALUE_2_PROBABILITY ? 2 : 4;
            this.board[randomCell.row][randomCell.col] = value;
        }
    }
    
    move(direction) {
        const oldBoard = JSON.stringify(this.board);
        
        switch(direction) {
            case 'left':
                this.moveLeft();
                break;
            case 'right':
                this.moveRight();
                break;
            case 'up':
                this.moveUp();
                break;
            case 'down':
                this.moveDown();
                break;
        }
        
        return oldBoard !== JSON.stringify(this.board);
    }
    
    moveLeft() {
        for (let i = 0; i < this.size; i++) {
            let row = this.board[i].filter(val => val !== 0);
            
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j + 1, 1);
                }
            }
            
            while (row.length < this.size) {
                row.push(0);
            }
            
            this.board[i] = row;
        }
    }
    
    moveRight() {
        for (let i = 0; i < this.size; i++) {
            let row = this.board[i].filter(val => val !== 0);
            
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j - 1, 1);
                    j--;
                }
            }
            
            while (row.length < this.size) {
                row.unshift(0);
            }
            
            this.board[i] = row;
        }
    }
    
    moveUp() {
        for (let j = 0; j < this.size; j++) {
            let col = [];
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== 0) {
                    col.push(this.board[i][j]);
                }
            }
            
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2;
                    this.score += col[i];
                    col.splice(i + 1, 1);
                }
            }
            
            while (col.length < this.size) {
                col.push(0);
            }
            
            for (let i = 0; i < this.size; i++) {
                this.board[i][j] = col[i];
            }
        }
    }
    
    moveDown() {
        for (let j = 0; j < this.size; j++) {
            let col = [];
            for (let i = 0; i < this.size; i++) {
                if (this.board[i][j] !== 0) {
                    col.push(this.board[i][j]);
                }
            }
            
            for (let i = col.length - 1; i > 0; i--) {
                if (col[i] === col[i - 1]) {
                    col[i] *= 2;
                    this.score += col[i];
                    col.splice(i - 1, 1);
                    i--;
                }
            }
            
            while (col.length < this.size) {
                col.unshift(0);
            }
            
            for (let i = 0; i < this.size; i++) {
                this.board[i][j] = col[i];
            }
        }
    }
    
    updateDisplay() {
        // Clear existing tiles
        const existingTiles = this.boardElement.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());
        
        // Get cell size
        const cells = this.boardElement.querySelectorAll('.cell');
        if (cells.length === 0) return;
        
        const cellSize = cells[0].offsetWidth;
        const gap = 10;
        
        // Add tiles
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = this.board[i][j];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    
                    if (value > 2048) {
                        tile.classList.add('tile-super');
                    } else {
                        tile.classList.add(`tile-${value}`);
                    }
                    
                    tile.textContent = value;
                    
                    const left = j * (cellSize + gap) + 10;
                    const top = i * (cellSize + gap) + 10;
                    
                    tile.style.width = cellSize + 'px';
                    tile.style.height = cellSize + 'px';
                    tile.style.left = left + 'px';
                    tile.style.top = top + 'px';
                    
                    this.boardElement.appendChild(tile);
                }
            }
        }
        
        // Update score
        this.currentScoreElement.textContent = this.score;
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    checkGameState() {
        // Check for 2048 win
        if (!this.won) {
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.board[i][j] === GAME_CONFIG.WIN_TILE) {
                        this.won = true;
                        this.showMessage(GAME_CONFIG.MESSAGES.WIN_TITLE, GAME_CONFIG.MESSAGES.WIN_TEXT);
                        return;
                    }
                }
            }
        }
        
        // Check for game over
        if (!this.canMove()) {
            this.gameOver = true;
            this.showMessage(GAME_CONFIG.MESSAGES.GAME_OVER_TITLE, `${GAME_CONFIG.MESSAGES.GAME_OVER_TEXT_PREFIX}${this.score}`);
        }
    }
    
    canMove() {
        // Check for empty cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    return true;
                }
            }
        }
        
        // Check for possible merges
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const current = this.board[i][j];
                
                // Check right
                if (j < this.size - 1 && current === this.board[i][j + 1]) {
                    return true;
                }
                
                // Check down
                if (i < this.size - 1 && current === this.board[i + 1][j]) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    showMessage(title, text) {
        this.messageTitleElement.textContent = title;
        this.messageTextElement.textContent = text;
        this.gameMessageElement.classList.add('visible');
    }
    
    hideMessage() {
        this.gameMessageElement.classList.remove('visible');
    }
    
    restart() {
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.hideMessage();
        this.setupBoard();
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
    }
    
    saveBestScore() {
        try {
            localStorage.setItem(GAME_CONFIG.STORAGE_KEY, this.bestScore.toString());
        } catch (e) {
            // LocalStorage not available
        }
    }
    
    loadBestScore() {
        try {
            const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEY);
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Game2048();
    });
} else {
    new Game2048();
}
