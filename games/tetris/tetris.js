import { 
    GAME_CONFIG, 
    TETROMINOS, 
    SRS_KICK_DATA, 
    MESSAGES, 
    KEY_BINDINGS 
} from './config/tetris-config.js';

class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        this.board = this.createBoard();
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentRotation = 0;
        
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.bestScore = parseInt(localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.BEST_SCORE) || '0');
        
        this.gameLoop = null;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.dropInterval = GAME_CONFIG.INITIAL_DROP_INTERVAL;
        
        this.isGameOver = false;
        this.isPaused = false;
        this.isStarted = false;
        
        // 7-bag random generator
        this.bag = [];
        this.nextPieces = [];
        
        // Hold system
        this.holdPiece = null;
        this.canHold = true;
        
        // Lock delay system
        this.lockDelayTimer = 0;
        this.lockDelayResets = 0;
        this.isOnGround = false;
        
        // Last move tracking for T-Spin detection
        this.lastMoveWasRotation = false;
        
        // Last action message
        this.lastAction = '';
        
        this.initControls();
        this.updateDisplay();
    }
    
    createBoard() {
        return Array.from({ length: GAME_CONFIG.BOARD_HEIGHT }, () => 
            Array(GAME_CONFIG.BOARD_WIDTH).fill(0)
        );
    }
    
    // 7-bag random generator
    generateBag() {
        const pieces = Object.keys(TETROMINOS);
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        return pieces;
    }
    
    getNextPiece() {
        if (this.bag.length === 0) {
            this.bag = this.generateBag();
        }
        return this.bag.pop();
    }
    
    fillNextQueue() {
        while (this.nextPieces.length < 5) {
            this.nextPieces.push(this.getNextPiece());
        }
    }
    
    spawnPiece() {
        this.fillNextQueue();
        const pieceType = this.nextPieces.shift();
        this.fillNextQueue();
        
        this.currentPiece = { ...TETROMINOS[pieceType] };
        this.currentRotation = 0;
        this.currentX = Math.floor((GAME_CONFIG.BOARD_WIDTH - this.currentPiece.shape[0].length) / 2);
        this.currentY = 0;
        
        this.canHold = true;
        this.lockDelayTimer = 0;
        this.lockDelayResets = 0;
        this.isOnGround = false;
        this.lastMoveWasRotation = false;
        
        if (this.checkCollision(this.currentX, this.currentY, this.currentPiece.shape)) {
            this.gameOver();
        }
    }
    
    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= GAME_CONFIG.BOARD_WIDTH || 
                        newY >= GAME_CONFIG.BOARD_HEIGHT) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    rotate(direction) {
        const oldRotation = this.currentRotation;
        const newRotation = (this.currentRotation + direction + 4) % 4;
        const rotatedShape = this.getRotatedShape(this.currentPiece.shape, newRotation);
        
        // Get appropriate kick data
        const pieceType = this.currentPiece.name;
        const kickData = pieceType === 'I' ? SRS_KICK_DATA.I : 
                        pieceType === 'O' ? SRS_KICK_DATA.O : 
                        SRS_KICK_DATA.JLSTZ;
        
        const rotationKey = this.getRotationKey(oldRotation, newRotation);
        const kicks = kickData[rotationKey];
        
        // Try each kick offset
        for (const [offsetX, offsetY] of kicks) {
            const newX = this.currentX + offsetX;
            const newY = this.currentY - offsetY;
            
            if (!this.checkCollision(newX, newY, rotatedShape)) {
                this.currentX = newX;
                this.currentY = newY;
                this.currentRotation = newRotation;
                this.currentPiece.shape = rotatedShape;
                this.lastMoveWasRotation = true;
                
                // Reset lock delay on successful rotation
                if (this.isOnGround && this.lockDelayResets < GAME_CONFIG.MAX_LOCK_RESETS) {
                    this.lockDelayTimer = 0;
                    this.lockDelayResets++;
                }
                
                return true;
            }
        }
        
        return false;
    }
    
    getRotationKey(oldRotation, newRotation) {
        const rotationNames = ['0', 'R', '2', 'L'];
        return `${rotationNames[oldRotation]}->${rotationNames[newRotation]}`;
    }
    
    getRotatedShape(shape, rotation) {
        let rotated = shape;
        for (let i = 0; i < rotation; i++) {
            rotated = this.rotateMatrix(rotated);
        }
        return rotated;
    }
    
    rotateMatrix(matrix) {
        const n = matrix.length;
        const rotated = Array.from({ length: n }, () => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                rotated[j][n - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    move(dx) {
        const newX = this.currentX + dx;
        if (!this.checkCollision(newX, this.currentY, this.currentPiece.shape)) {
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
    
    drop() {
        const newY = this.currentY + 1;
        if (!this.checkCollision(this.currentX, newY, this.currentPiece.shape)) {
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
            this.score += GAME_CONFIG.SCORES.SOFT_DROP;
            this.updateDisplay();
        }
    }
    
    hardDrop() {
        let dropDistance = 0;
        while (this.drop()) {
            dropDistance++;
        }
        this.score += dropDistance * GAME_CONFIG.SCORES.HARD_DROP;
        this.lockPiece();
        this.updateDisplay();
    }
    
    hold() {
        if (!this.canHold) return;
        
        const tempPiece = this.currentPiece.name;
        
        if (this.holdPiece) {
            this.currentPiece = { ...TETROMINOS[this.holdPiece] };
        } else {
            this.spawnPiece();
        }
        
        this.holdPiece = tempPiece;
        this.currentRotation = 0;
        this.currentX = Math.floor((GAME_CONFIG.BOARD_WIDTH - this.currentPiece.shape[0].length) / 2);
        this.currentY = 0;
        this.canHold = false;
        
        this.drawHold();
    }
    
    lockPiece() {
        const shape = this.currentPiece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = this.currentX + col;
                    const y = this.currentY + row;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
        
        const isTSpin = this.checkTSpin();
        const clearedLines = this.clearLines();
        this.updateScore(clearedLines, isTSpin);
        
        this.spawnPiece();
        this.drawNext();
    }
    
    checkTSpin() {
        if (this.currentPiece.name !== 'T' || !this.lastMoveWasRotation) {
            return { isTSpin: false, isMini: false };
        }
        
        // Check corners of T piece
        const corners = [
            [this.currentX, this.currentY],
            [this.currentX + 2, this.currentY],
            [this.currentX, this.currentY + 2],
            [this.currentX + 2, this.currentY + 2]
        ];
        
        let filledCorners = 0;
        for (const [x, y] of corners) {
            if (x < 0 || x >= GAME_CONFIG.BOARD_WIDTH || 
                y < 0 || y >= GAME_CONFIG.BOARD_HEIGHT || 
                (y >= 0 && this.board[y][x])) {
                filledCorners++;
            }
        }
        
        if (filledCorners >= 3) {
            // Check if it's a mini T-Spin
            const frontCorners = this.getFrontCorners();
            let filledFrontCorners = 0;
            for (const [x, y] of frontCorners) {
                if (x < 0 || x >= GAME_CONFIG.BOARD_WIDTH || 
                    y < 0 || y >= GAME_CONFIG.BOARD_HEIGHT || 
                    (y >= 0 && this.board[y][x])) {
                    filledFrontCorners++;
                }
            }
            
            const isMini = filledFrontCorners < 2;
            return { isTSpin: true, isMini };
        }
        
        return { isTSpin: false, isMini: false };
    }
    
    getFrontCorners() {
        const rotation = this.currentRotation;
        const x = this.currentX;
        const y = this.currentY;
        
        switch (rotation) {
            case 0: return [[x, y], [x + 2, y]];
            case 1: return [[x + 2, y], [x + 2, y + 2]];
            case 2: return [[x + 2, y + 2], [x, y + 2]];
            case 3: return [[x, y + 2], [x, y]];
            default: return [[x, y], [x + 2, y]]; // Fallback to rotation 0
        }
    }
    
    clearLines() {
        const linesToClear = [];
        
        for (let row = 0; row < GAME_CONFIG.BOARD_HEIGHT; row++) {
            if (this.board[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }
        
        if (linesToClear.length > 0) {
            // Remove cleared lines in reverse order to avoid index shifting issues
            for (let i = linesToClear.length - 1; i >= 0; i--) {
                this.board.splice(linesToClear[i], 1);
                this.board.unshift(Array(GAME_CONFIG.BOARD_WIDTH).fill(0));
            }
            
            this.lines += linesToClear.length;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, GAME_CONFIG.INITIAL_DROP_INTERVAL - (this.level - 1) * 50);
        }
        
        return linesToClear.length;
    }
    
    updateScore(clearedLines, tSpin) {
        let points = 0;
        let actionText = '';
        
        if (tSpin.isTSpin) {
            if (tSpin.isMini) {
                points = GAME_CONFIG.SCORES.T_SPIN_MINI;
                actionText = MESSAGES.T_SPIN_MINI;
            } else if (clearedLines === 1) {
                points = GAME_CONFIG.SCORES.T_SPIN_SINGLE;
                actionText = `${MESSAGES.T_SPIN} ${MESSAGES.SINGLE}`;
            } else if (clearedLines === 2) {
                points = GAME_CONFIG.SCORES.T_SPIN_DOUBLE;
                actionText = `${MESSAGES.T_SPIN} ${MESSAGES.DOUBLE}`;
            } else if (clearedLines === 3) {
                points = GAME_CONFIG.SCORES.T_SPIN_TRIPLE;
                actionText = `${MESSAGES.T_SPIN} ${MESSAGES.TRIPLE}`;
            }
        } else if (clearedLines > 0) {
            switch (clearedLines) {
                case 1:
                    points = GAME_CONFIG.SCORES.SINGLE;
                    actionText = MESSAGES.SINGLE;
                    break;
                case 2:
                    points = GAME_CONFIG.SCORES.DOUBLE;
                    actionText = MESSAGES.DOUBLE;
                    break;
                case 3:
                    points = GAME_CONFIG.SCORES.TRIPLE;
                    actionText = MESSAGES.TRIPLE;
                    break;
                case 4:
                    points = GAME_CONFIG.SCORES.TETRIS;
                    actionText = MESSAGES.TETRIS;
                    break;
            }
        }
        
        if (points > 0) {
            this.score += points * this.level;
            this.lastAction = actionText;
        }
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.BEST_SCORE, this.bestScore.toString());
        }
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
        } else if (this.dropCounter >= this.dropInterval) {
            this.drop();
            this.dropCounter = 0;
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let row = 0; row < GAME_CONFIG.BOARD_HEIGHT; row++) {
            for (let col = 0; col < GAME_CONFIG.BOARD_WIDTH; col++) {
                this.ctx.strokeRect(
                    col * GAME_CONFIG.CELL_SIZE,
                    row * GAME_CONFIG.CELL_SIZE,
                    GAME_CONFIG.CELL_SIZE,
                    GAME_CONFIG.CELL_SIZE
                );
            }
        }
        
        // Draw locked pieces
        for (let row = 0; row < GAME_CONFIG.BOARD_HEIGHT; row++) {
            for (let col = 0; col < GAME_CONFIG.BOARD_WIDTH; col++) {
                if (this.board[row][col]) {
                    this.ctx.fillStyle = this.board[row][col];
                    this.ctx.fillRect(
                        col * GAME_CONFIG.CELL_SIZE + 1,
                        row * GAME_CONFIG.CELL_SIZE + 1,
                        GAME_CONFIG.CELL_SIZE - 2,
                        GAME_CONFIG.CELL_SIZE - 2
                    );
                }
            }
        }
        
        // Draw ghost piece
        if (this.currentPiece) {
            this.drawGhost();
        }
        
        // Draw current piece
        if (this.currentPiece) {
            this.drawPiece(
                this.ctx,
                this.currentPiece,
                this.currentX,
                this.currentY,
                GAME_CONFIG.CELL_SIZE,
                false
            );
        }
    }
    
    drawGhost() {
        let ghostY = this.currentY;
        while (!this.checkCollision(this.currentX, ghostY + 1, this.currentPiece.shape)) {
            ghostY++;
        }
        
        const shape = this.currentPiece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = this.currentX + col;
                    const y = ghostY + row;
                    if (y >= 0) {
                        this.ctx.strokeStyle = this.currentPiece.color;
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(
                            x * GAME_CONFIG.CELL_SIZE + 2,
                            y * GAME_CONFIG.CELL_SIZE + 2,
                            GAME_CONFIG.CELL_SIZE - 4,
                            GAME_CONFIG.CELL_SIZE - 4
                        );
                    }
                }
            }
        }
    }
    
    drawPiece(ctx, piece, x, y, cellSize, isPreview) {
        const shape = piece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const drawX = x + col;
                    const drawY = y + row;
                    if (!isPreview || drawY >= 0) {
                        ctx.fillStyle = piece.color;
                        ctx.fillRect(
                            drawX * cellSize + 1,
                            drawY * cellSize + 1,
                            cellSize - 2,
                            cellSize - 2
                        );
                    }
                }
            }
        }
    }
    
    drawNext() {
        this.nextCtx.fillStyle = '#222';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const previewSize = 25;
        let offsetY = 10;
        
        for (let i = 0; i < Math.min(3, this.nextPieces.length); i++) {
            const piece = { ...TETROMINOS[this.nextPieces[i]] };
            const width = piece.shape[0].length;
            const height = piece.shape.length;
            const offsetX = (this.nextCanvas.width / previewSize - width) / 2;
            
            this.drawPiece(this.nextCtx, piece, offsetX, offsetY / previewSize, previewSize, true);
            offsetY += height * previewSize + 20;
        }
    }
    
    drawHold() {
        this.holdCtx.fillStyle = '#222';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (this.holdPiece) {
            const piece = { ...TETROMINOS[this.holdPiece] };
            const previewSize = 25;
            const width = piece.shape[0].length;
            const offsetX = (this.holdCanvas.width / previewSize - width) / 2;
            const offsetY = 1;
            
            this.drawPiece(this.holdCtx, piece, offsetX, offsetY, previewSize, true);
        }
    }
    
    updateDisplay() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('best-score').textContent = this.bestScore;
        document.getElementById('level').textContent = this.level;
        document.getElementById('last-action').textContent = this.lastAction || '-';
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
        this.drawNext();
        this.drawHold();
        this.hideOverlay();
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.loop(time));
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showOverlay(MESSAGES.PAUSED, 'Escキーまたは一時停止ボタンで再開');
            document.getElementById('pause-btn').textContent = '再開';
        } else {
            this.hideOverlay();
            document.getElementById('pause-btn').textContent = '一時停止';
            this.lastTime = performance.now();
        }
    }
    
    restart() {
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = GAME_CONFIG.INITIAL_DROP_INTERVAL;
        this.isGameOver = false;
        this.isPaused = false;
        this.isStarted = false;
        this.bag = [];
        this.nextPieces = [];
        this.holdPiece = null;
        this.lastAction = '';
        
        this.updateDisplay();
        this.drawNext();
        this.drawHold();
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('pause-btn').textContent = '一時停止';
        
        this.showOverlay('Tetris', MESSAGES.PRESS_SPACE);
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        this.draw();
    }
    
    gameOver() {
        this.isGameOver = true;
        this.showOverlay(MESSAGES.GAME_OVER, `スコア: ${this.score}`);
        
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
