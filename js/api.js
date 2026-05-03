/**
 * api.js — Web portal API client
 *
 * Key behaviors:
 * - Sends Authorization: Bearer <token> on every request
 * - On 401: attempts a silent refresh (deduped — only ONE refresh runs at a time)
 * - Does NOT redirect to login — requireAuth() handles all session redirects
 */

import { getTokens, saveTokens, clearTokens } from './auth.js';

const API = 'https://insighta-backend-production-b142.up.railway.app';

// Shared promise so parallel 401s only trigger ONE refresh, not multiple
let _refreshPromise = null;

async function silentRefresh() {
    // If a refresh is already in progress, wait for that one to finish
    if (_refreshPromise) return _refreshPromise;

    _refreshPromise = (async () => {
        const { refresh_token } = getTokens();
        if (!refresh_token) return false;

        try {
            const res = await fetch(`${API}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            saveTokens(data.access_token, data.refresh_token);
            return true;
        } catch {
            return false;
        }
    })();

    try {
        return await _refreshPromise;
    } finally {
        _refreshPromise = null;
    }
}

export async function request(method, endpoint, options = {}) {
    const { access_token } = getTokens();

    if (!access_token) {
        // No token at all — redirect to login
        clearTokens();
        window.location.href = '/index.html';
        return null;
    }

    const fetchOpts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Version': '1',
            'Authorization': `Bearer ${access_token}`,
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    };

    let res = await fetch(`${API}${endpoint}`, fetchOpts);

    // On 401 — try one silent refresh then retry
    if (res.status === 401) {
        const refreshed = await silentRefresh();
        if (!refreshed) {
            // Refresh failed — session is truly dead
            clearTokens();
            window.location.href = '/index.html';
            return null;
        }

        // Retry with the new token
        const { access_token: newToken } = getTokens();
        fetchOpts.headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${API}${endpoint}`, fetchOpts);
    }

    if (res.status === 204) return null;

    try {
        return await res.json();
    } catch {
        return null;
    }
}

export async function get(endpoint, params = {}) {
    const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v != null)
    );
    const qs = new URLSearchParams(clean).toString();
    return request('GET', qs ? `${endpoint}?${qs}` : endpoint);
}

export async function post(endpoint, body) {
    return request('POST', endpoint, { body });
}

export async function del(endpoint) {
    return request('DELETE', endpoint);
}