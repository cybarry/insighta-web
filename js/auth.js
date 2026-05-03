/**
 * auth.js — Web portal authentication module
 *
 * Tokens are stored ONLY in HTTP-only cookies set by the backend.
 * JavaScript has zero access to them. All requests use credentials:'include'
 * so the browser automatically attaches cookies on every fetch.
 */

const API = 'https://insighta-backend-production-b142.up.railway.app';

/**
 * Silently refresh the session by calling POST /auth/refresh with cookies.
 * Returns true if successful, false if the session is fully expired.
 */
async function silentRefresh() {
    try {
        const res = await fetch(`${API}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Call this at the top of every protected page.
 * Verifies the session is alive; if not, attempts a silent refresh.
 * Redirects to login if both fail.
 */
export async function requireAuth() {
    // Try to reach the /auth/me endpoint — if cookies are valid, this works
    try {
        const res = await fetch(`${API}/auth/me`, {
            credentials: 'include',
        });

        if (res.ok) return; // Session is alive ✅

        // Access token expired — try silent refresh
        if (res.status === 401) {
            const refreshed = await silentRefresh();
            if (refreshed) return; // Refreshed ✅
        }
    } catch {
        // Network error — try refresh anyway
        const refreshed = await silentRefresh();
        if (refreshed) return;
    }

    // Both failed — send to login
    window.location.href = '/index.html';
}

/**
 * Log the user out: invalidate server-side token + clear cookies.
 */
export async function logout() {
    try {
        await fetch(`${API}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
    } catch { /* best-effort */ }
    window.location.href = '/index.html';
}