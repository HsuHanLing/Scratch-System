# Scratch-System

- **Python reference:** `scratch_card_simulation(1).py`
- **Next.js scratch simulator:** `app/`, `components/`, `lib/` at the **repository root** (same level as `package.json`)

## Local dev

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. **Root Directory:** **`.`** (empty / repository root). Do **not** use `web` — that folder is not part of this layout.
2. **Framework:** **Next.js** (auto-detected).
3. **Output Directory:** leave **empty** / default (do not set `public` or `.next` manually).
4. **Install / Build:** defaults (`npm install`, `npm run build`).

The production build writes **`.next`** next to `package.json`, which matches what Vercel expects.
