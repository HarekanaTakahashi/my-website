import { GAME_CONFIG, KEY_BINDINGS } from './config/tetris-config.js';
import { Board } from './modules/Board.js';
import { Piece } from './modules/Piece.js';
import { RandomGenerator } from './modules/RandomGenerator.js';
import { Renderer } from './modules/Renderer.js';
import { ScoreManager } from './modules/ScoreManager.js';
import { TSpinDetector } from './modules/TSpinDetector.js';

class Tetris {
    constructor() {
        // Initialize modules
        this.board = new Board();
        this.renderer = new Renderer('game-canvas', 'next-canvas', 'hold-canvas');
        this.randomGenerator = new RandomGenerator();
        this.scoreManager = new ScoreManager();
        this.tSpinDetector = new TSpinDetector();
        
        // Current piece state
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        
        // Game state
        this.gameLoop = null;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.isStarted = false;
        
        // Hold system
        this.holdPiece = null;
        this.canHold = true;
        
        // Lock delay system
        this.lockDelayTimer = 0;
        this.lockDelayResets = 0;
        this.isOnGround = false;
        
        // Last move tracking for T-Spin detection
        this.lastMoveWasRotation = false;
        
        this.initControls();
        this.updateDisplay();
    }
    
    spawnPiece() {
        const pieceType = this.randomGenerator.popNext();
        this.currentPiece = new Piece(pieceType);
        
        const shape = this.currentPiece.getShape();
        this.currentX = Math.floor((GAME_CONFIG.BOARD_WIDTH - shape[0].length) / 2);
        this.currentY = 0;
        
        this.canHold = true;
        this.lockDelayTimer = 0;
        this.lockDelayResets = 0;
        this.isOnGround = false;
        this.lastMoveWasRotation = false;
        
        if (!this.board.isValidPosition(this.currentX, this.currentY, shape)) {
            this.gameOver();
        }
        
        this.drawNext();
    }
    
    move(dx) {
        const newX = this.currentX + dx;
        const shape = this.currentPiece.getShape();
        
        if (this.board.isValidPosition(newX, this.currentY, shape)) {
            this.currentX = newX;
            this.lastMoveWasRotation = false;
            
            // Reset lock delay on successful move
            if (this.isOnGround && this.lockDelayResets < GAME_CONFIG.MAX_LOCK_RESETS) {
                this.lockDelayTimer = 0;
                this.lockDelayResets++;
            }
            
            return true;
        }
        return false;
    }
    
    rotate(direction) {
        const result = this.currentPiece.rotate(direction, this.currentX, this.currentY, this.board);
        
        if (result.success) {
            this.currentX = result.x;
            this.currentY = result.y;
            this.lastMoveWasRotation = true;
            
            // Reset lock delay on successful rotation
            if (this.isOnGround && this.lockDelayResets < GAME_CONFIG.MAX_LOCK_RESETS) {
                this.lockDelayTimer = 0;
                this.lockDelayResets++;
            }
            
            return true;
        }
        return false;
    }
    
    drop() {
        const newY = this.currentY + 1;
        const shape = this.currentPiece.getShape();
        
        if (this.board.isValidPosition(this.currentX, newY, shape)) {
            this.currentY = newY;
            this.lastMoveWasRotation = false;
            this.isOnGround = false;
            this.lockDelayTimer = 0;
            return true;
        } else {
            this.isOnGround = true;
            return false;
        }
    }
    
    softDrop() {
        if (this.drop()) {
            this.scoreManager.addSoftDropScore();
            this.updateDisplay();
        }
    }
    
    hardDrop() {
        let dropDistance = 0;
        while (this.drop()) {
            dropDistance++;
        }
        this.scoreManager.addHardDropScore(dropDistance);
        this.lockPiece();
        this.updateDisplay();
    }
    
    hold() {
        if (!this.canHold) return;
        
        const currentType = this.currentPiece.type;
        
        if (this.holdPiece) {
            // Swap with held piece
            this.currentPiece = new Piece(this.holdPiece.type);
            this.holdPiece = new Piece(currentType);
        } else {
            // Store current piece and spawn new one
            this.holdPiece = new Piece(currentType);
            this.spawnPiece();
        }
        
        const shape = this.currentPiece.getShape();
        this.currentX = Math.floor((GAME_CONFIG.BOARD_WIDTH - shape[0].length) / 2);
        this.currentY = 0;
        this.canHold = false;
        
        this.renderer.drawHold(this.holdPiece);
    }
    
    lockPiece() {
        const shape = this.currentPiece.getShape();
        this.board.lockPiece(this.currentX, this.currentY, shape, this.currentPiece.color);
        
        const tSpin = this.tSpinDetector.check(
            this.currentPiece, 
            this.currentX, 
            this.currentY, 
            this.board, 
            this.lastMoveWasRotation
        );
        
        const clearedLines = this.board.clearLines();
        
        if (clearedLines > 0) {
            this.scoreManager.addLines(clearedLines);
        }
        
        this.scoreManager.addScore(clearedLines, tSpin);
        
        this.spawnPiece();
        this.updateDisplay();
    }
    
    update(deltaTime) {
        if (this.isGameOver || this.isPaused || !this.isStarted) return;
        
        this.dropCounter += deltaTime;
        
        // Check if piece is on ground
        if (this.isOnGround) {
            this.lockDelayTimer += deltaTime;
            if (this.lockDelayTimer >= GAME_CONFIG.LOCK_DELAY) {
                this.lockPiece();
            }
        } else if (this.dropCounter >= this.scoreManager.getDropInterval()) {
            this.drop();
            this.dropCounter = 0;
        }
    }
    
    draw() {
        this.renderer.drawBoard(this.board, this.currentPiece, this.currentX, this.currentY);
    }
    
    drawNext() {
        const nextTypes = this.randomGenerator.peekNext(3);
        const nextPieces = nextTypes.map(type => new Piece(type));
        this.renderer.drawNext(nextPieces);
    }
    
    updateDisplay() {
        document.getElementById('current-score').textContent = this.scoreManager.score;
        document.getElementById('lines').textContent = this.scoreManager.lines;
        document.getElementById('best-score').textContent = this.scoreManager.bestScore;
        document.getElementById('level').textContent = this.scoreManager.level;
        document.getElementById('last-action').textContent = this.scoreManager.lastAction || '-';
    }
    
    initControls() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        startBtn.addEventListener('click', () => this.start());
        pauseBtn.addEventListener('click', () => this.togglePause());
        restartBtn.addEventListener('click', () => this.restart());
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    handleKeyPress(e) {
        if (!this.isStarted && KEY_BINDINGS.HARD_DROP.includes(e.key)) {
            this.start();
            e.preventDefault();
            return;
        }
        
        if (!this.isStarted || this.isGameOver) return;
        
        if (KEY_BINDINGS.PAUSE.includes(e.key)) {
            this.togglePause();
            e.preventDefault();
        } else if (KEY_BINDINGS.RESTART.includes(e.key)) {
            this.restart();
            e.preventDefault();
        }
        
        if (this.isPaused) return;
        
        if (KEY_BINDINGS.MOVE_LEFT.includes(e.key)) {
            this.move(-1);
            e.preventDefault();
        } else if (KEY_BINDINGS.MOVE_RIGHT.includes(e.key)) {
            this.move(1);
            e.preventDefault();
        } else if (KEY_BINDINGS.SOFT_DROP.includes(e.key)) {
            this.softDrop();
            e.preventDefault();
        } else if (KEY_BINDINGS.HARD_DROP.includes(e.key)) {
            this.hardDrop();
            e.preventDefault();
        } else if (KEY_BINDINGS.ROTATE_CW.includes(e.key)) {
            this.rotate(1);
            e.preventDefault();
        } else if (KEY_BINDINGS.ROTATE_CCW.includes(e.key)) {
            this.rotate(-1);
            e.preventDefault();
        } else if (KEY_BINDINGS.HOLD.includes(e.key)) {
            this.hold();
            e.preventDefault();
        }
    }
    
    start() {
        if (this.isStarted) return;
        
        this.isStarted = true;
        this.spawnPiece();
        this.renderer.drawHold(this.holdPiece);
        this.hideOverlay();
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.loop(time));
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showOverlay('一時停止', 'Escキーまたは一時停止ボタンで再開');
            document.getElementById('pause-btn').textContent = '再開';
        } else {
            this.hideOverlay();
            document.getElementById('pause-btn').textContent = '一時停止';
            this.lastTime = performance.now();
        }
    }
    
    restart() {
        this.board.reset();
        this.scoreManager.reset();
        this.randomGenerator.reset();
        this.holdPiece = null;
        this.isGameOver = false;
        this.isPaused = false;
        this.isStarted = false;
        
        this.updateDisplay();
        this.drawNext();
        this.renderer.drawHold(this.holdPiece);
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('pause-btn').textContent = '一時停止';
        
        this.showOverlay('Tetris', 'Wキーで開始');
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        this.draw();
    }
    
    gameOver() {
        this.isGameOver = true;
        this.showOverlay('ゲームオーバー', `スコア: ${this.scoreManager.score}`);
        
        document.getElementById('pause-btn').disabled = true;
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }
    
    showOverlay(title, message) {
        const overlay = document.getElementById('game-overlay');
        document.getElementById('overlay-title').textContent = title;
        document.getElementById('overlay-message').textContent = message;
        overlay.classList.remove('hidden');
    }
    
    hideOverlay() {
        document.getElementById('game-overlay').classList.add('hidden');
    }
    
    loop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        if (!this.isGameOver) {
            this.gameLoop = requestAnimationFrame((time) => this.loop(time));
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Tetris();
});
