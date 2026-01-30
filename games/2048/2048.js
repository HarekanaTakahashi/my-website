'use strict';

// Import game configuration
import { GAME_CONFIG } from './config/2048-config.js';
import { BoardLogic } from './modules/board-logic.js';

class Game2048 {
    constructor() {
        this.size = GAME_CONFIG.BOARD_SIZE;
        this.board = [];
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.gameOver = false;
        this.won = false;
        this.boardLogic = new BoardLogic(this.size);
        
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
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.boardElement.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.boardElement.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        document.getElementById('new-game-btn').addEventListener('click', () => this.restart());
        document.getElementById('try-again-btn').addEventListener('click', () => this.restart());
    }
    
    handleKeyDown(e) {
        if (this.gameOver) return;
        
        const keyMap = {
            'ArrowUp': 'up', 'w': 'up', 'W': 'up',
            'ArrowDown': 'down', 's': 'down', 'S': 'down',
            'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
            'ArrowRight': 'right', 'd': 'right', 'D': 'right'
        };
        
        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            if (this.move(direction)) {
                this.addRandomTile();
                this.updateDisplay();
                this.checkGameState();
            }
        }
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchEnd(e) {
        if (this.gameOver) return;
        
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        const minSwipe = GAME_CONFIG.TOUCH.MIN_SWIPE_DISTANCE;
        
        let direction = null;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
            direction = dx > 0 ? 'right' : 'left';
        } else if (Math.abs(dy) > minSwipe) {
            direction = dy > 0 ? 'down' : 'up';
        }
        
        if (direction && this.move(direction)) {
            this.addRandomTile();
            this.updateDisplay();
            this.checkGameState();
        }
    }
    
    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) emptyCells.push({ row: i, col: j });
            }
        }
        
        if (emptyCells.length > 0) {
            const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[cell.row][cell.col] = Math.random() < GAME_CONFIG.TILE_SPAWN.VALUE_2_PROBABILITY ? 2 : 4;
        }
    }
    
    move(direction) {
        const oldBoard = JSON.stringify(this.board);
        const addScore = (points) => { this.score += points; };
        
        switch(direction) {
            case 'left': this.boardLogic.moveLeft(this.board, addScore); break;
            case 'right': this.boardLogic.moveRight(this.board, addScore); break;
            case 'up': this.boardLogic.moveUp(this.board, addScore); break;
            case 'down': this.boardLogic.moveDown(this.board, addScore); break;
        }
        
        return oldBoard !== JSON.stringify(this.board);
    }
    
    updateDisplay() {
        const existingTiles = this.boardElement.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());
        
        const cells = this.boardElement.querySelectorAll('.cell');
        if (cells.length === 0) return;
        
        const cellSize = cells[0].offsetWidth;
        const gap = 10;
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = this.board[i][j];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile ${value > 2048 ? 'tile-super' : `tile-${value}`}`;
                    tile.textContent = value;
                    tile.style.cssText = `width:${cellSize}px;height:${cellSize}px;left:${j*(cellSize+gap)+10}px;top:${i*(cellSize+gap)+10}px`;
                    this.boardElement.appendChild(tile);
                }
            }
        }
        
        this.currentScoreElement.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    checkGameState() {
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
        
        if (!this.boardLogic.canMove(this.board)) {
            this.gameOver = true;
            this.showMessage(GAME_CONFIG.MESSAGES.GAME_OVER_TITLE, `${GAME_CONFIG.MESSAGES.GAME_OVER_TEXT_PREFIX}${this.score}`);
        }
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
        try { localStorage.setItem(GAME_CONFIG.STORAGE_KEY, this.bestScore.toString()); } catch (e) { }
    }
    
    loadBestScore() {
        try { return parseInt(localStorage.getItem(GAME_CONFIG.STORAGE_KEY), 10) || 0; } catch (e) { return 0; }
    }
}

document.addEventListener('DOMContentLoaded', () => new Game2048());
