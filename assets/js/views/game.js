import { getGame } from '../store.js';

// Render the game view with iframe
export function renderGame(slug) {
    const game = getGame(slug);
    
    if (!game) {
        return renderGameError('ゲームが見つかりません', `"${slug}" というゲームは存在しません。`);
    }
    
    const gamePath = `games/${slug}/index.html`;
    
    return `
        <div class="game-view">
            <iframe 
                id="game-frame" 
                class="game-frame" 
                src="${gamePath}"
                title="${escapeHtml(game.title)}"
                sandbox="allow-scripts allow-same-origin"
            ></iframe>
        </div>
    `;
}

// Setup event listeners for game iframe
export function setupGameListeners(container) {
    const iframe = container.querySelector('#game-frame');
    if (iframe) {
        // Handle iframe load errors
        iframe.addEventListener('error', () => {
            console.error('Failed to load game iframe');
            container.innerHTML = renderGameError(
                'ゲームの読み込みに失敗しました',
                'ゲームファイルが見つからないか、読み込みエラーが発生しました。'
            );
        });
    }
}

// Render error view for game
function renderGameError(title, message) {
    return `
        <div class="error-view">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(message)}</p>
            <a href="#/" class="home-link">ホームに戻る</a>
        </div>
    `;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
