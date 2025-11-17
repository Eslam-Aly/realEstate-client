# AqarDot Client

React/Vite single-page application for the AqarDot real-estate marketplace. The app consumes the standalone REST API, handles authentication, listing management UI, saved favorites, and marketing pages. This repository is deployed separately from the backend (e.g., on **Vercel**).

---

## Highlights

- ⚛️ **Modern stack** – React 19 + Vite 7, React Router, Redux Toolkit with persistence, Tailwind CSS, and Swiper sliders.
- 🔐 **Auth-aware UX** – Reads the `access_token` httpOnly cookie via API requests, bootstraps the user session on load, and supports Google OAuth hand-off.
- 🏠 **Listing workflows** – Guided forms for creating/updating listings, upload helpers for Firebase Storage, and responsive cards/grids.
- 🌍 **Localization-ready** – i18next + react-i18next scaffolding (English/Arabic).
- 📱 **Responsive design** – Tailwind utility classes tuned for desktop/mobile parity.

---

## Project Structure

```
realEstate-client/
├── public/                 # Static assets served as-is
├── src/
│   ├── components/         # Shared UI widgets
│   ├── pages/              # Route-level screens (Home, Listing, Profile, etc.)
│   ├── redux/              # store, slices (user, favorites)
│   ├── lib/                # bootstrap helpers (auth, i18n)
│   ├── config/             # API base URL, constants
│   └── firebase.js         # Client-side Firebase SDK init
├── vite.config.js
├── vercel.json             # SPA rewrites + headers
└── README.md
```

---

## Requirements

- Node.js **18+** and npm
- Matching AqarDot API deployed somewhere reachable (Render, local, etc.)
- Firebase project credentials (client-side SDK)

---

## Environment Variables (`.env`)

Create `realEstate-client/.env` with the following entries:

```
VITE_API_BASE=https://api.aqardot.com/api   # Base URL for the backend (must include /api)
VITE_FIREBASE_API_KEY=<firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<firebase-auth-domain>
VITE_FIREBASE_PROJECT_ID=<firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<firebase-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<firebase-sender-id>
VITE_FIREBASE_APP_ID=<firebase-app-id>
VITE_FIREBASE_MEASUREMENT_ID=<optional-measurement-id>
VITE_DEFAULT_LISTING_IMAGE=<optional-placeholder-url>
```

> In Vercel, add these under **Project Settings → Environment Variables** and redeploy to propagate them.

---

## Development

```bash
# Install deps
npm install

# Start Vite dev server (http://localhost:5173 by default)
npm run dev
```

The dev server proxies API calls directly to the `VITE_API_BASE` you provide. Ensure the backend has CORS enabled for `http://localhost:5173`.

---

## npm Scripts

| Command         | Description                                        |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Start Vite in development mode                     |
| `npm run build` | Produce an optimized production bundle             |
| `npm run preview` | Serve the built bundle locally for smoke testing |
| `npm run lint`  | Run ESLint using the flat config (`eslint.config.js`) |
| `npm test`      | Run Vitest + Testing Library unit/component suites |

---

## Automated Testing

- **Unit/component tests (Vitest)**  
  Specs now live under `tests/unit/**` (mirroring `pages/`, `components/`, `redux/`, etc.). Run the full suite with:

  ```bash
  npm test
  ```

  Vitest is already configured with jsdom globals and the shared `src/setupTests.js`.

- **Smoke/E2E tests (Playwright)**  
  Playwright specs reside in `tests/smoke/**` and reuse `.env.e2e` for credentials/URLs. To execute them locally:

  ```bash
  # install browsers once
  npx playwright install

  # run headless smoke tests
  npx playwright test

  # or explicitly point to this repo's config
  npx playwright test --config=playwright.config.ts
  ```

  Ensure `.env.e2e` contains the variables referenced by the smoke tests (e.g., `BASE_URL`, seeded user credentials).

---

## Deployment (Vercel)

1. **Import Repo** into Vercel (GitHub/GitLab/Bitbucket).  
2. **Framework Preset**: Vite (auto-detected).  
3. **Build Command**: `npm run build` & Output Directory: `dist`.  
4. **Environment Variables**: configure all entries from `.env` (production, preview, development environments as needed).  
5. **Rewrites/Headers**: `vercel.json` already rewrites every path to `index.html` and applies `Cross-Origin-Opener-Policy`. Adjust or extend headers (CSP, cache) if required.  
6. **API URL**: set `VITE_API_BASE` to your Render API deployment (e.g., `https://aqardot-api.onrender.com/api`). Update CORS allowlist on the backend to include the Vercel domain(s).

After deploy, verify:

- `/` loads without console errors.
- Auth flows reach the API (cookies must be `SameSite=None; Secure` in production).
- Contact form and listing interactions succeed against the Render API.

---

## Tips & Next Steps

- Enable analytics/error tracking (e.g., Vercel Web Analytics, Sentry) before launch.
- Add automated UI tests (Playwright/Cypress) for listing CRUD and auth journeys.
- Keep Tailwind & Swiper versions in sync with any design-system updates.

---

## License

Add your organisation’s license information here if required.
