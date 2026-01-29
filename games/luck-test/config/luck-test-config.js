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
        FADE_IN_DURATION: 500,   // フェードイン時間（ミリ秒）
        RESULT_DELAY: 1000,      // 結果表示までの待機時間（ミリ秒）
        NEXT_ROUND_DELAY: 1500   // 次のラウンドまでの待機時間（ミリ秒）
    },
    
    // UI メッセージ
    MESSAGES: {
        TITLE: '運試しゲーム',
        INSTRUCTION: 'どちらかを選んでください',
        LEFT_CHOICE: '左',
        RIGHT_CHOICE: '右',
        CORRECT: '当たり！',
        WRONG: 'はずれ...',
        GAME_OVER: 'ゲームオーバー',
        SCORE_PREFIX: '連続正解: ',
        BEST_SCORE_PREFIX: 'ベストスコア: ',
        NEW_GAME: '新しいゲーム'
    },
    
    // ゲーム設定
    CORRECT_PROBABILITY: 0.5  // 正解の確率（0.5 = 50%）
};
