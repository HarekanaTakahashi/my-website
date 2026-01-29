'use strict';

// ゲーム状態の管理
const GameState = {
    IDLE: 'idle',
    WAITING: 'waiting',
    READY: 'ready',
    TOO_EARLY: 'too-early',
    COMPLETED: 'completed'
};

class ReactionTest {
    constructor() {
        this.state = GameState.IDLE;
        this.currentRound = 0;
        this.totalRounds = 3;
        this.reactionTimes = [];
        this.startTime = 0;
        this.timeoutId = null;
        this.tooEarlyTimeoutId = null;

        this.initElements();
        this.initEventListeners();
        this.loadBestTime();
    }

    initElements() {
        this.testArea = document.getElementById('test-area');
        this.statusMessage = document.getElementById('status-message');
        this.results = document.getElementById('results');
        this.resultList = document.getElementById('result-list');
        this.averageTime = document.getElementById('average-time');
        this.bestTimeElement = document.getElementById('best-time');
        this.retryBtn = document.getElementById('retry-btn');
        this.gameInfo = document.getElementById('game-info');
    }

    initEventListeners() {
        this.testArea.addEventListener('click', () => this.handleClick());
        this.testArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleClick();
            }
        });
        this.retryBtn.addEventListener('click', () => this.reset());
    }

    loadBestTime() {
        const bestTime = localStorage.getItem('reaction-test-best');
        if (bestTime) {
            this.bestTimeElement.textContent = `${bestTime}ms`;
        }
    }

    saveBestTime(time) {
        const currentBest = localStorage.getItem('reaction-test-best');
        if (!currentBest || time < parseInt(currentBest, 10)) {
            localStorage.setItem('reaction-test-best', time.toString());
            this.bestTimeElement.textContent = `${time}ms`;
        }
    }

    handleClick() {
        switch (this.state) {
            case GameState.IDLE:
                this.startRound();
                break;
            case GameState.WAITING:
                this.handleTooEarly();
                break;
            case GameState.READY:
                this.recordReaction();
                break;
            case GameState.TOO_EARLY:
                // 早すぎた場合は何もしない（メッセージ表示中）
                break;
        }
    }

    startRound() {
        this.state = GameState.WAITING;
        this.currentRound++;
        
        this.testArea.className = 'test-area waiting';
        this.statusMessage.textContent = '待機中...';
        this.gameInfo.textContent = `テスト ${this.currentRound}/${this.totalRounds} - 緑色になるまで待ってください`;

        // ランダムな時間（1秒〜5秒）後に緑色を表示
        const waitTime = 1000 + Math.random() * 4000;
        
        this.timeoutId = setTimeout(() => {
            this.showReady();
        }, waitTime);
    }

    showReady() {
        this.state = GameState.READY;
        this.testArea.className = 'test-area ready';
        this.statusMessage.textContent = 'クリック！';
        
        // performance.now()を使用して環境に依存しない高精度な時間計測
        this.startTime = performance.now();
    }

    handleTooEarly() {
        this.state = GameState.TOO_EARLY;
        
        // タイムアウトをキャンセル
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        this.testArea.className = 'test-area too-early';
        this.statusMessage.textContent = '早すぎました！';
        this.gameInfo.textContent = '緑色になってからクリックしてください。';

        // 1.5秒後に現在のラウンドをリセット
        this.tooEarlyTimeoutId = setTimeout(() => {
            this.currentRound--;
            this.reset();
        }, 1500);
    }

    recordReaction() {
        // performance.now()で高精度な経過時間を計算
        const endTime = performance.now();
        const reactionTime = Math.round(endTime - this.startTime);
        
        this.reactionTimes.push(reactionTime);

        if (this.currentRound < this.totalRounds) {
            // 次のラウンドへ
            this.testArea.className = 'test-area';
            this.statusMessage.textContent = `${reactionTime}ms - クリックして次へ`;
            this.gameInfo.textContent = `良い反応です！ 次のテストに進んでください。`;
            this.state = GameState.IDLE;
        } else {
            // 全ラウンド完了
            this.showResults();
        }
    }

    showResults() {
        this.state = GameState.COMPLETED;
        
        // 平均を計算
        const average = Math.round(
            this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length
        );

        // ベストタイムを保存
        this.saveBestTime(average);

        // 結果を表示
        this.testArea.classList.add('hidden');
        this.results.classList.remove('hidden');

        // 各ラウンドの結果を表示
        this.resultList.innerHTML = this.reactionTimes
            .map((time, index) => `
                <div class="result-item">
                    <span class="label">テスト ${index + 1}:</span>
                    <span class="value">${time}ms</span>
                </div>
            `)
            .join('');

        this.averageTime.textContent = `${average}ms`;
        
        // 評価メッセージ
        let message = '';
        if (average < 200) {
            message = '素晴らしい！非常に速い反応です！';
        } else if (average < 250) {
            message = '優秀です！良い反応時間です。';
        } else if (average < 300) {
            message = '良い結果です！';
        } else {
            message = '練習すればもっと速くなります！';
        }
        this.gameInfo.textContent = message;
    }

    reset() {
        this.state = GameState.IDLE;
        this.currentRound = 0;
        this.reactionTimes = [];
        this.startTime = 0;
        
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        if (this.tooEarlyTimeoutId) {
            clearTimeout(this.tooEarlyTimeoutId);
            this.tooEarlyTimeoutId = null;
        }

        this.testArea.classList.remove('hidden');
        this.testArea.className = 'test-area';
        this.statusMessage.textContent = 'クリックしてスタート';
        this.results.classList.add('hidden');
        this.gameInfo.textContent = '緑色が表示されたら、できるだけ速くクリックしてください。';
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    new ReactionTest();
});
