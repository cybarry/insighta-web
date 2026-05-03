const API = 'https://insighta-backend-production-b142.up.railway.app';

export function getTokens() {
    return {
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
    };
}

export function saveTokens(access, refresh) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

export async function requireAuth() {
    // Grab tokens from URL if just redirected from OAuth
    const params = new URLSearchParams(window.location.search);
    const urlAccess = params.get('access_token');
    const urlRefresh = params.get('refresh_token');

    if (urlAccess && urlRefresh) {
        saveTokens(urlAccess, urlRefresh);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
    }

    const { access_token, refresh_token } = getTokens();

    if (!access_token) {
        window.location.href = '/index.html';
        return;
    }

    // Try refresh to verify session is alive
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
                return;
            }
        } catch { }
    }

    // If refresh failed, clear and redirect
    clearTokens();
    window.location.href = '/index.html';
}

export async function logout() {
    const { refresh_token } = getTokens();
    await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
    }).catch(() => { });
    clearTokens();
    window.location.href = '/index.html';
}