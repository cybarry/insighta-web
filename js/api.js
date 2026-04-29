const API = 'https://your-backend.railway.app';

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

    if (res.status === 401) {
        window.location.href = '/index.html';
        return;
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