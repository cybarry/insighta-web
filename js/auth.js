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
 * Grabs tokens from URL if just redirected from OAuth, then validates session.
 */
export async function requireAuth() {
    // 1. Capture tokens from URL after OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const urlAccess = params.get('access_token');
    const urlRefresh = params.get('refresh_token');

    if (urlAccess) {
        saveTokens(urlAccess, urlRefresh);
        window.history.replaceState({}, '', window.location.pathname);
    }

    const { access_token, refresh_token } = getTokens();

    if (!access_token) {
        window.location.href = '/index.html';
        return;
    }

    // 2. Try to refresh to get a fresh token (validates session)
    if (refresh_token) {
        try {
            const res = await fetch(`${API}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token }),
            });
            if (res.ok) {
                const data = await res.json();
                saveTokens(data.access_token, data.refresh_token);
                return; // ✅ Session alive
            }
        } catch { /* network error — fall through */ }
    }

    // 3. Both failed — redirect to login
    clearTokens();
    window.location.href = '/index.html';
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