# PnL Mobile

React Native (Expo Router) mobile client for the PnL platform. Talks
directly to the existing Saas Back REST API (`Saas Back/`) — no backend
changes needed, same JWT bearer auth as Saas Front and Pnl App.

## Run it on your phone (no Xcode/Android Studio needed)

1. `npm install`
2. `npm start`
3. Install **Expo Go** on your phone (App Store / Play Store)
4. Scan the QR code shown in the terminal with Expo Go (Android: in-app scanner; iOS: Camera app)

Your phone and computer must be on the same Wi-Fi network.

## What's built so far

- `app/login.tsx` — email/password login against `POST /auth/login`
- `app/dashboard.tsx` — company summary stats + PnL report list (`GET /summary`, `GET /pnl`)
- `src/hooks/useAuth.tsx` — session state, validated against `GET /auth/me` on launch
- `src/lib/api.ts` — fetch wrapper with bearer-token auth; token stored in `expo-secure-store` (Keychain/Keystore) on iOS/Android, `localStorage` on web

## Environment

`EXPO_PUBLIC_API_URL` (see `.env.example`) — points at the Saas Back deployment. Already set in `.env.local` to the production backend.

## Notes

- `npm run web` also works for a quick browser preview, but the real backend's CORS allowlist doesn't include `localhost` origins (browsers enforce CORS, native apps don't) — login will fail with a CORS error in the browser preview even though it works fine in the actual mobile app. Use Expo Go for real testing.
- Not yet built: Employees/Assets/Expenses/Receivables/Transactions screens, the AI assistant. This is a first pass covering Login + Dashboard as agreed.
