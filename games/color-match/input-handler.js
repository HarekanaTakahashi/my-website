'use strict';

import { GAME_CONFIG } from './config/color-match-config.js';

/**
 * Handles keyboard input for the game
 */
export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.lastMoveTime = 0;
        this.lastRotateTime = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        // W key can start the game if not started
        if (e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            if (!this.game.gameStarted && !this.game.gameOver) {
                this.game.startGame();
                return;
            }
        }
        
        if (this.game.gameOver || this.game.isPaused || !this.game.gameStarted) return;
        
        this.keys[e.key] = true;
        const now = Date.now();
        
        // A key - Move left
        if (e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            if (now - this.lastMoveTime > GAME_CONFIG.MOVE_DELAY) {
                this.game.movePiece(-1);
                this.lastMoveTime = now;
            }
        }
        // D key - Move right
        else if (e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            if (now - this.lastMoveTime > GAME_CONFIG.MOVE_DELAY) {
                this.game.movePiece(1);
                this.lastMoveTime = now;
            }
        }
        // Left arrow - Rotate clockwise (reversed)
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (now - this.lastRotateTime > GAME_CONFIG.ROTATE_DELAY) {
                this.game.rotatePiece(true); // Clockwise
                this.lastRotateTime = now;
            }
        }
        // Right arrow - Rotate counter-clockwise (reversed)
        else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (now - this.lastRotateTime > GAME_CONFIG.ROTATE_DELAY) {
                this.game.rotatePiece(false); // Counter-clockwise
                this.lastRotateTime = now;
            }
        }
        // W key - Hard drop (animated drop at gravity speed)
        else if (e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            this.game.hardDrop();
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
    
    isFastFallActive() {
        return this.keys['s'] || this.keys['S'];
    }
}
