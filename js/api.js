import { getTokens, saveTokens, clearTokens } from './auth.js';

const API = 'https://insighta-backend-production-b142.up.railway.app';

async function refreshTokens() {
    const { refresh_token } = getTokens();
    if (!refresh_token) return false;

    const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    saveTokens(data.access_token, data.refresh_token);
    return true;
}

export async function request(method, endpoint, options = {}) {
    const { access_token } = getTokens();

    if (!access_token) {
        window.location.href = '/index.html';
        return;
    }

    const res = await fetch(`${API}${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Version': '1',
            'Authorization': `Bearer ${access_token}`,
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Try silent refresh on 401
    if (res.status === 401) {
        const refreshed = await refreshTokens();
        if (!refreshed) {
            clearTokens();
            window.location.href = '/index.html';
            return;
        }

        // Retry with new token
        const { access_token: newToken } = getTokens();
        const retry = await fetch(`${API}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Version': '1',
                'Authorization': `Bearer ${newToken}`,
                ...options.headers,
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (res.status === 204) return null;
        return retry.json();
    }

    if (res.status === 204) return null;
    return res.json();
}

export async function get(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request('GET', qs ? `${endpoint}?${qs}` : endpoint);
}

export async function post(endpoint, body) {
    return request('POST', endpoint, { body });
}

export async function del(endpoint) {
    return request('DELETE', endpoint);
}