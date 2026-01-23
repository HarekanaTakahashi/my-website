import { getGames } from '../store.js';

// Render the home view with game cards
export function renderHome() {
    const games = getGames();
    
    if (games.length === 0) {
        return `
            <div class="home-view">
                <h2>ゲーム一覧</h2>
                <p class="loading">ゲームが見つかりません。</p>
            </div>
        `;
    }
    
    const gameCards = games.map(game => `
        <div class="game-card">
            <h3>${escapeHtml(game.title)}</h3>
            <p>${escapeHtml(game.description || '')}</p>
            ${game.tags && game.tags.length > 0 ? `
                <div class="game-tags">
                    ${game.tags.map(tag => `<span class="game-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <button class="play-btn" data-game="${escapeHtml(game.slug)}">プレイ</button>
        </div>
    `).join('');
    
    return `
        <div class="home-view">
            <h2>ゲーム一覧</h2>
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
        btn.addEventListener('click', (e) => {
            const slug = e.target.dataset.game;
            if (slug) {
                window.location.hash = `#/game/${slug}`;
            }
        });
    });
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
