'use strict';

/**
 * ガチャシミュレーターの設定ファイル
 */

// デフォルトのグループ構造（階層型確率システム）
export const DEFAULT_GROUPS = [
    {
        id: 'rarity5',
        name: '★★★★★ 超レア',
        color: '#ff9800',
        probability: 3.0,  // グループ全体の確率
        subgroups: [
            {
                id: 'rarity5-normal',
                name: '通常',
                probability: 100,  // このグループ内での割合(%)
                items: [
                    { name: '伝説の剣' },
                    { name: '神獣の翼' },
                    { name: '聖なる盾' }
                ]
            }
        ]
    },
    {
        id: 'rarity4',
        name: '★★★★ スーパーレア',
        color: '#9c27b0',
        probability: 12.0,
        subgroups: [
            {
                id: 'rarity4-normal',
                name: '通常',
                probability: 100,
                items: [
                    { name: '魔法の杖' },
                    { name: '竜の鱗' },
                    { name: '騎士の鎧' },
                    { name: '精霊の指輪' }
                ]
            }
        ]
    },
    {
        id: 'rarity3',
        name: '★★★ レア',
        color: '#2196f3',
        probability: 25.0,
        subgroups: [
            {
                id: 'rarity3-normal',
                name: '通常',
                probability: 100,
                items: [
                    { name: '鋼の剣' },
                    { name: '弓矢セット' },
                    { name: '魔導書' }
                ]
            }
        ]
    },
    {
        id: 'rarity2',
        name: '★★ アンコモン',
        color: '#4caf50',
        probability: 30.0,
        subgroups: [
            {
                id: 'rarity2-normal',
                name: '通常',
                probability: 100,
                items: [
                    { name: '木の盾' },
                    { name: '皮の鎧' }
                ]
            }
        ]
    },
    {
        id: 'rarity1',
        name: '★ コモン',
        color: '#9e9e9e',
        probability: 30.0,
        subgroups: [
            {
                id: 'rarity1-normal',
                name: '通常',
                probability: 100,
                items: [
                    { name: '普通の剣' },
                    { name: '普通の盾' }
                ]
            }
        ]
    }
];

// 後方互換性のために保持（削除予定）
export const DEFAULT_ITEMS = [];
export const DEFAULT_RARITY_PROBABILITIES = {};

export const GAME_CONFIG = {
    // LocalStorage キー
    STORAGE_KEY_GROUPS: 'gachaSimulatorGroups',
    STORAGE_KEY_ITEMS: 'gachaSimulatorItems',  // 後方互換性のために保持
    STORAGE_KEY_RARITY_PROBS: 'gachaSimulatorRarityProbs',  // 後方互換性のために保持
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
    
    // レアリティ設定（削除予定 - グループから動的に生成）
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
