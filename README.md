# Scratch-System

- **Python reference:** `scratch_card_simulation(1).py` (repo root)
- **Next.js app:** [`web/`](./web/) (npm workspace `web`)

## Local dev

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. **Root Directory:** **`.`** (repository root) — do **not** set `web` when using the root `vercel.json` + workspaces.
2. **Framework Preset:** should pick up **Next.js** from `vercel.json`. If it shows **Other**, switch it to **Next.js** manually.
3. **Output Directory:** must be **empty** / default (not `public`). If you see *“No Output Directory named public”*, open **Settings → Build & Deployment → Build & Development Settings**, find **Output Directory**, clear the override, save, redeploy.
4. Install and build use the root `package.json` (`npm ci`, `npm run build`), which builds the `web` workspace.
