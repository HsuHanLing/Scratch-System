# Scratch-System

- **Python reference:** `scratch_card_simulation(1).py` (repo root)
- **Scratch reward simulator (Next.js):** [`web/`](./web/) — all `next`, `react`, and app code is there

## Local dev

From repo root:

```bash
npm install --prefix web && npm run dev --prefix web
```

Or `cd web && npm install && npm run dev`.

## Deploy on Vercel

1. **Settings → Build & Deployment → Root Directory:** set to **`web`** (required).  
   The repo root `package.json` intentionally does **not** include `next`, so Vercel must use **`web/`** where `web/package.json` lives.
2. Framework: **Next.js** (auto-detected from `web/`).
3. Use default **Install** (`npm install` or `npm ci`) and **Build** (`npm run build`) — they run inside `web/`.
4. Redeploy.

If Root Directory is **`.`** (repo root), the build fails with *“No Next.js version detected”* — that is expected.
