/**
 * auth.js — Web portal authentication module
 * Tokens stored in localStorage, sent via Authorization: Bearer header.
 */

const API = 'https://insighta-backend-production-b142.up.railway.app';

export function getTokens() {
    return {
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
    };
}

export function saveTokens(access, refresh) {
    localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
}

/**
 * Call at the top of every protected page.
 * - If coming from OAuth redirect: saves tokens from URL, cleans the URL.
 * - If returning user: checks localStorage for existing token.
 * - Redirects to login if no token found.
 * NOTE: Token refresh on expiry is handled automatically by api.js on 401.
 */
export async function requireAuth() {
    // 1. Capture tokens from URL after OAuth redirect (access_token=...&refresh_token=...)
    const params = new URLSearchParams(window.location.search);
    const urlAccess = params.get('access_token');
    const urlRefresh = params.get('refresh_token');

    if (urlAccess) {
        saveTokens(urlAccess, urlRefresh);
        // Remove tokens from URL — don't leave them in browser history
        window.history.replaceState({}, '', window.location.pathname);
        return; // Tokens are brand new from OAuth, no need to validate
    }

    // 2. Returning user — check localStorage
    if (!localStorage.getItem('access_token')) {
        window.location.href = '/index.html';
    }
    // Has a stored token — proceed. api.js will auto-refresh on 401 silently.
}

/**
 * Logout: invalidate server-side token + clear localStorage.
 */
export async function logout() {
    const { refresh_token } = getTokens();
    try {
        await fetch(`${API}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token }),
        });
    } catch { /* best-effort */ }
    clearTokens();
    window.location.href = '/index.html';
}