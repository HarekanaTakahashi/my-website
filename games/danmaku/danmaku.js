'use strict';

// ゲーム定数
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const PLAYER_RADIUS = 8;
const PLAYER_SPEED = 4;
const PLAYER_SLOW_SPEED = 1.5; // Shiftキーでの低速移動
const BULLET_RADIUS = 4;
const BULLET_SPEED = 2;
const INITIAL_SPAWN_INTERVAL = 1000;
const MIN_SPAWN_INTERVAL = 200;
const ENEMY_RADIUS = 10;
const ENEMY_APPEAR_TIME = 500; // 敵が表示されてから弾を発射するまでの時間（ms）

// ゲーム状態
const GameState = {
    READY: 'ready',
    PLAYING: 'playing',
    GAME_OVER: 'game-over'
};

class DanmakuGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.timeDisplay = document.getElementById('time-display');
        this.bestTimeElement = document.getElementById('best-time');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.retryBtn = document.getElementById('retry-btn');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.finalTimeElement = document.getElementById('final-time');

        this.state = GameState.READY;
        this.player = null;
        this.bullets = [];
        this.enemies = []; // 敵（弾を発射する場所）
        this.keys = {};
        this.startTime = 0;
        this.currentTime = 0;
        this.spawnInterval = INITIAL_SPAWN_INTERVAL;
        this.lastSpawnTime = 0;
        this.animationId = null;

        this.initEventListeners();
        this.loadBestTime();
        this.drawStartScreen();
    }

    initEventListeners() {
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift'].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // ボタンクリック
        this.newGameBtn.addEventListener('click', () => this.startGame());
        this.retryBtn.addEventListener('click', () => this.startGame());

        // キャンバスがフォーカスを受けたときにゲーム開始
        this.canvas.addEventListener('click', () => {
            if (this.state === GameState.READY) {
                this.canvas.focus();
                this.startGame();
            }
        });
    }

    loadBestTime() {
        const bestTime = localStorage.getItem('danmaku-best-time');
        if (bestTime) {
            this.bestTimeElement.textContent = `${parseFloat(bestTime).toFixed(1)}秒`;
        }
    }

    saveBestTime(time) {
        const currentBest = localStorage.getItem('danmaku-best-time');
        if (!currentBest || time > parseFloat(currentBest)) {
            localStorage.setItem('danmaku-best-time', time.toFixed(1));
            this.bestTimeElement.textContent = `${time.toFixed(1)}秒`;
        }
    }

    startGame() {
        this.state = GameState.PLAYING;
        this.player = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 50,
            radius: PLAYER_RADIUS
        };
        this.bullets = [];
        this.enemies = [];
        this.startTime = performance.now();
        this.currentTime = 0;
        this.spawnInterval = INITIAL_SPAWN_INTERVAL;
        this.lastSpawnTime = 0;
        this.gameOverScreen.classList.add('hidden');
        
        this.canvas.focus();
        this.gameLoop();
    }

    drawStartScreen() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('クリックしてスタート', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('矢印キーで移動', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        this.ctx.fillText('Shiftで低速移動', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
    }

    gameLoop() {
        if (this.state !== GameState.PLAYING) return;

        this.update();
        this.draw();

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // 時間更新
        this.currentTime = (performance.now() - this.startTime) / 1000;
        this.timeDisplay.textContent = `${this.currentTime.toFixed(1)}秒`;

        // 難易度調整（時間経過で弾幕が増える）
        this.spawnInterval = Math.max(
            MIN_SPAWN_INTERVAL,
            INITIAL_SPAWN_INTERVAL - (this.currentTime * 20)
        );

        // プレイヤー移動（Shiftキーで低速移動）
        const moveSpeed = this.keys['Shift'] ? PLAYER_SLOW_SPEED : PLAYER_SPEED;
        
        if (this.keys['ArrowLeft'] && this.player.x > this.player.radius) {
            this.player.x -= moveSpeed;
        }
        if (this.keys['ArrowRight'] && this.player.x < CANVAS_WIDTH - this.player.radius) {
            this.player.x += moveSpeed;
        }
        if (this.keys['ArrowUp'] && this.player.y > this.player.radius) {
            this.player.y -= moveSpeed;
        }
        if (this.keys['ArrowDown'] && this.player.y < CANVAS_HEIGHT - this.player.radius) {
            this.player.y += moveSpeed;
        }

        // 敵の更新
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const elapsed = this.currentTime * 1000 - enemy.spawnTime;
            
            // 敵が表示されてから一定時間後に弾を発射
            if (!enemy.hasFired && elapsed >= ENEMY_APPEAR_TIME) {
                enemy.hasFired = true;
                enemy.patternFunc(enemy.x, enemy.y);
            }
            
            // 弾を発射してから1秒後に敵を削除
            if (enemy.hasFired && elapsed >= ENEMY_APPEAR_TIME + 1000) {
                this.enemies.splice(i, 1);
            }
        }

        // 弾幕生成（敵を生成）
        if (this.currentTime * 1000 - this.lastSpawnTime > this.spawnInterval) {
            this.spawnEnemy();
            this.lastSpawnTime = this.currentTime * 1000;
        }

        // 弾幕移動
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            // 画面外の弾を削除
            if (bullet.x < -20 || bullet.x > CANVAS_WIDTH + 20 ||
                bullet.y < -20 || bullet.y > CANVAS_HEIGHT + 20) {
                this.bullets.splice(i, 1);
                continue;
            }

            // 衝突判定
            if (this.checkCollision(this.player, bullet)) {
                this.gameOver();
                return;
            }
        }
    }

    spawnEnemy() {
        const patterns = [
            { func: this.spawnCirclePattern.bind(this) },
            { func: this.spawnSpiralPattern.bind(this) },
            { func: this.spawnTargetedPattern.bind(this) },
            { func: this.spawnRandomPattern.bind(this) }
        ];

        // ランダムなパターンを選択
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // 敵の出現位置を決定（上部30%の範囲、プレイヤーから一定距離離れた場所）
        let enemyX, enemyY;
        let attempts = 0;
        const minDistanceFromPlayer = 100; // プレイヤーから最低100px離す
        const maxAttempts = 20;
        
        do {
            enemyX = 50 + Math.random() * (CANVAS_WIDTH - 100);
            enemyY = 30 + Math.random() * (CANVAS_HEIGHT * 0.3 - 30);
            const dx = enemyX - this.player.x;
            const dy = enemyY - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance >= minDistanceFromPlayer) {
                break;
            }
            attempts++;
        } while (attempts < maxAttempts);
        
        // 最終チェック：安全な距離が確保できなかった場合は、画面上部中央に配置
        const dx = enemyX - this.player.x;
        const dy = enemyY - this.player.y;
        const finalDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (finalDistance < minDistanceFromPlayer) {
            enemyX = CANVAS_WIDTH / 2;
            enemyY = 30;
        }
        
        // 敵を配列に追加
        this.enemies.push({
            x: enemyX,
            y: enemyY,
            radius: ENEMY_RADIUS,
            spawnTime: this.currentTime * 1000,
            hasFired: false,
            patternFunc: pattern.func
        });
    }

    spawnCirclePattern(centerX, centerY) {
        const bulletCount = 12 + Math.floor(this.currentTime / 5);

        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 * i) / bulletCount;
            this.bullets.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * BULLET_SPEED,
                vy: Math.sin(angle) * BULLET_SPEED,
                radius: BULLET_RADIUS,
                color: '#ff6b6b'
            });
        }
    }

    spawnSpiralPattern(centerX, centerY) {
        const bulletCount = 8;
        const rotation = (this.currentTime * 2) % (Math.PI * 2);

        for (let i = 0; i < bulletCount; i++) {
            const angle = rotation + (Math.PI * 2 * i) / bulletCount;
            this.bullets.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * BULLET_SPEED,
                vy: Math.sin(angle) * BULLET_SPEED,
                radius: BULLET_RADIUS,
                color: '#4ecdc4'
            });
        }
    }

    spawnTargetedPattern(startX, startY) {
        const bulletCount = 5;

        for (let i = 0; i < bulletCount; i++) {
            const angle = Math.atan2(
                this.player.y - startY,
                this.player.x - startX
            ) + (Math.random() - 0.5) * 0.4;

            this.bullets.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * BULLET_SPEED * 1.2,
                vy: Math.sin(angle) * BULLET_SPEED * 1.2,
                radius: BULLET_RADIUS,
                color: '#f9ca24'
            });
        }
    }

    spawnRandomPattern(startX, startY) {
        const bulletCount = 3 + Math.floor(this.currentTime / 10);
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;

            this.bullets.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * BULLET_SPEED,
                vy: Math.sin(angle) * BULLET_SPEED,
                radius: BULLET_RADIUS,
                color: '#a29bfe'
            });
        }
    }

    checkCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    }

    draw() {
        // 背景
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // グリッド（オプション）
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < CANVAS_WIDTH; i += 50) {
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, CANVAS_HEIGHT);
        }
        for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(CANVAS_WIDTH, i);
        }
        this.ctx.stroke();

        // 敵描画（弾を発射する場所を事前に表示）
        this.enemies.forEach(enemy => {
            const elapsed = this.currentTime * 1000 - enemy.spawnTime;
            const opacity = Math.min(1, elapsed / ENEMY_APPEAR_TIME);
            
            // 敵の本体
            this.ctx.fillStyle = `rgba(255, 100, 100, ${opacity * 0.6})`;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 警告エフェクト（点滅）
            if (!enemy.hasFired) {
                const pulse = Math.sin((elapsed / 100) * Math.PI) * 0.5 + 0.5;
                this.ctx.strokeStyle = `rgba(255, 200, 0, ${pulse * opacity})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });

        // 弾幕描画
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = bullet.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // プレイヤー描画
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00ff00';
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // プレイヤーの当たり判定を視覚化（小さい中心点）
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Shift低速移動中の表示
        if (this.keys['Shift']) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.saveBestTime(this.currentTime);
        
        this.finalTimeElement.textContent = `生存時間: ${this.currentTime.toFixed(1)}秒`;
        this.gameOverScreen.classList.remove('hidden');
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    new DanmakuGame();
});
