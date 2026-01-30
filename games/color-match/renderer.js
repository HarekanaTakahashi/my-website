'use strict';

import { GAME_CONFIG } from './config/color-match-config.js';

/**
 * Handles all rendering for the game
 */
export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.cellSize = 60;
    }
    
    render(board, currentPiece) {
        this.clearCanvas();
        this.drawGrid();
        this.drawBoard(board);
        
        if (currentPiece && currentPiece.isFalling) {
            this.drawGhostPiece(board, currentPiece);
            this.drawCurrentPiece(currentPiece);
        }
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#2a2a2a';
        this.ctx.lineWidth = 1;
        
        // Horizontal lines
        for (let row = 0; row <= GAME_CONFIG.ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.cellSize);
            this.ctx.lineTo(GAME_CONFIG.COLS * this.cellSize, row * this.cellSize);
            this.ctx.stroke();
        }
        
        // Vertical lines
        for (let col = 0; col <= GAME_CONFIG.COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.cellSize, 0);
            this.ctx.lineTo(col * this.cellSize, GAME_CONFIG.ROWS * this.cellSize);
            this.ctx.stroke();
        }
    }
    
    drawBoard(board) {
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const color = board[row][col];
                if (color !== GAME_CONFIG.EMPTY) {
                    this.drawBall(col, row, color);
                }
            }
        }
    }
    
    drawCurrentPiece(piece) {
        for (const ball of piece.balls) {
            const col = piece.col + ball.offsetCol;
            const row = piece.row + ball.offsetRow;
            
            if (row >= 0) {
                this.drawBall(col, row, ball.color);
            }
        }
    }
    
    drawGhostPiece(board, piece) {
        // Calculate drop position
        let ghostRow = piece.row;
        while (this.canPlacePiece(board, piece.col, ghostRow + 1, piece.balls)) {
            ghostRow++;
        }
        
        // Don't draw ghost if it's at current position
        if (ghostRow === piece.row) return;
        
        // Draw ghost balls with transparency
        this.ctx.globalAlpha = 0.3;
        for (const ball of piece.balls) {
            const col = piece.col + ball.offsetCol;
            const row = ghostRow + ball.offsetRow;
            
            if (row >= 0) {
                this.drawBall(col, row, ball.color);
            }
        }
        this.ctx.globalAlpha = 1.0;
    }
    
    canPlacePiece(board, col, row, balls) {
        for (const ball of balls) {
            const ballCol = col + ball.offsetCol;
            const ballRow = row + ball.offsetRow;
            
            if (ballCol < 0 || ballCol >= GAME_CONFIG.COLS) return false;
            if (ballRow >= GAME_CONFIG.ROWS) return false;
            
            if (ballRow >= 0 && board[ballRow][ballCol] !== GAME_CONFIG.EMPTY) {
                return false;
            }
        }
        return true;
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
    
    renderNextPiece(nextPieceElement, nextPiece) {
        nextPieceElement.innerHTML = '';
        
        if (!nextPiece) return;
        
        const ballSize = 28;
        const spacing = 32;
        
        for (const ball of nextPiece.balls) {
            const ballElement = document.createElement('div');
            ballElement.className = `ball ${ball.color}`;
            ballElement.style.width = `${ballSize}px`;
            ballElement.style.height = `${ballSize}px`;
            ballElement.style.left = `${16 + ball.offsetCol * spacing}px`;
            ballElement.style.top = `${60 + ball.offsetRow * spacing}px`;
            
            nextPieceElement.appendChild(ballElement);
        }
    }
}
