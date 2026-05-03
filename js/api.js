/**
 * api.js — Web portal API client
 * Sends Authorization: Bearer <token> from localStorage on every request.
 * On 401, silently refreshes and retries once.
 */

import { getTokens, saveTokens, clearTokens } from './auth.js';

const API = 'https://insighta-backend-production-b142.up.railway.app';

async function silentRefresh() {
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
}

export async function request(method, endpoint, options = {}) {
    const { access_token } = getTokens();

    if (!access_token) {
        window.location.href = '/index.html';
        return null;
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

    // Silent refresh on 401
    if (res.status === 401) {
        const refreshed = await silentRefresh();
        if (!refreshed) {
            clearTokens();
            window.location.href = '/index.html';
            return null;
        }

        // Retry with fresh token
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

        if (retry.status === 204) return null;
        return retry.json();
    }

    if (res.status === 204) return null;
    return res.json();
}

export async function get(endpoint, params = {}) {
    // Filter out empty/undefined values to keep URLs clean
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v != null)
    );
    const qs = new URLSearchParams(cleanParams).toString();
    return request('GET', qs ? `${endpoint}?${qs}` : endpoint);
}

export async function post(endpoint, body) {
    return request('POST', endpoint, { body });
}

export async function del(endpoint) {
    return request('DELETE', endpoint);
}