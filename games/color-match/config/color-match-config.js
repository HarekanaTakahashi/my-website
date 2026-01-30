'use strict';

/**
 * Configuration for Color Match Puzzle Game
 */
export const GAME_CONFIG = {
    // Board dimensions
    COLS: 6,
    ROWS: 12,
    VISIBLE_ROWS: 12, // All rows visible
    
    // Colors
    COLORS: ['red', 'blue', 'green', 'yellow', 'purple'],
    EMPTY: 0,
    
    // Game mechanics
    MIN_MATCH: 4, // Minimum number of connected balls to clear
    
    // Timing (in milliseconds)
    FALL_INTERVAL: 500, // Normal fall speed
    FAST_FALL_INTERVAL: 50, // Accelerated fall speed
    GROUND_DELAY: 500, // Grace period after touching ground
    MAX_GROUND_DELAY_EXTENSIONS: 15, // Max times delay can be extended
    CHAIN_DELAY: 400, // Delay between chain reactions
    CLEAR_ANIMATION_DURATION: 300, // Duration of clear animation
    
    // Scoring
    BASE_CLEAR_SCORE: 10, // Base score per ball cleared
    CHAIN_MULTIPLIER: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512], // Multipliers for chains (1st, 2nd, 3rd, etc.)
    COLOR_BONUS: 2, // Bonus per different color in a clear
    
    // Controls
    MOVE_DELAY: 100, // Delay for continuous movement
    ROTATE_DELAY: 150, // Delay for continuous rotation
    
    // Storage keys
    STORAGE_KEY_BEST_SCORE: 'colorMatch_bestScore',
    
    // UI Messages
    MESSAGES: {
        GAME_OVER_TITLE: 'ゲームオーバー',
        GAME_OVER_TEXT: 'もう一度挑戦しますか？',
        CONTROLS_INFO: 'AD: 移動 | ←→: 回転 | W: ハードドロップ | S: 早く落とす',
        START_GAME: 'Wキーを押してスタート',
        CHAIN_PREFIX: '連鎖: ',
        COMBO: 'れんさ'
    },
    
    // Gravity
    GRAVITY_FALL_SPEED: 150 // Speed of ball falling (ms per row)
};
