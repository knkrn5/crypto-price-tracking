# Crypto Price Tracking

A full-stack application that monitors live cryptocurrency prices, lets users configure price-based alerts, and delivers push-style notifications via WebSockets. The project is organised as two workspaces:

- `api/`: Node.js + TypeScript backend serving REST endpoints, background jobs, and Socket.IO events
- `crypto/`: React + Vite frontend that visualises market data and manages user alerts

---

## Features

- **Realtime price snapshots** sourced from the CoinGecko API, cached in Redis, and pushed to clients over WebSockets.
- **Price alert automation** evaluated against MongoDB-stored alerts whenever new price data arrives.
- **Client notifications** using Socket.IO to surface triggered alerts instantly in the UI.
- **Configurable cron refresh** so administrators can tune polling frequency without code changes.
- **Environment-based routing** that supports local proxying during development and cross-origin deployments in production.

---

## Architecture Overview

| Layer         | Technology                         | Responsibilities                                   |
| ------------- | ---------------------------------- | -------------------------------------------------- |
| Backend       | Node.js, Express, Socket.IO        | Fetch prices, evaluate alerts, expose REST/WS APIs |
| Persistence   | MongoDB                            | Persist user alerts                                |
| Caching       | Redis                              | Store the latest price snapshot for quick access   |
| Scheduling    | node-cron                          | Periodically refresh market data                   |
| Frontend      | React, Redux Toolkit, Tailwind CSS | Render price tables, manage alerts & notifications |
| Build tooling | TypeScript, Vite, SWC              | Typed development experience and fast builds       |

---

## Backend (`api/`)

### Key Modules

- `src/server.ts`: Application bootstrap, HTTP + Socket.IO server, cron job registration.
- `src/services/priceService.ts`: Fetches CoinGecko data, handles caching, and falls back between public/pro endpoints based on API key validity.
- `src/services/alertService.ts`: Evaluates stored alerts against the latest price snapshot and emits notifications.
- `src/routes/priceRoutes.ts` & `src/routes/alertRoutes.ts`: REST surface for price snapshots and alert management.
- `src/socket/manager.ts`: Manages Socket.IO connections and targeted user notifications.
- `src/db/mongo.ts` & `src/db/redis.ts`: Database connection helpers.

### Environment Variables

Copy `.env.example` to `.env` (both local and deployment environments) and set:

- `NODE_ENV`: `development`, `test`, or `production`
- `PORT`: API port (default `3000`)
- `MONGO_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `COINGECKO_API_KEY` _(optional)_: Enables the pro API endpoint with enhanced rate limits
- `COIN_IDS`: Comma-delimited list of coin IDs to track (default `bitcoin,ethereum,solana`)
- `PRICE_REFRESH_CRON`: Cron expression controlling the polling cadence (default `*/1 * * * *`)

### Development Scripts

```bash
cd api
npm install
npm run dev       # Start API with hot reload
npm run lint      # Run ESLint checks
npm run build     # Type-check and compile to dist/
```

> **Note:** The service connects to MongoDB and Redis on startup; ensure both services are running locally or accessible via the configured URLs.

---

## Frontend (`crypto/`)

### Application Flow

1. On load, the app fetches the latest price snapshot and user alerts with Axios.
2. A Socket.IO client registers a user ID (stored in LocalStorage) and listens for `price:update` and `alert:trigger` events.
3. Redux Toolkit slices (`pricesSlice` and `alertsSlice`) manage API requests, state transitions, and notifications presented in the UI.
4. Tailwind CSS styles the dashboard components (`PriceTable`, `AlertForm`, `AlertsTable`, `NotificationPanel`).

### Environment Variables

Create `crypto/.env` and configure:

- `VITE_API_URL`: Base HTTP URL of the backend (omit the `/api` suffix; the client appends it automatically). Set to `http://localhost:3000` for local development.
- `VITE_SOCKET_URL` _(optional)_: Overrides the Socket.IO connection origin. If unset, the app derives it from `VITE_API_URL` or falls back to the current origin.

### Development Scripts

```bash
cd crypto
npm install
npm run dev       # Start Vite dev server (default http://localhost:5173)
npm run build     # Produce production artefacts in dist/
npm run lint      # Run linting (if configured)
```

When using the Vite dev server, API requests and Socket.IO traffic are proxied to the backend according to `vite.config.ts`.

---

## Running Locally

1. **Install dependencies** in both workspaces (`api/` and `crypto/`).
2. **Provide infrastructure**: launch MongoDB and Redis locally (e.g., via Docker) or point the environment variables to hosted services.
3. **Start the backend**: `npm run dev` inside `api/`.
4. **Start the frontend**: `npm run dev` inside `crypto/`. The UI will proxy requests to `http://localhost:3000`.
5. Visit `http://localhost:5173` and confirm live prices appear and alerts can be created.

---

## Deployment Notes

- Ensure the backend is reachable over HTTPS and exposes both REST endpoints under `/api` and the Socket.IO namespace under `/socket.io`.
- Provision MongoDB and Redis services (e.g., Atlas and Upstash/Redis Cloud) and supply their connection strings via environment variables.
- Configure frontend environment variables (e.g., Render/Netlify) so `VITE_API_URL` points to the backend origin and `VITE_SOCKET_URL` targets the same host if needed.
- Backend relies on cron scheduling to fetch prices; confirm the hosting platform permits background jobs (Render web service supports this by default).

---

## Testing

Formal test suites are not yet implemented. Recommended next steps:

- Add integration tests for price fetching and alert evaluation services.
- Include UI testing (React Testing Library/Cypress) to validate dashboard flows.

---

## Troubleshooting

- **CoinGecko 400 errors:** The backend automatically falls back to the public endpoint if the pro key fails. Verify `COINGECKO_API_KEY` and API plan limits.
- **Socket connection issues:** Confirm `/socket.io` is accessible through reverse proxies/CDNs and that CORS origins are authorised.
- **404s from the frontend:** Ensure `VITE_API_URL` is set to the backend origin (without `/api`) so the Axios client resolves to `https://backend.example.com/api`.

---

## License

This project has no explicit license.
