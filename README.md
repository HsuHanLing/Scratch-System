# Scratch-System

Reference Python simulation (`scratch_card_simulation(1).py`) and the **Next.js scratch reward simulator** in [`web/`](./web/).

## Deploy on Vercel (required setup)

The Next.js app lives in **`web/`**. Vercel’s Next.js builder only reads **`package.json` in the project Root Directory**, so it must see the folder that contains `next` in `dependencies`.

1. Open your project on Vercel → **Settings** → **Build & Deployment**.
2. Under **Root Directory**, click **Edit**, set it to **`web`**, then **Save**.
3. Clear any old overrides from the failed setup: under **Build & Development Settings**, turn **off** overrides for **Install Command** and **Build Command** (use defaults), unless you know you need them.
4. **Redeploy** the latest `main` commit.

Without Root Directory = **`web`**, the build uses the repo root `package.json` (no `next`), and you get: *“No Next.js version detected”*.

After a successful deploy, your `.vercel.app` URL should load the simulator.
