import { getGames, getError } from '../store.js';
import { escapeHtml } from '../utils.js';

const DEFAULT_ICON = '🎲';

// Render the home view with game cards
export function renderHome() {
    const games = getGames();

    if (games.length === 0) {
        const error = getError();
        const message = error
            ? 'ゲーム一覧の読み込みに失敗しました。ページを再読み込みしてください。'
            : 'ゲームが見つかりません。';
        return `
            <div class="home-view">
                <h2>ゲーム一覧</h2>
                <p class="loading">${escapeHtml(message)}</p>
            </div>
        `;
    }

    const gameCards = games.map(game => `
        <div class="game-card">
            <div class="game-card-icon" aria-hidden="true">${escapeHtml(game.icon || DEFAULT_ICON)}</div>
            <h3>${escapeHtml(game.title)}</h3>
            <p>${escapeHtml(game.description || '')}</p>
            ${game.tags && game.tags.length > 0 ? `
                <div class="game-tags">
                    ${game.tags.map(tag => `<span class="game-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <button class="play-btn" data-game="${escapeHtml(game.slug)}" aria-label="${escapeHtml(game.title)}をプレイ">プレイ</button>
        </div>
    `).join('');

    return `
        <div class="home-view">
            <h2>ゲーム一覧</h2>
            <p class="home-lead">おもちゃ箱から好きなゲームを取り出して遊ぼう！</p>
            <div class="game-grid">
                ${gameCards}
            </div>
        </div>
    `;
}

// Setup event listeners for play buttons
export function setupHomeListeners(container) {
    const playButtons = container.querySelectorAll('.play-btn');
    playButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const slug = btn.dataset.game;
            if (slug) {
                window.location.hash = `#/game/${slug}`;
            }
        });
    });
}
