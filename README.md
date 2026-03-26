# Scratch-System

Reference Python simulation (`scratch_card_simulation(1).py`) and the **Next.js scratch reward simulator** in [`web/`](./web/).

## Deploy on Vercel

The production app is **`web/`**, not the repository root.

**Option A (recommended):** In Vercel → Project → **Settings → Build & Deployment → Root Directory**, set **`web`**, then redeploy. See [Vercel: Root Directory](https://vercel.com/docs/deployments/configure-a-build#root-directory).

**Option B:** Leave Root Directory as **`.`** and rely on the repo-root [`vercel.json`](./vercel.json), which runs `npm ci` and `npm run build` with `--prefix web`.

After a successful deploy, opening your `.vercel.app` URL should load the simulator (not `404 NOT_FOUND`).
