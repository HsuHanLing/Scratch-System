# Scratch-System

- **Python reference:** `scratch_card_simulation(1).py`
- **Scratch reward simulator (Next.js):** `app/`, `components/`, `lib/` at this repo root

## Deploy on Vercel

The Next.js app is at the **repository root** (same folder as `package.json`).

1. Vercel → **Settings** → **Build & Deployment** → **Root Directory** must be **empty** or **`.`** (not `web`). If you previously set `web`, **clear it** and save.
2. **Framework Preset:** Next.js (auto-detected).
3. Use default **Install** / **Build** commands (`npm install`, `npm run build`).
4. Redeploy.

If Root Directory is still `web`, the deployment will be wrong (empty or 404), because that folder no longer exists in this repo.

### Local reference

If you keep a copy of another project under `team_dashboard_v2/` for comparison, it is **gitignored** and excluded from TypeScript/ESLint so it does not break this app’s build.
