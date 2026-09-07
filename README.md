# auth-mern

A simple Google OAuth 2.0 authentication backend built with Express, TypeScript, and MongoDB. Handles the full Google login flow, issues JWT access/refresh tokens as cookies, and exposes a `/me` endpoint to fetch the logged-in user.

> Note: this repo currently only contains the **backend** (`src/`). There's no frontend client in the repo — `CLIENT_URL` is where the backend redirects the browser after a successful login.

## Tech Stack

- **Runtime:** Node.js + TypeScript (`tsx` for dev, `tsc` for build)
- **Framework:** Express 5
- **Database:** MongoDB via Mongoose
- **Auth:** Google OAuth 2.0 (`googleapis`) + JWT (`jsonwebtoken`)
- **Sessions/Security:** `express-session`, `cookie-parser`, `helmet`, `cors`
- **Validation:** `zod` (used to validate env vars)
- **Logging:** `pino`
- **Package manager:** `pnpm`

## Project Structure

```
src/
├── index.ts              # App entry: middleware, DB connect, server start
├── config/
│   ├── index.ts          # Zod-validated environment variables
│   ├── db.ts             # Mongo connect/disconnect
│   └── logger.ts         # Pino logger setup
├── controllers/
│   ├── auth.controller.ts   # googleAuth + googleAuthCallback
│   └── user.controller.ts   # getMe
├── models/
│   └── user.ts            # Mongoose User schema
├── router/
│   ├── index.ts           # Mounts /auth routes under /api/v1
│   ├── auth.route.ts       # /auth/google, /auth/google/callback
│   └── me.ts               # /me
├── services/
│   ├── token.ts            # createTokens, verifyToken (JWT)
│   └── user.ts              # createUser, getUser (DB helpers)
├── types/
└── utils/
    └── oauth2Client.ts      # Google OAuth2 client instance
```

## How the Auth Flow Works

1. **`GET /api/v1/auth/google`** — generates a random `state` (CSRF protection), stores it in the session, and redirects the browser to Google's consent screen with the configured scopes (`userinfo.email`, `userinfo.profile`).
2. **`GET /api/v1/auth/google/callback`** — Google redirects back here with `code` and `state`.
   - Verifies `state` matches the session value (rejects if not — possible CSRF).
   - Exchanges `code` for Google tokens via `oauth2Client.getToken()`.
   - Fetches the user's profile (name, email, photo) from the Google People API.
   - If the user doesn't exist in Mongo (matched by email), creates one.
   - Issues an `access_token` and `refresh_token` (JWT, signed with separate secrets) and sets them as cookies.
   - Redirects to `${CLIENT_URL}/app`.
3. **`GET /api/v1/me`** *(not yet mounted under `/auth`, see note below)* — reads the `Authorization: Bearer <token>` header, verifies the JWT, and returns the matching user from the DB.

**Note / possible TODO:** `router/me.ts` defines the `/me` route but it isn't currently imported/mounted in `router/index.ts` (only `authRoutes` is mounted). Worth wiring that up if `/me` should be reachable.

## Environment Variables

Validated in `src/config/index.ts` via `zod` — the app exits on startup if any required var is missing. Create a `.env` file:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Google OAuth (from Google Cloud Console credentials)
CLIENT_ID=your-google-client-id
CLIENT_SECRET=your-google-client-secret
REDIRECT_URL=http://localhost:5000/api/v1/auth/google/callback

# Session
SESSION_SECRET=some-long-random-string

# JWT
ACCESS_TOKEN_SECRET=another-long-random-string
REFRESH_TOKEN_SECRET=yet-another-long-random-string
ACCESS_TOKEN_MAX_AGE=3600
REFRESH_TOKEN_MAX_AGE=604800

# Database
DATABASE_URL=mongodb://localhost:27017/auth-mern
```

To get `CLIENT_ID` / `CLIENT_SECRET` / `REDIRECT_URL`:
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** (type: Web application).
3. Add `REDIRECT_URL` (e.g. `http://localhost:5000/api/v1/auth/google/callback`) to **Authorized redirect URIs**.
4. Enable the **People API** for the project (used to fetch profile info in the callback).

## Setup & Run

```bash
# install dependencies
pnpm install

# create and fill in .env (see above)

# run in dev mode (auto-restart on change)
pnpm dev

# build for production
pnpm build

# run the built app
pnpm start
```

- Dev: `tsx --watch src/index.ts` → server runs on `PORT` (logs "Server started at 3000" — double check this log message matches your actual `PORT` value, seems hardcoded in the log string).
- Build: `tsc && tsc-alias` (resolves the `@/` path aliases used throughout, e.g. `@/config`, `@/controllers/...`).
- Start: runs `dist/server.js` — confirm this matches the actual build output path from `tsconfig.json`.

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/auth/google` | Redirects to Google's OAuth consent screen |
| GET | `/api/v1/auth/google/callback` | Google redirects here; creates/finds user, sets JWT cookies, redirects to client |
| GET | `/api/v1/me` | Returns current user (needs `Authorization: Bearer <access_token>`) — *route defined but not yet mounted* |

## Things to Double-Check / Improve Later

- Wire up `me.ts` router in `router/index.ts`.
- The `access_token` cookie isn't `httpOnly` (unlike `refresh_token`) — worth confirming that's intentional if the frontend reads it via JS vs. sending it as a header.
- No refresh-token endpoint yet to rotate an expired `access_token` using the `refresh_token`.
- `IS_PRODUCTION` env value affects cookie `secure` flag — make sure `NODE_ENV=production` is set correctly when deployed (needed for cookies to work over HTTPS).
