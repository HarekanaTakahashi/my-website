'use strict';

export const SYMBOLS = [
    { id: 'cherry',   emoji: '🍒', name: 'チェリー',   weight: 25 },
    { id: 'lemon',    emoji: '🍋', name: 'レモン',     weight: 22 },
    { id: 'orange',   emoji: '🍊', name: 'オレンジ',   weight: 20 },
    { id: 'grape',    emoji: '🍇', name: 'ぶどう',     weight: 15 },
    { id: 'bell',     emoji: '🔔', name: 'ベル',       weight: 10 },
    { id: 'star',     emoji: '⭐', name: 'スター',     weight: 5 },
    { id: 'seven',    emoji: '7️⃣', name: 'セブン',     weight: 2 },
    { id: 'diamond',  emoji: '💎', name: 'ダイヤモンド', weight: 1 },
];

export const PAYLINES = [
    { name: '上ライン',   cells: [[0,0],[0,1],[0,2]], color: '#ff6b6b' },
    { name: '中ライン',   cells: [[1,0],[1,1],[1,2]], color: '#ffd93d' },
    { name: '下ライン',   cells: [[2,0],[2,1],[2,2]], color: '#6bcb77' },
    { name: '斜め↘',     cells: [[0,0],[1,1],[2,2]], color: '#4d96ff' },
    { name: '斜め↗',     cells: [[2,0],[1,1],[0,2]], color: '#ff6fff' },
];

export const PAYOUTS = {
    cherry:  { three: 5 },
    lemon:   { three: 8 },
    orange:  { three: 10 },
    grape:   { three: 15 },
    bell:    { three: 25 },
    star:    { three: 50 },
    seven:   { three: 100 },
    diamond: { three: 250 },
};

export const GAME_CONFIG = {
    INITIAL_CREDITS: 1000,
    BET_OPTIONS: [1, 5, 10, 25, 50],
    DEFAULT_BET: 10,
    REELS: 3,
    ROWS: 3,
    CELL_HEIGHT: 90,
    SPIN_DURATION_BASE: 800,
    SPIN_DURATION_STEP: 400,
    SPIN_DURATION_JITTER: 300,
    SPIN_EXTRA_BASE: 8,
    SPIN_EXTRA_PER_REEL: 4,
    REEL_CASCADE_DELAY: 150,
    REEL_CASCADE_JITTER: 200,
    AUTO_PLAY_DELAY: 600,
    CELEBRATION_DURATION: 3000,
    SYMBOLS_PER_STRIP: 30,
    STORAGE_KEY: 'slot-game-data',
    MESSAGES: {
        WIN: '当たり！',
        BIG_WIN: '大当たり！！',
        JACKPOT: '🎉 JACKPOT!! 🎉',
        NO_CREDITS: 'クレジットが足りません',
        RESET_CONFIRM: 'データをリセットしますか？',
    },
    THRESHOLDS: {
        BIG_WIN_MULTIPLIER: 20,
        JACKPOT_MULTIPLIER: 50,
    },
};
