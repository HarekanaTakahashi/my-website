'use strict';

/**
 * 運試しゲームの設定ファイル
 */
export const GAME_CONFIG = {
    // LocalStorage キー
    STORAGE_KEY: 'luckTestBestScore',
    
    // アニメーション設定
    ANIMATION: {
        FADE_OUT_DURATION: 500,  // フェードアウト時間（ミリ秒）
        RESULT_DELAY: 1000,      // 結果表示までの待機時間（ミリ秒）
        NEXT_ROUND_DELAY: 1500   // 次のラウンドまでの待機時間（ミリ秒）
    },
    
    // UI メッセージ
    MESSAGES: {
        INSTRUCTION: 'どちらかを選んでください',
        CORRECT: '当たり！',
        WRONG: 'はずれ...',
        GAME_OVER: 'ゲームオーバー'
    },
    
    // ゲーム設定
    CORRECT_PROBABILITY: 0.5  // 正解の確率（0.5 = 50%）
};
