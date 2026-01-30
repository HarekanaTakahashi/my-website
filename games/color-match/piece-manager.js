'use strict';

import { GAME_CONFIG } from './config/color-match-config.js';

/**
 * Manages piece generation and movement
 */
export class PieceManager {
    constructor(colorGenerator) {
        this.colorGenerator = colorGenerator;
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
    
    canMovePiece(board, piece, deltaCol, deltaRow) {
        const newCol = piece.col + deltaCol;
        const newRow = piece.row + deltaRow;
        return this.canPlacePiece(board, newCol, newRow, piece.balls);
    }
    
    rotatePiece(board, piece, clockwise) {
        const [ball1, ball2] = piece.balls;
        
        // Calculate new position for ball2 (rotating around ball1)
        let newOffsetRow, newOffsetCol;
        
        if (clockwise) {
            // Clockwise: (r, c) -> (-c, r)
            newOffsetRow = -ball2.offsetCol;
            newOffsetCol = ball2.offsetRow;
        } else {
            // Counter-clockwise: (r, c) -> (c, -r)
            newOffsetRow = ball2.offsetCol;
            newOffsetCol = -ball2.offsetRow;
        }
        
        const testBalls = [
            ball1,
            { ...ball2, offsetRow: newOffsetRow, offsetCol: newOffsetCol }
        ];
        
        // Try rotation
        if (this.canPlacePiece(board, piece.col, piece.row, testBalls)) {
            ball2.offsetRow = newOffsetRow;
            ball2.offsetCol = newOffsetCol;
            return true;
        }
        
        // Try wall kicks (rotation assist)
        const kicks = [
            { col: -1, row: 0 },  // Left
            { col: 1, row: 0 },   // Right
            { col: 0, row: -1 },  // Up
            { col: -1, row: -1 }, // Left-Up
            { col: 1, row: -1 }   // Right-Up
        ];
        
        for (const kick of kicks) {
            const newCol = piece.col + kick.col;
            const newRow = piece.row + kick.row;
            
            if (this.canPlacePiece(board, newCol, newRow, testBalls)) {
                piece.col = newCol;
                piece.row = newRow;
                ball2.offsetRow = newOffsetRow;
                ball2.offsetCol = newOffsetCol;
                return true;
            }
        }
        
        return false;
    }
}
