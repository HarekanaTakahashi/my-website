import { GAME_CONFIG } from '../config/tetris-config.js';

export class Renderer {
    constructor(canvasId, nextCanvasId, holdCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById(nextCanvasId);
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById(holdCanvasId);
        this.holdCtx = this.holdCanvas.getContext('2d');
    }
    
    drawBoard(board, currentPiece, currentX, currentY) {
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
                if (board.grid[row][col]) {
                    this.ctx.fillStyle = board.grid[row][col];
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
        if (currentPiece) {
            this.drawGhost(board, currentPiece, currentX, currentY);
        }
        
        // Draw current piece
        if (currentPiece) {
            this.drawPiece(
                this.ctx,
                currentPiece,
                currentX,
                currentY,
                GAME_CONFIG.CELL_SIZE
            );
        }
    }
    
    drawGhost(board, piece, x, y) {
        let ghostY = y;
        const shape = piece.getShape();
        while (board.isValidPosition(x, ghostY + 1, shape)) {
            ghostY++;
        }
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const drawX = x + col;
                    const drawY = ghostY + row;
                    if (drawY >= 0) {
                        this.ctx.strokeStyle = piece.color;
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(
                            drawX * GAME_CONFIG.CELL_SIZE + 2,
                            drawY * GAME_CONFIG.CELL_SIZE + 2,
                            GAME_CONFIG.CELL_SIZE - 4,
                            GAME_CONFIG.CELL_SIZE - 4
                        );
                    }
                }
            }
        }
    }
    
    drawPiece(ctx, piece, x, y, cellSize) {
        const shape = piece.getShape();
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const drawX = x + col;
                    const drawY = y + row;
                    if (drawY >= 0) {
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
    
    drawNext(nextPieces) {
        this.nextCtx.fillStyle = '#222';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const previewSize = 25;
        let offsetY = 10;
        
        for (let i = 0; i < Math.min(3, nextPieces.length); i++) {
            const piece = nextPieces[i];
            const shape = piece.getShape();
            const width = shape[0].length;
            const offsetX = (this.nextCanvas.width / previewSize - width) / 2;
            
            this.drawPreviewPiece(this.nextCtx, piece, offsetX, offsetY / previewSize, previewSize);
            offsetY += shape.length * previewSize + 20;
        }
    }
    
    drawHold(holdPiece) {
        this.holdCtx.fillStyle = '#222';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (holdPiece) {
            const previewSize = 25;
            const shape = holdPiece.getShape();
            const width = shape[0].length;
            const offsetX = (this.holdCanvas.width / previewSize - width) / 2;
            const offsetY = 1;
            
            this.drawPreviewPiece(this.holdCtx, holdPiece, offsetX, offsetY, previewSize);
        }
    }
    
    drawPreviewPiece(ctx, piece, x, y, cellSize) {
        const shape = piece.getShape();
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(
                        (x + col) * cellSize + 1,
                        (y + row) * cellSize + 1,
                        cellSize - 2,
                        cellSize - 2
                    );
                }
            }
        }
    }
}
