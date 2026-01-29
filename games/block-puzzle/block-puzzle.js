'use strict';

// Game constants
const BOARD_SIZE = 10;
const STORAGE_KEY = 'blockPuzzleBestScore';
const LINE_CLEAR_MULTIPLIER = 2; // Points per cell when clearing lines

// Block shapes (no rotation, just different shapes)
const BLOCK_SHAPES = [
    // Single block
    [[1]],
    
    // 2x1 blocks
    [[1, 1]],
    [[1], [1]],
    
    // 3x1 blocks
    [[1, 1, 1]],
    [[1], [1], [1]],
    
    // L shapes
    [[1, 0], [1, 1]],
    [[1, 1], [1, 0]],
    [[1, 1], [0, 1]],
    [[0, 1], [1, 1]],
    
    // 2x2 square
    [[1, 1], [1, 1]],
    
    // T shapes
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    
    // Z shapes
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]],
    
    // 3x3 shapes
    [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
    [[1, 0, 1], [1, 1, 1], [1, 0, 1]],
];

/**
 * BlockPuzzle game class
 * Manages a 10x10 block puzzle game where players place various shaped blocks
 * to complete and clear rows and columns. Features include:
 * - 18+ different block shapes (no rotation)
 * - Visual placement feedback
 * - Line clearing for complete rows/columns
 * - Score tracking with localStorage persistence
 * - Game over detection
 */
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
        
        // Board hover and click events
        this.boardElement.addEventListener('mousemove', (e) => this.handleBoardHover(e));
        this.boardElement.addEventListener('mouseleave', () => this.clearHighlight());
        this.boardElement.addEventListener('click', (e) => this.handleBoardClick(e));
        
        // Pieces container - use event delegation to avoid duplicate listeners
        this.piecesElement.addEventListener('click', (e) => {
            const pieceElement = e.target.closest('.piece');
            if (pieceElement && !pieceElement.classList.contains('used')) {
                const index = parseInt(pieceElement.dataset.index);
                this.selectedPiece = index;
                this.renderPieces();
            }
        });
        
        // Keyboard support
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
                cell.className = 'board-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                if (this.board[row][col] === 1) {
                    cell.classList.add('filled');
                }
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    generateNewPieces() {
        this.currentPieces = [];
        for (let i = 0; i < 3; i++) {
            const shapeIndex = Math.floor(Math.random() * BLOCK_SHAPES.length);
            this.currentPieces.push({
                shape: BLOCK_SHAPES[shapeIndex],
                used: false
            });
        }
        this.renderPieces();
    }
    
    renderPieces() {
        this.piecesElement.innerHTML = '';
        this.currentPieces.forEach((piece, index) => {
            if (piece.used) return;
            
            const pieceElement = document.createElement('div');
            pieceElement.className = 'piece';
            pieceElement.dataset.index = index;
            pieceElement.setAttribute('tabindex', '0');
            pieceElement.setAttribute('role', 'button');
            pieceElement.setAttribute('aria-label', `ブロック ${index + 1} を選択`);
            
            if (this.selectedPiece === index) {
                pieceElement.classList.add('selected');
                pieceElement.setAttribute('aria-pressed', 'true');
            } else {
                pieceElement.setAttribute('aria-pressed', 'false');
            }
            
            const shape = piece.shape;
            pieceElement.style.gridTemplateColumns = `repeat(${shape[0].length}, 25px)`;
            pieceElement.style.gridTemplateRows = `repeat(${shape.length}, 25px)`;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[0].length; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'piece-cell';
                    if (shape[row][col] === 1) {
                        cell.classList.add('filled');
                    }
                    pieceElement.appendChild(cell);
                }
            }
            
            // Keyboard support for piece selection
            pieceElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectedPiece = index;
                    this.renderPieces();
                }
            });
            
            this.piecesElement.appendChild(pieceElement);
        });
    }
    
    handleBoardHover(e) {
        if (this.selectedPiece === null) return;
        
        const cell = e.target.closest('.board-cell');
        if (!cell) {
            this.clearHighlight();
            return;
        }
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        this.highlightPlacement(row, col);
    }
    
    handleBoardClick(e) {
        if (this.selectedPiece === null) return;
        
        const cell = e.target.closest('.board-cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.canPlacePiece(row, col, this.currentPieces[this.selectedPiece].shape)) {
            this.placePiece(row, col, this.currentPieces[this.selectedPiece].shape);
            this.currentPieces[this.selectedPiece].used = true;
            this.selectedPiece = null;
            
            this.clearLines();
            this.renderBoard();
            this.renderPieces();
            
            // Check if all pieces are used
            if (this.currentPieces.every(p => p.used)) {
                this.generateNewPieces();
            }
            
            // Check game over
            if (this.isGameOver()) {
                this.showGameOver();
            }
        }
    }
    
    highlightPlacement(row, col) {
        this.clearHighlight();
        
        const shape = this.currentPieces[this.selectedPiece].shape;
        const canPlace = this.canPlacePiece(row, col, shape);
        
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c] === 1) {
                    const targetRow = row + r;
                    const targetCol = col + c;
                    
                    if (targetRow >= 0 && targetRow < BOARD_SIZE && targetCol >= 0 && targetCol < BOARD_SIZE) {
                        const cell = this.boardElement.querySelector(
                            `[data-row="${targetRow}"][data-col="${targetCol}"]`
                        );
                        if (cell) {
                            cell.classList.add(canPlace ? 'highlight' : 'invalid');
                        }
                    }
                }
            }
        }
    }
    
    clearHighlight() {
        const cells = this.boardElement.querySelectorAll('.board-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlight', 'invalid');
        });
    }
    
    canPlacePiece(row, col, shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c] === 1) {
                    const targetRow = row + r;
                    const targetCol = col + c;
                    
                    if (targetRow < 0 || targetRow >= BOARD_SIZE || 
                        targetCol < 0 || targetCol >= BOARD_SIZE) {
                        return false;
                    }
                    
                    if (this.board[targetRow][targetCol] === 1) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece(row, col, shape) {
        let cellsPlaced = 0;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c] === 1) {
                    this.board[row + r][col + c] = 1;
                    cellsPlaced++;
                }
            }
        }
        this.addScore(cellsPlaced);
    }
    
    clearLines() {
        const rowsToClear = [];
        const colsToClear = [];
        
        // Check rows
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (this.board[row].every(cell => cell === 1)) {
                rowsToClear.push(row);
            }
        }
        
        // Check columns
        for (let col = 0; col < BOARD_SIZE; col++) {
            let full = true;
            for (let row = 0; row < BOARD_SIZE; row++) {
                if (this.board[row][col] !== 1) {
                    full = false;
                    break;
                }
            }
            if (full) {
                colsToClear.push(col);
            }
        }
        
        // Clear rows
        rowsToClear.forEach(row => {
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.board[row][col] = 0;
            }
        });
        
        // Clear columns
        colsToClear.forEach(col => {
            for (let row = 0; row < BOARD_SIZE; row++) {
                this.board[row][col] = 0;
            }
        });
        
        const linesCleared = rowsToClear.length + colsToClear.length;
        if (linesCleared > 0) {
            this.addScore(linesCleared * BOARD_SIZE * LINE_CLEAR_MULTIPLIER);
        }
    }
    
    isGameOver() {
        // Check if any remaining piece can be placed anywhere
        for (const piece of this.currentPieces) {
            if (piece.used) continue;
            
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let col = 0; col < BOARD_SIZE; col++) {
                    if (this.canPlacePiece(row, col, piece.shape)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    addScore(points) {
        this.score += points;
        this.updateScore();
    }
    
    updateScore() {
        this.currentScoreElement.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem(STORAGE_KEY, this.bestScore.toString());
        }
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    showGameOver() {
        this.messageTitleElement.textContent = 'ゲームオーバー';
        this.messageTextElement.textContent = `スコア: ${this.score}`;
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

// Initialize game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new BlockPuzzle();
    });
} else {
    // DOM is already loaded
    new BlockPuzzle();
}
