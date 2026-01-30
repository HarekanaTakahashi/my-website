'use strict';

/**
 * 2048 Board Logic Module
 * Handles tile movement and merging logic
 */

export class BoardLogic {
    constructor(size) {
        this.size = size;
    }

    moveLeft(board, addScore) {
        for (let i = 0; i < this.size; i++) {
            let row = board[i].filter(val => val !== 0);
            
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    addScore(row[j]);
                    row.splice(j + 1, 1);
                }
            }
            
            while (row.length < this.size) {
                row.push(0);
            }
            
            board[i] = row;
        }
    }
    
    moveRight(board, addScore) {
        for (let i = 0; i < this.size; i++) {
            let row = board[i].filter(val => val !== 0);
            
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    addScore(row[j]);
                    row.splice(j - 1, 1);
                    j--;
                }
            }
            
            while (row.length < this.size) {
                row.unshift(0);
            }
            
            board[i] = row;
        }
    }
    
    moveUp(board, addScore) {
        for (let j = 0; j < this.size; j++) {
            let col = [];
            for (let i = 0; i < this.size; i++) {
                if (board[i][j] !== 0) {
                    col.push(board[i][j]);
                }
            }
            
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2;
                    addScore(col[i]);
                    col.splice(i + 1, 1);
                }
            }
            
            while (col.length < this.size) {
                col.push(0);
            }
            
            for (let i = 0; i < this.size; i++) {
                board[i][j] = col[i];
            }
        }
    }
    
    moveDown(board, addScore) {
        for (let j = 0; j < this.size; j++) {
            let col = [];
            for (let i = 0; i < this.size; i++) {
                if (board[i][j] !== 0) {
                    col.push(board[i][j]);
                }
            }
            
            for (let i = col.length - 1; i > 0; i--) {
                if (col[i] === col[i - 1]) {
                    col[i] *= 2;
                    addScore(col[i]);
                    col.splice(i - 1, 1);
                    i--;
                }
            }
            
            while (col.length < this.size) {
                col.unshift(0);
            }
            
            for (let i = 0; i < this.size; i++) {
                board[i][j] = col[i];
            }
        }
    }

    canMove(board) {
        // Check for empty cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (board[i][j] === 0) return true;
            }
        }
        
        // Check for possible merges
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const current = board[i][j];
                if (j < this.size - 1 && current === board[i][j + 1]) return true;
                if (i < this.size - 1 && current === board[i + 1][j]) return true;
            }
        }
        
        return false;
    }
}
