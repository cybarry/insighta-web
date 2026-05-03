# Insighta Labs+ Web Portal

> Frontend for the Insighta Labs+ Demographic Intelligence Platform

**Live Site:** `https://insighta-web-production-418d.up.railway.app`
**Backend API:** `https://insighta-backend-production-b142.up.railway.app`

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Login | `/index.html` | GitHub OAuth login |
| Dashboard | `/dashboard.html` | Platform stats overview |
| Profiles | `/profiles.html` | Browse + filter profiles |
| Profile Detail | `/profile.html?id=<uuid>` | Single profile view |
| Search | `/search.html` | Natural language search |
| Account | `/account.html` | User profile + logout |

---

## Authentication

The web portal uses **HTTP-only cookies** exclusively:

- Tokens are **never** stored in `localStorage` or accessible via JavaScript
- Login redirects to the backend `/auth/github` which sets cookies server-side
- Every API request uses `credentials: 'include'` — browser sends cookies automatically
- On `401`, a silent token refresh is attempted before redirecting to login

### Login flow
```
User clicks "Continue with GitHub"
  → Redirected to backend /auth/github
  → Backend → GitHub OAuth
  → Backend sets httpOnly cookies (access_token, refresh_token)
  → Redirect to /dashboard.html
```

---

## Role-Based UI

- **Admin**: Can see admin-specific features
- **Analyst** (default): Read-only access — browse, search, export

Role is displayed as a badge on the Account page.

---

## Local Development

```bash
git clone https://github.com/cybarry/insighta-web.git
cd insighta-web
npm install
npx serve . -p 5500
```

Visit: `http://localhost:5500`

> **Note:** For cookies to work locally, the backend must also be running locally and configured with `FRONTEND_URL=http://localhost:5500`.

---

## CI/CD

GitHub Actions runs on every PR to `main`:
- JS syntax check
- Verifies all HTML pages exist
- Smoke test that the site serves