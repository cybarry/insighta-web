import { get } from './api.js';

export async function requireAuth() {
    const res = await fetch('https://your-backend.railway.app/auth/refresh', {
        method: 'POST',
        credentials: 'include',
    });

    if (!res.ok) {
        window.location.href = '/index.html';
    }
}