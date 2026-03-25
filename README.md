# JotiGames Super Admin Frontend

Standalone React app for Super Admin management.

## Features

- Super Admin-only login (`/api/auth/user` + role check)
- Protected dashboard routes
- Sidebar layout with categories
- Game mode availability management (`/api/game/game-types/availability`)
- User overview (`/api/super-admin/users`)

## Product Documentation

- Canonical Super Admin panel docs: `docs/admin/super-admin-panel.md`
- Central documentation index: `docs/README.md`

## Run

```bash
cd admin
npm install
npm run dev
```

Default dev URL: `http://localhost:5174`

## Backend requirements

- Backend must be running with `/api` available.
- A user with `ROLE_SUPER_ADMIN` is required to sign in.

## Optional env

- `VITE_BACKEND_TARGET` for Vite proxy target (default `http://localhost:8000`)
- `VITE_API_BASE_URL` for direct API base URL (when not using proxy)
