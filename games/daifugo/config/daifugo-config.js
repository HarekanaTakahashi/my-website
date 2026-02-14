'use strict';

/**
 * 大富豪 (Daifugo) Game Configuration
 * Contains game settings, card ranks, and constants
 */

export const GAME_CONFIG = {
    // Number of players (1 human + 3 CPU)
    PLAYER_COUNT: 4,
    
    // Player names
    PLAYER_NAMES: ['あなた', 'CPU 1', 'CPU 2', 'CPU 3'],
    
    // Card suits
    SUITS: ['♠', '♥', '♦', '♣'],
    SUIT_CLASSES: {
        '♠': 'spade',
        '♥': 'heart',
        '♦': 'diamond',
        '♣': 'club'
    },
    
    // Card ranks (display values)
    RANKS: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'],
    
    // Card strength values (normal order: 3 is weakest, 2 is strongest)
    NORMAL_STRENGTH: {
        '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7,
        '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13, 'JOKER': 14
    },
    
    // Card strength values (revolution: reversed, but Joker still strongest)
    REVOLUTION_STRENGTH: {
        '3': 13, '4': 12, '5': 11, '6': 10, '7': 9, '8': 8, '9': 7,
        '10': 6, 'J': 5, 'Q': 4, 'K': 3, 'A': 2, '2': 1, 'JOKER': 14
    },
    
    // Revolution trigger (same rank cards count)
    REVOLUTION_CARD_COUNT: 4,
    
    // 8-giri (playing 8 clears the field)
    EIGHT_CUT_RANK: '8',
    
    // Forbidden finish cards (normal mode)
    FORBIDDEN_FINISH_NORMAL: ['2', 'JOKER', '8'],
    
    // Forbidden finish cards (revolution mode) - 3 instead of 2
    FORBIDDEN_FINISH_REVOLUTION: ['3', 'JOKER', '8'],
    
    // Card exchange counts
    EXCHANGE: {
        DAIFUGO_DAIHINMIN: 2,  // 大富豪 ↔ 大貧民
        FUGO_HINMIN: 1         // 富豪 ↔ 貧民
    },
    
    // Rankings
    RANKINGS: {
        0: '大富豪',
        1: '富豪',
        2: '貧民',
        3: '大貧民'
    },
    
    // LocalStorage keys
    STORAGE_KEY: 'daifugo-stats',
    
    // UI messages
    MESSAGES: {
        YOUR_TURN: 'あなたの番です',
        CPU_TURN: 'の番です',
        PASS: 'パス',
        REVOLUTION: '革命！',
        EIGHT_CUT: '8切り！',
        FORBIDDEN_FINISH: '反則上がり！大貧民に転落',
        MIYAKO_OCHI: '都落ち！大貧民に転落',
        GAME_OVER: 'ゲーム終了',
        NEW_ROUND: '新しいラウンド',
        CARD_EXCHANGE: 'カード交換',
        SELECT_CARDS: 'カードを選択してください',
        WAITING: '待機中...',
        FIELD_CLEARED: '場が流れました',
        WIN: '勝利！',
        LOSE: '敗北...'
    },
    
    // Animation delays (ms)
    DELAYS: {
        CPU_THINK: 800,
        CARD_PLAY: 400,
        FIELD_CLEAR: 1000,
        ROUND_END: 1500,
        MESSAGE_DISPLAY: 1500
    }
};
