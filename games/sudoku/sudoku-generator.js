'use strict';

/**
 * Simple Sudoku Generator
 * Generates valid Sudoku puzzles by:
 * 1. Creating a completed valid board using backtracking
 * 2. Removing cells to create a puzzle
 * Note: This doesn't guarantee unique solutions but creates playable puzzles
 */

// Shuffle array helper
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Check if number is valid in position
function isValid(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) {
            return false;
        }
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) {
            return false;
        }
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[boxRow + i][boxCol + j] === num) {
                return false;
            }
        }
    }
    
    return true;
}

// Fill board using backtracking
function fillBoard(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                // Try numbers 1-9 in random order
                const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const num of numbers) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (fillBoard(board)) {
                            return true;
                        }
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// Generate a completed Sudoku board
function generateCompleteBoard() {
    const board = Array(9).fill(0).map(() => Array(9).fill(0));
    fillBoard(board);
    return board;
}

// Remove cells to create puzzle
function createPuzzle(board, cellsToRemove) {
    const puzzle = board.map(row => [...row]);
    let removed = 0;
    const attempts = cellsToRemove * 3; // Limit attempts to avoid infinite loop
    
    for (let i = 0; i < attempts && removed < cellsToRemove; i++) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        
        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            removed++;
        }
    }
    
    return puzzle;
}

/**
 * Generate a new Sudoku puzzle
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Object} { puzzle: 9x9 array, solution: 9x9 array }
 */
export function generateSudoku(difficulty = 'medium') {
    // Determine cells to remove based on difficulty
    const cellsToRemove = {
        'easy': 35,    // About 43% empty
        'medium': 45,  // About 56% empty
        'hard': 55     // About 68% empty
    };
    
    const removeCount = cellsToRemove[difficulty] || cellsToRemove['medium'];
    
    // Generate completed board
    const solution = generateCompleteBoard();
    
    // Create puzzle by removing cells
    const puzzle = createPuzzle(solution, removeCount);
    
    return {
        puzzle,
        solution
    };
}
