/**
 * api.js — Web portal API client
 *
 * All requests use credentials:'include' so HTTP-only cookies are sent
 * automatically. No Authorization header, no localStorage.
 * On 401, performs a silent refresh and retries once.
 */

import { logout } from './auth.js';

const API = 'https://insighta-backend-production-b142.up.railway.app';

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

export async function request(method, endpoint, options = {}) {
    const res = await fetch(`${API}${endpoint}`, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Version': '1',
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Silent refresh on 401
    if (res.status === 401) {
        const refreshed = await silentRefresh();
        if (!refreshed) {
            logout();
            return null;
        }

        // Retry original request with refreshed cookie
        const retry = await fetch(`${API}${endpoint}`, {
            method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Version': '1',
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
    const qs = new URLSearchParams(
        // Filter out empty/undefined values
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return request('GET', qs ? `${endpoint}?${qs}` : endpoint);
}

export async function post(endpoint, body) {
    return request('POST', endpoint, { body });
}

export async function del(endpoint) {
    return request('DELETE', endpoint);
}