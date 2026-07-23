'use strict';

/**
 * Picross Game Configuration
 * Contains game settings and constants
 */

export const GAME_CONFIG = {
    // Cell states
    CELL_STATE: {
        EMPTY: 0,
        FILLED: 1,
        MARKED: 2  // X mark (empty cell marked by user)
    },
    
    // Lives system
    MAX_LIVES: 3,
    
    // LocalStorage keys
    STORAGE_KEYS: {
        BEST_TIMES: 'picross-best-times',
        CURRENT_PUZZLE: 'picross-current-puzzle'
    },
    
    // UI messages
    MESSAGES: {
        WIN_TITLE: '完成！',
        WIN_TEXT: 'ピクロスをクリアしました！',
        GAME_OVER_TITLE: 'ゲームオーバー',
        GAME_OVER_TEXT: 'ライフが0になりました。もう一度挑戦しましょう！',
        CONFIRM_NEW_GAME: '新しいパズルを始めますか？現在の進行状況は失われます。'
    }
};
