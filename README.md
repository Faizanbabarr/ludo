# Roll Home

Cross-platform Ludo game: **Web** (Netlify) · **Android** (Google Play / APK) · **iOS** (App Store later).

- **Backend:** Supabase (real-time multiplayer, auth).
- **Web hosting:** Netlify.
- **Local & online** multiplayer.

## Quick start

```bash
npm install
npm run dev
```

Open the URL in the browser (and on your phone if on same Wi‑Fi).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run dev server (web) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npx cap sync android` | Copy web build to Android (after `npm run build`) |
| `npx cap sync ios` | Copy web build to iOS (after `npm run build`) |

## Android APK (no Android Studio)

1. Push code to GitHub.
2. Open the repo → **Actions** → run **Build Android APK**.
3. When finished, download the **roll-home-debug-apk** artifact and install on device or Game Loop emulator.

## Netlify

Connect this repo to Netlify; build command: `npm run build`, publish directory: `dist`.

## Online multiplayer (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase-setup.sql` in the SQL Editor (creates `rooms` table).
3. In Dashboard → Database → Replication, enable Realtime for table `rooms`.
4. Add env vars (Netlify: Site settings → Environment variables; local: `.env`):
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Redeploy. "Play online" → Create game → share the 6-letter code → friends Join with that code.

## Project layout

- `src/` — React app (game UI and logic).
- `android/` — Capacitor Android project (do not edit manually; use `cap sync`).
- `ios/` — Capacitor iOS project (build on Mac or cloud later).
