'use strict';

/**
 * Slide Puzzle Game Configuration
 * Contains game settings and constants
 */

export const GAME_CONFIG = {
    // Available board sizes
    SIZES: [
        { value: 3, label: '3x3 (簡単)' },
        { value: 4, label: '4x4 (普通)' },
        { value: 5, label: '5x5 (難しい)' }
    ],
    
    // Default board size
    DEFAULT_SIZE: 3,
    
    // Minimum number of shuffle moves
    MIN_SHUFFLE_MOVES: 50,
    
    // Maximum number of shuffle moves
    MAX_SHUFFLE_MOVES: 100,
    
    // LocalStorage keys
    STORAGE_KEYS: {
        BEST_MOVES_PREFIX: 'slide-puzzle-best-moves-',
        CURRENT_SIZE: 'slide-puzzle-current-size'
    },
    
    // UI messages
    MESSAGES: {
        WIN_TITLE: 'クリア！',
        WIN_TEXT_PREFIX: '移動回数: ',
        WIN_TEXT_SUFFIX: ' 回',
        BEST_MOVES: 'ベスト: ',
        CURRENT_MOVES: '移動: ',
        INSTRUCTIONS: '空白マスに隣接するタイルをクリックするか、矢印キーで移動してください。',
        SHUFFLE_BUTTON: 'シャッフル',
        SIZE_LABEL: 'サイズ: '
    },
    
    // Animation duration in milliseconds
    ANIMATION_DURATION: 200
};
