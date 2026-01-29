'use strict';

import { GAME_CONFIG } from './config/color-match-config.js';

/**
 * Manages the game board state and operations
 */
export class BoardManager {
    constructor() {
        this.board = [];
        this.setupBoard();
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
    
    getBoard() {
        return this.board;
    }
    
    placeBalls(piece) {
        for (const ball of piece.balls) {
            const col = piece.col + ball.offsetCol;
            const row = piece.row + ball.offsetRow;
            
            if (row >= 0 && row < GAME_CONFIG.ROWS && col >= 0 && col < GAME_CONFIG.COLS) {
                this.board[row][col] = ball.color;
            }
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
    
    clearMatches(matches) {
        for (const match of matches) {
            this.board[match.row][match.col] = GAME_CONFIG.EMPTY;
        }
    }
    
    applyGravity() {
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
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (this.board[0][col] !== GAME_CONFIG.EMPTY) {
                return true;
            }
        }
        return false;
    }
    
    reset() {
        this.setupBoard();
    }
}
