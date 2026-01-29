'use strict';

import { GAME_CONFIG } from './config/color-match-config.js';
import { ColorSetGenerator } from './data/color-match-presets.js';

class ColorMatchGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextPieceElement = document.getElementById('next-piece');
        this.currentScoreElement = document.getElementById('current-score');
        this.bestScoreElement = document.getElementById('best-score');
        this.chainDisplayElement = document.getElementById('chain-display');
        this.gameMessageElement = document.getElementById('game-message');
        this.messageTitleElement = document.getElementById('message-title');
        this.messageTextElement = document.getElementById('message-text');
        
        // Game state
        this.cellSize = 60;
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.gameOver = false;
        this.isPaused = false;
        this.chainCount = 0;
        
        // Color generator
        this.colorGenerator = new ColorSetGenerator(GAME_CONFIG.COLORS);
        
        // Timing
        this.fallTimer = null;
        this.groundTimer = null;
        this.groundDelayCount = 0;
        this.lastMoveTime = 0;
        this.lastRotateTime = 0;
        
        // Input state
        this.keys = {};
        
        this.init();
    }
    
    init() {
        this.setupBoard();
        this.currentPiece = this.generatePiece();
        this.nextPiece = this.generatePiece();
        this.setupEventListeners();
        this.updateDisplay();
        this.renderNextPiece();
        this.startGameLoop();
    }
    
    setupBoard() {
        this.board = [];
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            this.board[row] = [];
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                this.board[row][col] = GAME_CONFIG.EMPTY;
            }
        }
    }
    
    generatePiece() {
        const [color1, color2] = this.colorGenerator.generatePair();
        return {
            col: Math.floor(GAME_CONFIG.COLS / 2) - 1,
            row: 0,
            balls: [
                { color: color1, offsetRow: 0, offsetCol: 0 }, // Pivot ball
                { color: color2, offsetRow: -1, offsetCol: 0 }  // Top ball
            ],
            isFalling: true,
            touchingGround: false
        };
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;
            
            this.keys[e.key] = true;
            
            const now = Date.now();
            
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (now - this.lastMoveTime > GAME_CONFIG.MOVE_DELAY) {
                    this.movePiece(-1);
                    this.lastMoveTime = now;
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (now - this.lastMoveTime > GAME_CONFIG.MOVE_DELAY) {
                    this.movePiece(1);
                    this.lastMoveTime = now;
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (now - this.lastRotateTime > GAME_CONFIG.ROTATE_DELAY) {
                    this.rotatePiece();
                    this.lastRotateTime = now;
                }
            } else if (e.key === ' ') {
                e.preventDefault();
                this.instantDrop();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // New game button
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Try again button
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
            // Check if accelerated fall is active
            const isFastFall = this.keys['ArrowDown'];
            
            if (this.canMovePiece(0, 1)) {
                this.currentPiece.row++;
                this.currentPiece.touchingGround = false;
                this.groundDelayCount = 0;
                
                if (this.groundTimer) {
                    clearTimeout(this.groundTimer);
                    this.groundTimer = null;
                }
            } else {
                // Piece is touching ground
                if (!this.currentPiece.touchingGround) {
                    this.currentPiece.touchingGround = true;
                    this.startGroundDelay();
                }
            }
            
            this.render();
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
        
        if (this.canMovePiece(direction, 0)) {
            this.currentPiece.col += direction;
            
            // Extend ground delay on movement
            if (this.currentPiece.touchingGround && this.groundDelayCount < GAME_CONFIG.MAX_GROUND_DELAY_EXTENSIONS) {
                this.groundDelayCount++;
                this.startGroundDelay();
            }
            
            this.render();
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece || !this.currentPiece.isFalling) return;
        
        // Rotate clockwise: swap balls and adjust positions
        const [ball1, ball2] = this.currentPiece.balls;
        
        // Calculate new position for ball2 (rotating around ball1)
        const newOffsetRow = ball2.offsetCol;
        const newOffsetCol = -ball2.offsetRow;
        
        // Try rotation
        const testBalls = [
            ball1,
            { ...ball2, offsetRow: newOffsetRow, offsetCol: newOffsetCol }
        ];
        
        // Check if rotation is valid
        if (this.canPlacePiece(this.currentPiece.col, this.currentPiece.row, testBalls)) {
            ball2.offsetRow = newOffsetRow;
            ball2.offsetCol = newOffsetCol;
            
            // Extend ground delay on rotation
            if (this.currentPiece.touchingGround && this.groundDelayCount < GAME_CONFIG.MAX_GROUND_DELAY_EXTENSIONS) {
                this.groundDelayCount++;
                this.startGroundDelay();
            }
        } else {
            // Try wall kicks (rotation assist)
            const kicks = [
                { col: -1, row: 0 },  // Left
                { col: 1, row: 0 },   // Right
                { col: 0, row: -1 },  // Up
                { col: -1, row: -1 }, // Left-Up
                { col: 1, row: -1 }   // Right-Up
            ];
            
            for (const kick of kicks) {
                const newCol = this.currentPiece.col + kick.col;
                const newRow = this.currentPiece.row + kick.row;
                
                if (this.canPlacePiece(newCol, newRow, testBalls)) {
                    this.currentPiece.col = newCol;
                    this.currentPiece.row = newRow;
                    ball2.offsetRow = newOffsetRow;
                    ball2.offsetCol = newOffsetCol;
                    
                    // Extend ground delay on successful wall kick
                    if (this.currentPiece.touchingGround && this.groundDelayCount < GAME_CONFIG.MAX_GROUND_DELAY_EXTENSIONS) {
                        this.groundDelayCount++;
                        this.startGroundDelay();
                    }
                    break;
                }
            }
        }
        
        this.render();
    }
    
    instantDrop() {
        if (!this.currentPiece || !this.currentPiece.isFalling) return;
        
        // Drop piece to the bottom instantly
        while (this.canMovePiece(0, 1)) {
            this.currentPiece.row++;
        }
        
        // Lock immediately
        this.lockPiece();
        this.render();
    }
    
    canMovePiece(deltaCol, deltaRow) {
        if (!this.currentPiece) return false;
        
        const newCol = this.currentPiece.col + deltaCol;
        const newRow = this.currentPiece.row + deltaRow;
        
        return this.canPlacePiece(newCol, newRow, this.currentPiece.balls);
    }
    
    canPlacePiece(col, row, balls) {
        for (const ball of balls) {
            const ballCol = col + ball.offsetCol;
            const ballRow = row + ball.offsetRow;
            
            // Check boundaries
            if (ballCol < 0 || ballCol >= GAME_CONFIG.COLS) return false;
            if (ballRow >= GAME_CONFIG.ROWS) return false;
            
            // Check collision with placed balls (but allow negative rows for spawning)
            if (ballRow >= 0 && this.board[ballRow][ballCol] !== GAME_CONFIG.EMPTY) {
                return false;
            }
        }
        
        return true;
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        // Clear timers
        if (this.groundTimer) {
            clearTimeout(this.groundTimer);
            this.groundTimer = null;
        }
        
        // Place balls on board
        for (const ball of this.currentPiece.balls) {
            const col = this.currentPiece.col + ball.offsetCol;
            const row = this.currentPiece.row + ball.offsetRow;
            
            if (row >= 0 && row < GAME_CONFIG.ROWS && col >= 0 && col < GAME_CONFIG.COLS) {
                this.board[row][col] = ball.color;
            }
        }
        
        this.currentPiece = null;
        this.groundDelayCount = 0;
        
        // Check for matches and chains
        this.processMatches();
    }
    
    async processMatches() {
        this.isPaused = true;
        let currentChain = 0;
        
        while (true) {
            const matches = this.findMatches();
            
            if (matches.length === 0) break;
            
            currentChain++;
            this.chainCount = currentChain;
            
            // Update chain display
            if (currentChain > 1) {
                this.chainDisplayElement.textContent = `${currentChain} ${GAME_CONFIG.MESSAGES.COMBO}!`;
            }
            
            // Calculate score
            const clearedCount = matches.length;
            const uniqueColors = new Set(matches.map(m => this.board[m.row][m.col])).size;
            const multiplier = GAME_CONFIG.CHAIN_MULTIPLIER[Math.min(currentChain - 1, GAME_CONFIG.CHAIN_MULTIPLIER.length - 1)];
            const points = (clearedCount * GAME_CONFIG.BASE_CLEAR_SCORE + uniqueColors * GAME_CONFIG.COLOR_BONUS) * multiplier;
            
            this.score += points;
            this.updateDisplay();
            
            // Clear matched balls
            for (const match of matches) {
                this.board[match.row][match.col] = GAME_CONFIG.EMPTY;
            }
            
            this.render();
            await this.sleep(GAME_CONFIG.CLEAR_ANIMATION_DURATION);
            
            // Apply gravity
            this.applyGravity();
            this.render();
            await this.sleep(GAME_CONFIG.CHAIN_DELAY);
        }
        
        // Clear chain display
        setTimeout(() => {
            this.chainDisplayElement.textContent = '';
        }, 1000);
        
        this.chainCount = 0;
        this.isPaused = false;
        
        // Check for game over
        if (this.isGameOver()) {
            this.endGame();
        } else {
            // Spawn next piece
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
            this.renderNextPiece();
            this.render();
        }
    }
    
    findMatches() {
        const matches = [];
        const visited = new Set();
        
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const color = this.board[row][col];
                if (color === GAME_CONFIG.EMPTY) continue;
                
                const key = `${row},${col}`;
                if (visited.has(key)) continue;
                
                // BFS to find connected balls
                const connected = this.findConnectedBalls(row, col, color);
                
                if (connected.length >= GAME_CONFIG.MIN_MATCH) {
                    matches.push(...connected);
                    connected.forEach(pos => visited.add(`${pos.row},${pos.col}`));
                }
            }
        }
        
        return matches;
    }
    
    findConnectedBalls(startRow, startCol, color) {
        const connected = [];
        const queue = [{ row: startRow, col: startCol }];
        const visited = new Set();
        visited.add(`${startRow},${startCol}`);
        
        while (queue.length > 0) {
            const { row, col } = queue.shift();
            connected.push({ row, col });
            
            // Check 4 directions
            const directions = [
                { dr: -1, dc: 0 }, // Up
                { dr: 1, dc: 0 },  // Down
                { dr: 0, dc: -1 }, // Left
                { dr: 0, dc: 1 }   // Right
            ];
            
            for (const { dr, dc } of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;
                
                if (newRow < 0 || newRow >= GAME_CONFIG.ROWS ||
                    newCol < 0 || newCol >= GAME_CONFIG.COLS) continue;
                
                if (visited.has(key)) continue;
                
                if (this.board[newRow][newCol] === color) {
                    visited.add(key);
                    queue.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return connected;
    }
    
    applyGravity() {
        // Make balls fall down
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            let writeRow = GAME_CONFIG.ROWS - 1;
            
            for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
                if (this.board[row][col] !== GAME_CONFIG.EMPTY) {
                    if (row !== writeRow) {
                        this.board[writeRow][col] = this.board[row][col];
                        this.board[row][col] = GAME_CONFIG.EMPTY;
                    }
                    writeRow--;
                }
            }
        }
    }
    
    isGameOver() {
        // Check if any ball is above the visible area
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (this.board[0][col] !== GAME_CONFIG.EMPTY) {
                return true;
            }
        }
        return false;
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
        this.setupBoard();
        this.currentPiece = this.generatePiece();
        this.nextPiece = this.generatePiece();
        this.updateDisplay();
        this.renderNextPiece();
        this.render();
        this.startGameLoop();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#2a2a2a';
        this.ctx.lineWidth = 1;
        for (let row = 0; row <= GAME_CONFIG.ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.cellSize);
            this.ctx.lineTo(GAME_CONFIG.COLS * this.cellSize, row * this.cellSize);
            this.ctx.stroke();
        }
        for (let col = 0; col <= GAME_CONFIG.COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.cellSize, 0);
            this.ctx.lineTo(col * this.cellSize, GAME_CONFIG.ROWS * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw placed balls
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const color = this.board[row][col];
                if (color !== GAME_CONFIG.EMPTY) {
                    this.drawBall(col, row, color);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece && this.currentPiece.isFalling) {
            for (const ball of this.currentPiece.balls) {
                const col = this.currentPiece.col + ball.offsetCol;
                const row = this.currentPiece.row + ball.offsetRow;
                
                if (row >= 0) {
                    this.drawBall(col, row, ball.color);
                }
            }
            
            // Draw ghost piece (preview where it will land)
            this.drawGhostPiece();
        }
    }
    
    drawBall(col, row, color) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        const radius = this.cellSize / 2 - 4;
        const centerX = x + this.cellSize / 2;
        const centerY = y + this.cellSize / 2;
        
        // Create gradient
        const gradient = this.ctx.createRadialGradient(
            centerX - radius / 3, centerY - radius / 3, 0,
            centerX, centerY, radius
        );
        
        const colors = {
            'red': ['#ff6b6b', '#cc0000'],
            'blue': ['#4dabf7', '#0066cc'],
            'green': ['#51cf66', '#228B22'],
            'yellow': ['#ffd43b', '#ffa500'],
            'purple': ['#cc5de8', '#7b2cbf']
        };
        
        const [lightColor, darkColor] = colors[color] || ['#888', '#444'];
        
        gradient.addColorStop(0, lightColor);
        gradient.addColorStop(1, darkColor);
        
        // Draw ball
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Add shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawGhostPiece() {
        if (!this.currentPiece) return;
        
        // Calculate drop position
        let ghostRow = this.currentPiece.row;
        while (this.canPlacePiece(this.currentPiece.col, ghostRow + 1, this.currentPiece.balls)) {
            ghostRow++;
        }
        
        // Don't draw ghost if it's at current position
        if (ghostRow === this.currentPiece.row) return;
        
        // Draw ghost balls
        this.ctx.globalAlpha = 0.3;
        for (const ball of this.currentPiece.balls) {
            const col = this.currentPiece.col + ball.offsetCol;
            const row = ghostRow + ball.offsetRow;
            
            if (row >= 0) {
                this.drawBall(col, row, ball.color);
            }
        }
        this.ctx.globalAlpha = 1.0;
    }
    
    renderNextPiece() {
        this.nextPieceElement.innerHTML = '';
        
        if (!this.nextPiece) return;
        
        const ballSize = 28;
        const spacing = 32;
        
        for (const ball of this.nextPiece.balls) {
            const ballElement = document.createElement('div');
            ballElement.className = `ball ${ball.color}`;
            ballElement.style.width = `${ballSize}px`;
            ballElement.style.height = `${ballSize}px`;
            ballElement.style.left = `${16 + ball.offsetCol * spacing}px`;
            ballElement.style.top = `${60 + ball.offsetRow * spacing}px`;
            
            this.nextPieceElement.appendChild(ballElement);
        }
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

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ColorMatchGame();
});
