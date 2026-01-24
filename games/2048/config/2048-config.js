'use strict';

/**
 * 2048 Game Configuration
 * Contains game settings and constants
 */

export const GAME_CONFIG = {
    // Board size (4x4 grid)
    BOARD_SIZE: 4,
    
    // Tile spawn probabilities
    TILE_SPAWN: {
        VALUE_2_PROBABILITY: 0.9,  // 90% chance for 2
        VALUE_4_PROBABILITY: 0.1   // 10% chance for 4
    },
    
    // Touch controls
    TOUCH: {
        MIN_SWIPE_DISTANCE: 30  // Minimum swipe distance in pixels
    },
    
    // Win condition
    WIN_TILE: 2048,
    
    // LocalStorage key
    STORAGE_KEY: '2048-best-score',
    
    // UI messages
    MESSAGES: {
        WIN_TITLE: '勝利！',
        WIN_TEXT: '2048を達成しました！続けてプレイできます。',
        GAME_OVER_TITLE: 'ゲームオーバー',
        GAME_OVER_TEXT_PREFIX: 'スコア: '
    }
};
