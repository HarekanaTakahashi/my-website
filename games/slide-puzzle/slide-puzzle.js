'use strict';

import { GAME_CONFIG } from './config/slide-puzzle-config.js';

/**
 * Slide Puzzle Game
 * A sliding tile puzzle where players arrange numbered tiles in order
 */

class SlidePuzzle {
    constructor() {
        this.size = GAME_CONFIG.DEFAULT_SIZE;
        this.tiles = [];
        this.emptyPos = { row: 0, col: 0 };
        this.moves = 0;
        this.isAnimating = false;
        this.isGameWon = false;
        
        this.initElements();
        this.loadBestScore();
        this.setupEventListeners();
        this.initGame();
    }
    
    initElements() {
        this.boardEl = document.getElementById('board');
        this.moveCountEl = document.getElementById('move-count');
        this.bestMovesEl = document.getElementById('best-moves');
        this.sizeSelectEl = document.getElementById('size-select');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.gameMessageEl = document.getElementById('game-message');
        this.messageTitleEl = document.getElementById('message-title');
        this.messageTextEl = document.getElementById('message-text');
        this.newGameBtn = document.getElementById('new-game-btn');
    }
    
    setupEventListeners() {
        this.sizeSelectEl.addEventListener('change', () => {
            this.size = parseInt(this.sizeSelectEl.value);
            this.loadBestScore();
            this.initGame();
        });
        
        this.shuffleBtn.addEventListener('click', () => {
            if (!this.isAnimating) {
                this.shufflePuzzle();
            }
        });
        
        this.newGameBtn.addEventListener('click', () => {
            this.hideMessage();
            this.shufflePuzzle();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isAnimating || this.isGameWon) return;
            
            const keyMap = {
                'ArrowUp': { row: 1, col: 0 },
                'ArrowDown': { row: -1, col: 0 },
                'ArrowLeft': { row: 0, col: 1 },
                'ArrowRight': { row: 0, col: -1 }
            };
            
            if (keyMap[e.key]) {
                e.preventDefault();
                const direction = keyMap[e.key];
                const targetRow = this.emptyPos.row + direction.row;
                const targetCol = this.emptyPos.col + direction.col;
                
                if (this.isValidPosition(targetRow, targetCol)) {
                    this.moveTile(targetRow, targetCol);
                }
            }
        });
    }
    
    initGame() {
        this.moves = 0;
        this.isGameWon = false;
        this.updateMoveCount();
        this.createBoard();
        this.renderBoard();
    }
    
    createBoard() {
        this.tiles = [];
        let number = 1;
        
        for (let row = 0; row < this.size; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.size; col++) {
                if (row === this.size - 1 && col === this.size - 1) {
                    this.tiles[row][col] = 0; // Empty tile
                    this.emptyPos = { row, col };
                } else {
                    this.tiles[row][col] = number++;
                }
            }
        }
    }
    
    renderBoard() {
        this.boardEl.innerHTML = '';
        this.boardEl.className = `board size-${this.size}`;
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.tiles[row][col];
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = row;
                tile.dataset.col = col;
                
                if (value === 0) {
                    tile.classList.add('empty');
                } else {
                    tile.textContent = value;
                    tile.setAttribute('role', 'button');
                    tile.setAttribute('tabindex', '0');
                    tile.setAttribute('aria-label', `タイル ${value}`);
                    
                    // Check if tile is moveable
                    if (this.isAdjacentToEmpty(row, col)) {
                        tile.classList.add('moveable');
                    }
                    
                    tile.addEventListener('click', () => {
                        if (!this.isAnimating && !this.isGameWon) {
                            this.handleTileClick(row, col);
                        }
                    });
                    
                    tile.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (!this.isAnimating && !this.isGameWon) {
                                this.handleTileClick(row, col);
                            }
                        }
                    });
                }
                
                this.boardEl.appendChild(tile);
            }
        }
    }
    
    handleTileClick(row, col) {
        if (this.isAdjacentToEmpty(row, col)) {
            this.moveTile(row, col);
        }
    }
    
    isAdjacentToEmpty(row, col) {
        const rowDiff = Math.abs(row - this.emptyPos.row);
        const colDiff = Math.abs(col - this.emptyPos.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }
    
    moveTile(row, col) {
        if (!this.isAdjacentToEmpty(row, col)) return;
        
        this.isAnimating = true;
        
        // Swap tiles
        const temp = this.tiles[row][col];
        this.tiles[row][col] = this.tiles[this.emptyPos.row][this.emptyPos.col];
        this.tiles[this.emptyPos.row][this.emptyPos.col] = temp;
        
        this.emptyPos = { row, col };
        this.moves++;
        this.updateMoveCount();
        
        this.renderBoard();
        
        // Check win condition after animation
        setTimeout(() => {
            this.isAnimating = false;
            if (this.checkWin()) {
                this.handleWin();
            }
        }, GAME_CONFIG.ANIMATION_DURATION);
    }
    
    shufflePuzzle() {
        this.moves = 0;
        this.isGameWon = false;
        this.updateMoveCount();
        
        // Perform random valid moves
        const numMoves = Math.floor(
            Math.random() * (GAME_CONFIG.MAX_SHUFFLE_MOVES - GAME_CONFIG.MIN_SHUFFLE_MOVES + 1)
        ) + GAME_CONFIG.MIN_SHUFFLE_MOVES;
        
        for (let i = 0; i < numMoves; i++) {
            const validMoves = this.getValidMoves();
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            
            // Swap without animation
            const temp = this.tiles[randomMove.row][randomMove.col];
            this.tiles[randomMove.row][randomMove.col] = this.tiles[this.emptyPos.row][this.emptyPos.col];
            this.tiles[this.emptyPos.row][this.emptyPos.col] = temp;
            this.emptyPos = { row: randomMove.row, col: randomMove.col };
        }
        
        this.renderBoard();
    }
    
    getValidMoves() {
        const moves = [];
        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ];
        
        for (const dir of directions) {
            const newRow = this.emptyPos.row + dir.row;
            const newCol = this.emptyPos.col + dir.col;
            
            if (this.isValidPosition(newRow, newCol)) {
                moves.push({ row: newRow, col: newCol });
            }
        }
        
        return moves;
    }
    
    checkWin() {
        let expectedNumber = 1;
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (row === this.size - 1 && col === this.size - 1) {
                    // Last tile should be empty (0)
                    if (this.tiles[row][col] !== 0) return false;
                } else {
                    if (this.tiles[row][col] !== expectedNumber) return false;
                    expectedNumber++;
                }
            }
        }
        
        return true;
    }
    
    handleWin() {
        this.isGameWon = true;
        this.updateBestScore();
        this.showMessage(
            GAME_CONFIG.MESSAGES.WIN_TITLE,
            GAME_CONFIG.MESSAGES.WIN_TEXT_PREFIX + 
            this.moves + 
            GAME_CONFIG.MESSAGES.WIN_TEXT_SUFFIX
        );
    }
    
    updateMoveCount() {
        this.moveCountEl.textContent = this.moves;
    }
    
    loadBestScore() {
        const key = GAME_CONFIG.STORAGE_KEYS.BEST_MOVES_PREFIX + this.size;
        const best = localStorage.getItem(key);
        this.bestMovesEl.textContent = best || '-';
    }
    
    updateBestScore() {
        const key = GAME_CONFIG.STORAGE_KEYS.BEST_MOVES_PREFIX + this.size;
        const currentBest = localStorage.getItem(key);
        
        if (!currentBest || this.moves < parseInt(currentBest)) {
            localStorage.setItem(key, this.moves.toString());
            this.bestMovesEl.textContent = this.moves;
        }
    }
    
    showMessage(title, text) {
        this.messageTitleEl.textContent = title;
        this.messageTextEl.textContent = text;
        this.gameMessageEl.classList.add('show');
        this.gameMessageEl.setAttribute('aria-hidden', 'false');
        this.newGameBtn.focus();
    }
    
    hideMessage() {
        this.gameMessageEl.classList.remove('show');
        this.gameMessageEl.setAttribute('aria-hidden', 'true');
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SlidePuzzle();
});
