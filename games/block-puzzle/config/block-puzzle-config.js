'use strict';

/**
 * Block Puzzle Configuration and Block Shapes
 */

export const BOARD_SIZE = 10;
export const STORAGE_KEY = 'blockPuzzleBestScore';
export const LINE_CLEAR_MULTIPLIER = 2;

// Block shapes (no rotation, various shapes)
export const BLOCK_SHAPES = [
    // Single and 2x1
    [[1]], [[1, 1]], [[1], [1]],
    // 3x1
    [[1, 1, 1]], [[1], [1], [1]],
    // L shapes
    [[1, 0], [1, 1]], [[1, 1], [1, 0]], [[1, 1], [0, 1]], [[0, 1], [1, 1]],
    // 2x2 square
    [[1, 1], [1, 1]],
    // T shapes
    [[1, 1, 1], [0, 1, 0]], [[0, 1], [1, 1], [0, 1]], 
    [[0, 1, 0], [1, 1, 1]], [[1, 0], [1, 1], [1, 0]],
    // Z shapes
    [[1, 1, 0], [0, 1, 1]], [[0, 1], [1, 1], [1, 0]],
    // 3x3 shapes
    [[1, 1, 1], [1, 0, 1], [1, 1, 1]], [[1, 0, 1], [1, 1, 1], [1, 0, 1]],
];

export const MESSAGES = {
    GAME_OVER: 'ゲームオーバー',
    SCORE_PREFIX: 'スコア: '
};
