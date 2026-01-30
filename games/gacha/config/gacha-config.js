'use strict';

/**
 * ガチャシミュレーターの設定ファイル
 */

// デフォルトのガチャアイテム（★1～★5）
export const DEFAULT_ITEMS = [
    // ★5 (SSR) - 超レア (3.0%)
    { name: '伝説の剣', rarity: 5, probability: 1.0 },
    { name: '神獣の翼', rarity: 5, probability: 1.0 },
    { name: '聖なる盾', rarity: 5, probability: 1.0 },
    
    // ★4 (SR) - レア (12.0%)
    { name: '魔法の杖', rarity: 4, probability: 3.0 },
    { name: '竜の鱗', rarity: 4, probability: 3.0 },
    { name: '騎士の鎧', rarity: 4, probability: 3.0 },
    { name: '精霊の指輪', rarity: 4, probability: 3.0 },
    
    // ★3 (R) - アンコモン (25.0%)
    { name: '鋼の剣', rarity: 3, probability: 8.5 },
    { name: '弓矢セット', rarity: 3, probability: 8.0 },
    { name: '魔導書', rarity: 3, probability: 8.5 },
    
    // ★2 (UC) - コモン (30.0%)
    { name: '木の盾', rarity: 2, probability: 15.0 },
    { name: '皮の鎧', rarity: 2, probability: 15.0 },
    
    // ★1 (C) - 最もコモン (30.0%)
    { name: '普通の剣', rarity: 1, probability: 15.0 },
    { name: '普通の盾', rarity: 1, probability: 15.0 }
];

export const GAME_CONFIG = {
    // LocalStorage キー
    STORAGE_KEY_ITEMS: 'gachaSimulatorItems',
    STORAGE_KEY_SETTINGS: 'gachaSimulatorSettings',
    STORAGE_KEY_HISTORY: 'gachaSimulatorHistory',
    
    // ガチャ設定
    GACHA: {
        INITIAL_CURRENCY: 10000,  // 初期所持石
        SINGLE_COST: 150,         // 単発ガチャのコスト
        MULTI_COST: 1500,         // 10連ガチャのコスト
        MULTI_COUNT: 10           // 10連ガチャの回数
    },
    
    // 履歴設定
    HISTORY: {
        MAX_SIZE: 100,        // 保存する最大履歴数
        DISPLAY_COUNT: 20     // 履歴画面に表示する件数
    },
    
    // 検証設定
    VALIDATION: {
        PROBABILITY_TOLERANCE: 0.1  // 確率合計の許容誤差
    },
    
    // アニメーション設定
    ANIMATION: {
        RESULT_DELAY: 500,          // 各結果表示の間隔（ミリ秒）
        CARD_FLIP_DURATION: 600,    // カード反転時間（ミリ秒）
        FADE_DURATION: 300,         // フェードイン/アウト時間（ミリ秒）
        RARITY_EFFECT_DURATION: 1000 // レアリティエフェクトの時間（ミリ秒）
    },
    
    // レアリティ設定
    RARITY: {
        1: { name: 'コモン', color: '#9e9e9e', stars: '★' },
        2: { name: 'アンコモン', color: '#4caf50', stars: '★★' },
        3: { name: 'レア', color: '#2196f3', stars: '★★★' },
        4: { name: 'スーパーレア', color: '#9c27b0', stars: '★★★★' },
        5: { name: '超レア', color: '#ff9800', stars: '★★★★★' }
    },
    
    // UI メッセージ
    MESSAGES: {
        SINGLE_GACHA: '単発ガチャ',
        MULTI_GACHA: '10連ガチャ',
        RESULT_TITLE: 'ガチャ結果',
        SETTINGS_TITLE: '設定',
        NO_ITEMS: 'アイテムがありません',
        RESET_CONFIRM: '設定をリセットしますか？',
        PROBABILITY_ERROR: '確率の合計は100%にしてください',
        SAVE_SUCCESS: '設定を保存しました'
    },
    
    // デフォルト設定
    DEFAULT_SETTINGS: {
        animationEnabled: true,    // アニメーション有効/無効
        showProbability: true,     // 確率表示
        soundEnabled: false        // サウンド有効/無効（将来の拡張用）
    }
};
