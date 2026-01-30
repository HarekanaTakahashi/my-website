'use strict';

import { BOARD_SIZE, STORAGE_KEY, LINE_CLEAR_MULTIPLIER, BLOCK_SHAPES, MESSAGES } from './config/block-puzzle-config.js';

class BlockPuzzle {
    constructor() {
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        this.currentPieces = [];
        this.selectedPiece = null;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        
        this.boardElement = document.getElementById('board');
        this.piecesElement = document.getElementById('pieces');
        this.currentScoreElement = document.getElementById('current-score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessageElement = document.getElementById('game-message');
        this.messageTitleElement = document.getElementById('message-title');
        this.messageTextElement = document.getElementById('message-text');
        
        this.init();
    }
    
    init() {
        this.renderBoard();
        this.generateNewPieces();
        this.updateScore();
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('try-again-btn').addEventListener('click', () => this.newGame());
        this.boardElement.addEventListener('mousemove', (e) => this.handleBoardHover(e));
        this.boardElement.addEventListener('mouseleave', () => this.clearHighlight());
        this.boardElement.addEventListener('click', (e) => this.handleBoardClick(e));
        this.piecesElement.addEventListener('click', (e) => {
            const pieceEl = e.target.closest('.piece');
            if (pieceEl && !pieceEl.classList.contains('used')) {
                this.selectedPiece = parseInt(pieceEl.dataset.index);
                this.renderPieces();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.selectedPiece = null;
                this.renderPieces();
                this.clearHighlight();
            }
        });
    }
    
    renderBoard() {
        this.boardElement.innerHTML = '';
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell' + (this.board[row][col] ? ' filled' : '');
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    generateNewPieces() {
        this.currentPieces = Array.from({ length: 3 }, () => ({
            shape: BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)],
            used: false
        }));
        this.renderPieces();
    }
    
    renderPieces() {
        this.piecesElement.innerHTML = '';
        this.currentPieces.forEach((piece, index) => {
            if (piece.used) return;
            
            const el = document.createElement('div');
            const isSelected = this.selectedPiece === index;
            el.className = 'piece' + (isSelected ? ' selected' : '');
            el.dataset.index = index;
            el.setAttribute('tabindex', '0');
            el.setAttribute('role', 'button');
            el.setAttribute('aria-label', `ブロック ${index + 1} を選択`);
            el.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            
            const shape = piece.shape;
            el.style.gridTemplateColumns = `repeat(${shape[0].length}, 20px)`;
            el.style.gridTemplateRows = `repeat(${shape.length}, 20px)`;
            
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[0].length; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'piece-cell' + (shape[r][c] ? ' filled' : '');
                    el.appendChild(cell);
                }
            }
            
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectedPiece = index;
                    this.renderPieces();
                }
            });
            
            this.piecesElement.appendChild(el);
        });
    }
    
    handleBoardHover(e) {
        if (this.selectedPiece === null) return;
        const cell = e.target.closest('.board-cell');
        if (!cell) { this.clearHighlight(); return; }
        this.highlightPlacement(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
    }
    
    handleBoardClick(e) {
        if (this.selectedPiece === null) return;
        const cell = e.target.closest('.board-cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const shape = this.currentPieces[this.selectedPiece].shape;
        
        if (this.canPlacePiece(row, col, shape)) {
            this.placePiece(row, col, shape);
            this.currentPieces[this.selectedPiece].used = true;
            this.selectedPiece = null;
            this.clearLines();
            this.renderBoard();
            this.renderPieces();
            
            if (this.currentPieces.every(p => p.used)) this.generateNewPieces();
            if (this.isGameOver()) this.showGameOver();
        }
    }
    
    highlightPlacement(row, col) {
        this.clearHighlight();
        const shape = this.currentPieces[this.selectedPiece].shape;
        const canPlace = this.canPlacePiece(row, col, shape);
        
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c] === 1) {
                    const tr = row + r, tc = col + c;
                    if (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE) {
                        const cell = this.boardElement.querySelector(`[data-row="${tr}"][data-col="${tc}"]`);
                        if (cell) cell.classList.add(canPlace ? 'highlight' : 'invalid');
                    }
                }
            }
        }
    }
    
    clearHighlight() {
        this.boardElement.querySelectorAll('.board-cell').forEach(c => c.classList.remove('highlight', 'invalid'));
    }
    
    canPlacePiece(row, col, shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c] === 1) {
                    const tr = row + r, tc = col + c;
                    if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE || this.board[tr][tc]) return false;
                }
            }
        }
        return true;
    }
    
    placePiece(row, col, shape) {
        let cells = 0;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c]) { this.board[row + r][col + c] = 1; cells++; }
            }
        }
        this.addScore(cells);
    }
    
    clearLines() {
        const rows = [], cols = [];
        for (let r = 0; r < BOARD_SIZE; r++) if (this.board[r].every(c => c === 1)) rows.push(r);
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (this.board.every(row => row[c] === 1)) cols.push(c);
        }
        rows.forEach(r => this.board[r].fill(0));
        cols.forEach(c => this.board.forEach(row => row[c] = 0));
        if (rows.length + cols.length > 0) this.addScore((rows.length + cols.length) * BOARD_SIZE * LINE_CLEAR_MULTIPLIER);
    }
    
    isGameOver() {
        for (const piece of this.currentPieces) {
            if (piece.used) continue;
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (this.canPlacePiece(r, c, piece.shape)) return false;
                }
            }
        }
        return true;
    }
    
    addScore(points) { this.score += points; this.updateScore(); }
    
    updateScore() {
        this.currentScoreElement.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem(STORAGE_KEY, this.bestScore.toString());
        }
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    showGameOver() {
        this.messageTitleElement.textContent = MESSAGES.GAME_OVER;
        this.messageTextElement.textContent = `${MESSAGES.SCORE_PREFIX}${this.score}`;
        this.gameMessageElement.classList.add('show');
    }
    
    newGame() {
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        this.score = 0;
        this.selectedPiece = null;
        this.gameMessageElement.classList.remove('show');
        this.renderBoard();
        this.generateNewPieces();
        this.updateScore();
    }
}

document.addEventListener('DOMContentLoaded', () => new BlockPuzzle());
