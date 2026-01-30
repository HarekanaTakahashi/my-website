// Tetris configuration and constants

export const GAME_CONFIG = {
    // Board dimensions
    BOARD_WIDTH: 10,
    BOARD_HEIGHT: 20,
    VISIBLE_HEIGHT: 20,
    
    // Cell size for rendering
    CELL_SIZE: 25,
    
    // Game timing (milliseconds)
    INITIAL_DROP_INTERVAL: 1000,
    SOFT_DROP_INTERVAL: 50,
    LOCK_DELAY: 500,
    MAX_LOCK_RESETS: 15,
    LINE_CLEAR_DELAY: 300,
    
    // Scoring
    SCORES: {
        SINGLE: 100,
        DOUBLE: 300,
        TRIPLE: 500,
        TETRIS: 800,
        T_SPIN_MINI: 100,
        T_SPIN_SINGLE: 800,
        T_SPIN_DOUBLE: 1200,
        T_SPIN_TRIPLE: 1600,
        SOFT_DROP: 1,
        HARD_DROP: 2
    },
    
    // LocalStorage keys
    STORAGE_KEYS: {
        BEST_SCORE: 'tetris-best-score',
        BEST_LINES: 'tetris-best-lines'
    }
};

// Tetromino shapes (SRS standard)
export const TETROMINOS = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00f0f0',
        name: 'I'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000f0',
        name: 'J'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#f0a000',
        name: 'L'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#f0f000',
        name: 'O'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00f000',
        name: 'S'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#a000f0',
        name: 'T'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#f00000',
        name: 'Z'
    }
};

// Super Rotation System (SRS) kick data
// Format: [x, y] offsets to try when rotation fails
export const SRS_KICK_DATA = {
    // JLSTZ kicks
    JLSTZ: {
        '0->R': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        'R->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        'R->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '2->R': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '2->L': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        'L->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        'L->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '0->L': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
    },
    // I piece kicks
    I: {
        '0->R': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        'R->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        'R->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        '2->R': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '2->L': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        'L->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        'L->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '0->L': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
    },
    // O piece has no kicks (always rotates in place)
    O: {
        '0->R': [[0, 0]],
        'R->0': [[0, 0]],
        'R->2': [[0, 0]],
        '2->R': [[0, 0]],
        '2->L': [[0, 0]],
        'L->2': [[0, 0]],
        'L->0': [[0, 0]],
        '0->L': [[0, 0]]
    }
};

// UI messages
export const MESSAGES = {
    GAME_OVER: 'ゲームオーバー',
    PAUSED: '一時停止',
    PRESS_SPACE: 'スペースキーで開始',
    T_SPIN: 'T-Spin!',
    T_SPIN_MINI: 'T-Spin Mini!',
    SINGLE: 'Single!',
    DOUBLE: 'Double!',
    TRIPLE: 'Triple!',
    TETRIS: 'TETRIS!',
    PERFECT_CLEAR: 'Perfect Clear!'
};

// Key bindings
export const KEY_BINDINGS = {
    MOVE_LEFT: ['a', 'A'],
    MOVE_RIGHT: ['d', 'D'],
    SOFT_DROP: ['s', 'S'],
    HARD_DROP: ['w', 'W'],
    ROTATE_CW: ['ArrowRight'],
    ROTATE_CCW: ['ArrowLeft'],
    HOLD: [' '],
    PAUSE: ['Escape', 'p', 'P'],
    RESTART: ['r', 'R']
};
