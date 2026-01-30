import { GAME_CONFIG } from '../config/tetris-config.js';

export class Board {
    constructor() {
        this.grid = this.createBoard();
    }
    
    createBoard() {
        return Array.from({ length: GAME_CONFIG.BOARD_HEIGHT }, () => 
            Array(GAME_CONFIG.BOARD_WIDTH).fill(0)
        );
    }
    
    reset() {
        this.grid = this.createBoard();
    }
    
    isValidPosition(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= GAME_CONFIG.BOARD_WIDTH || 
                        newY >= GAME_CONFIG.BOARD_HEIGHT) {
                        return false;
                    }
                    
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    lockPiece(x, y, shape, color) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    if (boardY >= 0) {
                        this.grid[boardY][boardX] = color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        const linesToClear = [];
        
        for (let row = 0; row < GAME_CONFIG.BOARD_HEIGHT; row++) {
            if (this.grid[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }
        
        if (linesToClear.length > 0) {
            // Remove all cleared lines in reverse order
            for (let i = linesToClear.length - 1; i >= 0; i--) {
                this.grid.splice(linesToClear[i], 1);
            }
            
            // Add new empty lines at the top all at once
            for (let i = 0; i < linesToClear.length; i++) {
                this.grid.unshift(Array(GAME_CONFIG.BOARD_WIDTH).fill(0));
            }
        }
        
        return linesToClear.length;
    }
}
