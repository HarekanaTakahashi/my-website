'use strict';

import { SYMBOLS, PAYLINES, PAYOUTS, GAME_CONFIG } from './config/slot-config.js';

class SlotMachine {
    constructor() {
        this.credits = GAME_CONFIG.INITIAL_CREDITS;
        this.bet = GAME_CONFIG.DEFAULT_BET;
        this.totalWon = 0;
        this.spinning = false;
        this.autoPlay = false;
        this.reelStrips = [];
        this.currentResult = [];
        this.weightedPool = this.buildWeightedPool();

        this.loadState();
        this.initDOM();
        this.buildReels();
        this.renderPaytable();
        this.renderPaylineInfo();
        this.setupEventListeners();
        this.updateDisplay();
    }

    /* ---------- Weighted symbol pool ---------- */
    buildWeightedPool() {
        const pool = [];
        for (const symbol of SYMBOLS) {
            for (let i = 0; i < symbol.weight; i++) {
                pool.push(symbol);
            }
        }
        return pool;
    }

    randomSymbol() {
        return this.weightedPool[
            Math.floor(Math.random() * this.weightedPool.length)
        ];
    }

    /* ---------- DOM ---------- */
    initDOM() {
        this.els = {
            credits: document.getElementById('credits'),
            totalWon: document.getElementById('total-won'),
            betDisplay: document.getElementById('bet-display'),
            betUp: document.getElementById('bet-up'),
            betDown: document.getElementById('bet-down'),
            spinBtn: document.getElementById('spin-btn'),
            autoBtn: document.getElementById('auto-btn'),
            resetBtn: document.getElementById('reset-btn'),
            reelsContainer: document.getElementById('reels-container'),
            winDisplay: document.getElementById('win-display'),
            paytable: document.getElementById('paytable'),
            paylineInfo: document.getElementById('payline-info'),
            paylineOverlay: document.getElementById('payline-overlay'),
            gameMessage: document.getElementById('game-message'),
            messageTitle: document.getElementById('message-title'),
            messageText: document.getElementById('message-text'),
            messageCloseBtn: document.getElementById('message-close-btn'),
        };
        this.reelEls = [];
        for (let i = 0; i < GAME_CONFIG.REELS; i++) {
            this.reelEls.push(document.getElementById(`reel-${i}`));
        }
    }

    /* ---------- Build reel strips ---------- */
    buildReels() {
        const count = GAME_CONFIG.SYMBOLS_PER_STRIP;
        for (let r = 0; r < GAME_CONFIG.REELS; r++) {
            const strip = [];
            for (let i = 0; i < count; i++) {
                strip.push(this.randomSymbol());
            }
            this.reelStrips.push(strip);
            this.renderReelStrip(r);
        }
        this.snapToPosition();
    }

    renderReelStrip(reelIndex) {
        const reel = this.reelEls[reelIndex];
        const strip = this.reelStrips[reelIndex];
        const div = document.createElement('div');
        div.className = 'reel-strip';
        div.dataset.reel = reelIndex;
        for (const sym of strip) {
            const cell = document.createElement('div');
            cell.className = 'symbol-cell';
            cell.textContent = sym.emoji;
            cell.dataset.symbolId = sym.id;
            div.appendChild(cell);
        }
        reel.innerHTML = '';
        reel.appendChild(div);
    }

    snapToPosition() {
        for (let r = 0; r < GAME_CONFIG.REELS; r++) {
            const strip = this.reelEls[r].querySelector('.reel-strip');
            const stopIndex = this.reelStrips[r].length - GAME_CONFIG.ROWS;
            strip.style.transition = 'none';
            strip.style.top = `${-stopIndex * GAME_CONFIG.CELL_HEIGHT}px`;
        }
        this.updateCurrentResult();
    }

    updateCurrentResult() {
        this.currentResult = [];
        for (let r = 0; r < GAME_CONFIG.REELS; r++) {
            const strip = this.reelStrips[r];
            const startIdx = strip.length - GAME_CONFIG.ROWS;
            const col = [];
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                col.push(strip[startIdx + row]);
            }
            this.currentResult.push(col);
        }
    }

    /* ---------- Event Listeners ---------- */
    setupEventListeners() {
        this.els.spinBtn.addEventListener('click', () => this.spin());
        this.els.betUp.addEventListener('click', () => this.changeBet(1));
        this.els.betDown.addEventListener('click', () => this.changeBet(-1));
        this.els.autoBtn.addEventListener('click', () => this.toggleAutoPlay());
        this.els.resetBtn.addEventListener('click', () => this.resetGame());
        this.els.messageCloseBtn.addEventListener('click', () => this.hideMessage());
        this.els.gameMessage.addEventListener('click', (e) => {
            if (e.target === this.els.gameMessage) this.hideMessage();
        });

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e) {
        if (this.els.gameMessage.classList.contains('visible')) {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.hideMessage();
            }
            return;
        }
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.spin();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.changeBet(1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.changeBet(-1);
                break;
            case 'a':
            case 'A':
                this.toggleAutoPlay();
                break;
        }
    }

    /* ---------- Betting ---------- */
    changeBet(dir) {
        if (this.spinning) return;
        const opts = GAME_CONFIG.BET_OPTIONS;
        const idx = opts.indexOf(this.bet);
        const next = idx + dir;
        if (next >= 0 && next < opts.length) {
            this.bet = opts[next];
            this.updateDisplay();
            this.saveState();
        }
    }

    /* ---------- Spin ---------- */
    async spin() {
        if (this.spinning) return;
        if (this.credits < this.bet) {
            this.showMessage(
                GAME_CONFIG.MESSAGES.NO_CREDITS,
                `残り ${this.credits} クレジットです。ベットを下げるかリセットしてください。`
            );
            this.stopAutoPlay();
            return;
        }

        this.spinning = true;
        this.credits -= this.bet;
        this.els.spinBtn.disabled = true;
        this.els.spinBtn.classList.add('spinning');
        this.clearWinDisplay();
        this.clearHighlights();
        this.updateDisplay();

        // Generate new results and extend strips
        const newSymbols = [];
        for (let r = 0; r < GAME_CONFIG.REELS; r++) {
            const col = [];
            const extra = GAME_CONFIG.SPIN_EXTRA_BASE + r * GAME_CONFIG.SPIN_EXTRA_PER_REEL;
            for (let i = 0; i < extra + GAME_CONFIG.ROWS; i++) {
                const sym = this.randomSymbol();
                col.push(sym);
                this.reelStrips[r].push(sym);
            }
            newSymbols.push(col);
            this.appendSymbolsToDOM(r, col);
        }

        // Animate
        await this.animateReels();

        // Trim old symbols to keep memory reasonable
        this.trimReelStrips();

        this.updateCurrentResult();

        // Check wins
        const wins = this.evaluateWins();
        const totalPayout = wins.reduce((s, w) => s + w.payout, 0);

        if (totalPayout > 0) {
            this.credits += totalPayout;
            this.totalWon += totalPayout;
            this.showWin(wins, totalPayout);
        }

        this.spinning = false;
        this.els.spinBtn.disabled = false;
        this.els.spinBtn.classList.remove('spinning');
        this.updateDisplay();
        this.saveState();

        if (this.autoPlay && this.credits >= this.bet) {
            setTimeout(() => {
                if (this.autoPlay) this.spin();
            }, GAME_CONFIG.AUTO_PLAY_DELAY);
        } else if (this.autoPlay) {
            this.stopAutoPlay();
        }
    }

    appendSymbolsToDOM(reelIndex, symbols) {
        const strip = this.reelEls[reelIndex].querySelector('.reel-strip');
        for (const sym of symbols) {
            const cell = document.createElement('div');
            cell.className = 'symbol-cell';
            cell.textContent = sym.emoji;
            cell.dataset.symbolId = sym.id;
            strip.appendChild(cell);
        }
    }

    async animateReels() {
        const promises = [];
        for (let r = 0; r < GAME_CONFIG.REELS; r++) {
            const strip = this.reelEls[r].querySelector('.reel-strip');
            const totalCells = this.reelStrips[r].length;
            const stopPos = totalCells - GAME_CONFIG.ROWS;
            const duration = GAME_CONFIG.SPIN_DURATION_BASE
                           + r * GAME_CONFIG.SPIN_DURATION_STEP;

            strip.classList.add('spinning');

            const p = new Promise((resolve) => {
                setTimeout(() => {
                    strip.classList.remove('spinning');
                    strip.style.transition =
                        `top ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
                    strip.style.top = `${-stopPos * GAME_CONFIG.CELL_HEIGHT}px`;

                    const onEnd = () => {
                        strip.removeEventListener('transitionend', onEnd);
                        resolve();
                    };
                    strip.addEventListener('transitionend', onEnd);

                    // Fallback in case transitionend doesn't fire
                    setTimeout(resolve, duration + 100);
                }, r * GAME_CONFIG.REEL_CASCADE_DELAY);
            });
            promises.push(p);
        }
        await Promise.all(promises);
    }

    trimReelStrips() {
        const keep = GAME_CONFIG.SYMBOLS_PER_STRIP;
        for (let r = 0; r < GAME_CONFIG.REELS; r++) {
            const strip = this.reelStrips[r];
            if (strip.length > keep * 2) {
                const removeCount = strip.length - keep;
                this.reelStrips[r] = strip.slice(removeCount);
                this.renderReelStrip(r);
                const stopPos = this.reelStrips[r].length - GAME_CONFIG.ROWS;
                const domStrip = this.reelEls[r].querySelector('.reel-strip');
                domStrip.style.transition = 'none';
                domStrip.style.top = `${-stopPos * GAME_CONFIG.CELL_HEIGHT}px`;
            }
        }
    }

    /* ---------- Win Evaluation ---------- */
    evaluateWins() {
        const wins = [];
        // currentResult[reel][row] -> we need grid[row][reel]
        const grid = [];
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            grid[row] = [];
            for (let reel = 0; reel < GAME_CONFIG.REELS; reel++) {
                grid[row][reel] = this.currentResult[reel][row];
            }
        }

        for (let li = 0; li < PAYLINES.length; li++) {
            const line = PAYLINES[li];
            const lineSymbols = line.cells.map(([r, c]) => grid[r][c]);
            const firstId = lineSymbols[0].id;

            if (lineSymbols.every(s => s.id === firstId)) {
                // Three of a kind
                const payout = PAYOUTS[firstId].three * this.bet;
                wins.push({ lineIndex: li, line, symbolId: firstId, count: 3, payout });
            } else if (lineSymbols[0].id === lineSymbols[1].id) {
                // Two of a kind (first two)
                const payout = PAYOUTS[firstId].two * this.bet;
                wins.push({ lineIndex: li, line, symbolId: firstId, count: 2, payout });
            }
        }
        return wins;
    }

    /* ---------- Win Display ---------- */
    showWin(wins, totalPayout) {
        const multiplier = totalPayout / this.bet;
        let cssClass = 'win';
        let prefix = GAME_CONFIG.MESSAGES.WIN;

        if (multiplier >= GAME_CONFIG.THRESHOLDS.JACKPOT_MULTIPLIER) {
            cssClass = 'jackpot';
            prefix = GAME_CONFIG.MESSAGES.JACKPOT;
            this.celebrate();
        } else if (multiplier >= GAME_CONFIG.THRESHOLDS.BIG_WIN_MULTIPLIER) {
            cssClass = 'big-win';
            prefix = GAME_CONFIG.MESSAGES.BIG_WIN;
        }

        this.els.winDisplay.textContent = `${prefix} +${totalPayout} クレジット`;
        this.els.winDisplay.className = `win-display ${cssClass}`;

        // Highlight winning cells and paylines
        this.highlightWins(wins);
    }

    clearWinDisplay() {
        this.els.winDisplay.textContent = '';
        this.els.winDisplay.className = 'win-display';
    }

    highlightWins(wins) {
        // Highlight payline dots
        const dots = document.querySelectorAll('.payline-dot');
        for (const win of wins) {
            const dot = document.querySelector(
                `.payline-dot[data-line="${win.lineIndex}"]`
            );
            if (dot) dot.classList.add('active');

            // Highlight cells
            for (const [row, col] of win.line.cells) {
                const strip = this.reelEls[col].querySelector('.reel-strip');
                const cells = strip.querySelectorAll('.symbol-cell');
                const startIdx = this.reelStrips[col].length - GAME_CONFIG.ROWS;
                const cell = cells[startIdx + row];
                if (cell) cell.classList.add('highlight');
            }
        }
    }

    clearHighlights() {
        document.querySelectorAll('.payline-dot.active').forEach(
            el => el.classList.remove('active')
        );
        document.querySelectorAll('.symbol-cell.highlight').forEach(
            el => el.classList.remove('highlight')
        );
    }

    /* ---------- Celebration ---------- */
    celebrate() {
        const container = document.createElement('div');
        container.className = 'celebration';
        document.body.appendChild(container);

        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
                         '#ff6fff', '#667eea', '#f093fb'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 1}s`;
            confetti.style.width = `${6 + Math.random() * 8}px`;
            confetti.style.height = confetti.style.width;
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            container.appendChild(confetti);
        }

        setTimeout(() => container.remove(), GAME_CONFIG.CELEBRATION_DURATION);
    }

    /* ---------- Auto Play ---------- */
    toggleAutoPlay() {
        if (this.autoPlay) {
            this.stopAutoPlay();
        } else {
            this.autoPlay = true;
            this.els.autoBtn.classList.add('active');
            this.els.autoBtn.textContent = 'AUTO (ON)';
            if (!this.spinning) this.spin();
        }
    }

    stopAutoPlay() {
        this.autoPlay = false;
        this.els.autoBtn.classList.remove('active');
        this.els.autoBtn.textContent = 'AUTO';
    }

    /* ---------- UI Updates ---------- */
    updateDisplay() {
        this.els.credits.textContent = this.credits.toLocaleString();
        this.els.totalWon.textContent = this.totalWon.toLocaleString();
        this.els.betDisplay.textContent = this.bet;
    }

    /* ---------- Paytable & Info ---------- */
    renderPaytable() {
        const rows = SYMBOLS.map(sym => {
            const pay = PAYOUTS[sym.id];
            const row = document.createElement('div');
            row.className = 'paytable-row';
            row.innerHTML = `
                <span class="paytable-symbol">${sym.emoji}</span>
                <span class="paytable-name">${sym.name}</span>
                <span class="paytable-pays">×${pay.two} / ×${pay.three}</span>
            `;
            return row;
        });
        const frag = document.createDocumentFragment();
        rows.forEach(r => frag.appendChild(r));
        this.els.paytable.appendChild(frag);
    }

    renderPaylineInfo() {
        const frag = document.createDocumentFragment();
        for (const line of PAYLINES) {
            const row = document.createElement('div');
            row.className = 'payline-info-row';
            const dot = document.createElement('span');
            dot.className = 'payline-color';
            dot.style.background = line.color;
            const label = document.createTextNode(line.name);
            row.appendChild(dot);
            row.appendChild(label);
            frag.appendChild(row);
        }
        this.els.paylineInfo.appendChild(frag);
    }

    /* ---------- Messages ---------- */
    showMessage(title, text) {
        this.els.messageTitle.textContent = title;
        this.els.messageText.textContent = text;
        this.els.gameMessage.classList.add('visible');
    }

    hideMessage() {
        this.els.gameMessage.classList.remove('visible');
    }

    /* ---------- Persistence ---------- */
    saveState() {
        try {
            const data = {
                credits: this.credits,
                totalWon: this.totalWon,
                bet: this.bet,
            };
            localStorage.setItem(GAME_CONFIG.STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            console.warn('Failed to save state:', err);
        }
    }

    loadState() {
        try {
            const raw = localStorage.getItem(GAME_CONFIG.STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (typeof data.credits === 'number') this.credits = data.credits;
                if (typeof data.totalWon === 'number') this.totalWon = data.totalWon;
                if (GAME_CONFIG.BET_OPTIONS.includes(data.bet)) this.bet = data.bet;
            }
        } catch (err) {
            console.warn('Failed to load state:', err);
        }
    }

    /* ---------- Reset ---------- */
    resetGame() {
        if (!confirm(GAME_CONFIG.MESSAGES.RESET_CONFIRM)) return;
        this.credits = GAME_CONFIG.INITIAL_CREDITS;
        this.totalWon = 0;
        this.bet = GAME_CONFIG.DEFAULT_BET;
        this.stopAutoPlay();
        this.clearWinDisplay();
        this.clearHighlights();
        this.updateDisplay();
        this.saveState();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SlotMachine();
});
