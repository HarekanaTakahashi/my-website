// Utility functions

const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

// Escape HTML to prevent XSS
// 引用符もエスケープするため、属性値の中でも安全に使用できる
export function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}
