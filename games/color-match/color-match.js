'use strict';

import { GAME_CONFIG } from './config/color-match-config.js';
import { ColorSetGenerator } from './data/color-match-presets.js';
import { InputHandler } from './input-handler.js';
import { Renderer } from './renderer.js';
import { BoardManager } from './board-manager.js';
import { PieceManager } from './piece-manager.js';

class ColorMatchGame {
    constructor() {
        // DOM elements
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextPieceElement = document.getElementById('next-piece');
        this.currentScoreElement = document.getElementById('current-score');
        this.bestScoreElement = document.getElementById('best-score');
        this.chainDisplayElement = document.getElementById('chain-display');
        this.gameMessageElement = document.getElementById('game-message');
        this.messageTitleElement = document.getElementById('message-title');
        this.messageTextElement = document.getElementById('message-text');
        
        // Game managers
        this.colorGenerator = new ColorSetGenerator(GAME_CONFIG.COLORS);
        this.inputHandler = new InputHandler(this);
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.boardManager = new BoardManager();
        this.pieceManager = new PieceManager(this.colorGenerator);
        
        // Game state
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.gameOver = false;
        this.isPaused = false;
        this.chainCount = 0;
        
        // Timing
        this.fallTimer = null;
        this.groundTimer = null;
        this.groundDelayCount = 0;
        
        this.init();
    }
    
    init() {
        this.currentPiece = this.pieceManager.generatePiece();
        this.nextPiece = this.pieceManager.generatePiece();
        this.setupUIEventListeners();
        this.updateDisplay();
        this.renderer.renderNextPiece(this.nextPieceElement, this.nextPiece);
        this.startGameLoop();
    }
    
    setupUIEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('try-again-btn').addEventListener('click', () => {
            this.hideMessage();
            this.resetGame();
        });
    }
    
    startGameLoop() {
        this.fallTimer = setInterval(() => {
            if (!this.gameOver && !this.isPaused) {
                this.updateGame();
            }
        }, GAME_CONFIG.FALL_INTERVAL);
    }
    
    updateGame() {
        if (this.currentPiece && this.currentPiece.isFalling) {
            const isFastFall = this.inputHandler.isFastFallActive();
            
            if (this.pieceManager.canMovePiece(this.boardManager.getBoard(), this.currentPiece, 0, 1)) {
                this.currentPiece.row++;
                this.currentPiece.touchingGround = false;
                this.groundDelayCount = 0;
                
                if (this.groundTimer) {
                    clearTimeout(this.groundTimer);
                    this.groundTimer = null;
                }
            } else {
                if (!this.currentPiece.touchingGround) {
                    this.currentPiece.touchingGround = true;
                    this.startGroundDelay();
                }
            }
            
            this.renderer.render(this.boardManager.getBoard(), this.currentPiece);
        }
    }
    
    startGroundDelay() {
        if (this.groundTimer) {
            clearTimeout(this.groundTimer);
        }
        
        this.groundTimer = setTimeout(() => {
            this.lockPiece();
        }, GAME_CONFIG.GROUND_DELAY);
    }
    
    movePiece(direction) {
        if (!this.currentPiece || !this.currentPiece.isFalling) return;
        
        if (this.pieceManager.canMovePiece(this.boardManager.getBoard(), this.currentPiece, direction, 0)) {
            this.currentPiece.col += direction;
            
            if (this.currentPiece.touchingGround && this.groundDelayCount < GAME_CONFIG.MAX_GROUND_DELAY_EXTENSIONS) {
                this.groundDelayCount++;
                this.startGroundDelay();
            }
            
            this.renderer.render(this.boardManager.getBoard(), this.currentPiece);
        }
    }
    
    rotatePiece(clockwise) {
        if (!this.currentPiece || !this.currentPiece.isFalling) return;
        
        const rotated = this.pieceManager.rotatePiece(
            this.boardManager.getBoard(),
            this.currentPiece,
            clockwise
        );
        
        if (rotated && this.currentPiece.touchingGround && 
            this.groundDelayCount < GAME_CONFIG.MAX_GROUND_DELAY_EXTENSIONS) {
            this.groundDelayCount++;
            this.startGroundDelay();
        }
        
        this.renderer.render(this.boardManager.getBoard(), this.currentPiece);
    }
    
    instantDrop() {
        if (!this.currentPiece || !this.currentPiece.isFalling) return;
        
        while (this.pieceManager.canMovePiece(this.boardManager.getBoard(), this.currentPiece, 0, 1)) {
            this.currentPiece.row++;
        }
        
        this.lockPiece();
        this.renderer.render(this.boardManager.getBoard(), this.currentPiece);
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        if (this.groundTimer) {
            clearTimeout(this.groundTimer);
            this.groundTimer = null;
        }
        
        this.boardManager.placeBalls(this.currentPiece);
        this.currentPiece = null;
        this.groundDelayCount = 0;
        
        this.processMatches();
    }
    
    async processMatches() {
        this.isPaused = true;
        let currentChain = 0;
        
        while (true) {
            const matches = this.boardManager.findMatches();
            
            if (matches.length === 0) break;
            
            currentChain++;
            this.chainCount = currentChain;
            
            if (currentChain > 1) {
                this.chainDisplayElement.textContent = `${currentChain} ${GAME_CONFIG.MESSAGES.COMBO}!`;
            }
            
            const clearedCount = matches.length;
            const uniqueColors = new Set(matches.map(m => 
                this.boardManager.getBoard()[m.row][m.col]
            )).size;
            const multiplier = GAME_CONFIG.CHAIN_MULTIPLIER[
                Math.min(currentChain - 1, GAME_CONFIG.CHAIN_MULTIPLIER.length - 1)
            ];
            const points = (clearedCount * GAME_CONFIG.BASE_CLEAR_SCORE + 
                          uniqueColors * GAME_CONFIG.COLOR_BONUS) * multiplier;
            
            this.score += points;
            this.updateDisplay();
            
            this.boardManager.clearMatches(matches);
            this.renderer.render(this.boardManager.getBoard(), this.currentPiece);
            await this.sleep(GAME_CONFIG.CLEAR_ANIMATION_DURATION);
            
            this.boardManager.applyGravity();
            this.renderer.render(this.boardManager.getBoard(), this.currentPiece);
            await this.sleep(GAME_CONFIG.CHAIN_DELAY);
        }
        
        setTimeout(() => {
            this.chainDisplayElement.textContent = '';
        }, 1000);
        
        this.chainCount = 0;
        this.isPaused = false;
        
        if (this.boardManager.isGameOver()) {
            this.endGame();
        } else {
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.pieceManager.generatePiece();
            this.renderer.renderNextPiece(this.nextPieceElement, this.nextPiece);
            this.renderer.render(this.boardManager.getBoard(), this.currentPiece);
        }
    }
    
    endGame() {
        this.gameOver = true;
        
        if (this.fallTimer) {
            clearInterval(this.fallTimer);
        }
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
            this.updateDisplay();
        }
        
        this.showMessage(GAME_CONFIG.MESSAGES.GAME_OVER_TITLE, GAME_CONFIG.MESSAGES.GAME_OVER_TEXT);
    }
    
    resetGame() {
        if (this.fallTimer) {
            clearInterval(this.fallTimer);
        }
        if (this.groundTimer) {
            clearTimeout(this.groundTimer);
        }
        
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.chainCount = 0;
        this.groundDelayCount = 0;
        this.chainDisplayElement.textContent = '';
        
        this.colorGenerator = new ColorSetGenerator(GAME_CONFIG.COLORS);
        this.pieceManager = new PieceManager(this.colorGenerator);
        this.boardManager.reset();
        
        this.currentPiece = this.pieceManager.generatePiece();
        this.nextPiece = this.pieceManager.generatePiece();
        this.updateDisplay();
        this.renderer.renderNextPiece(this.nextPieceElement, this.nextPiece);
        this.renderer.render(this.boardManager.getBoard(), this.currentPiece);
        this.startGameLoop();
    }
    
    updateDisplay() {
        this.currentScoreElement.textContent = this.score;
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    showMessage(title, text) {
        this.messageTitleElement.textContent = title;
        this.messageTextElement.textContent = text;
        this.gameMessageElement.classList.add('show');
    }
    
    hideMessage() {
        this.gameMessageElement.classList.remove('show');
    }
    
    loadBestScore() {
        const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEY_BEST_SCORE);
        return saved ? parseInt(saved, 10) : 0;
    }
    
    saveBestScore() {
        localStorage.setItem(GAME_CONFIG.STORAGE_KEY_BEST_SCORE, this.bestScore.toString());
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ColorMatchGame();
});
