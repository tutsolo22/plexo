Title: Fix AI Agent conversation persistence & Dashboard sidebar render

Summary

This PR includes two small, focused functional fixes:

1. AI Agent: persist conversation and prevent reset
   - File: src/components/ai-agent.tsx
   - Problem: the AI assistant conversation reset after 1-2 interactions due to React StrictMode remounts and lack of persistence.
   - Fix: persist messages to localStorage, avoid re-initializing greeting on remounts (initializedRef), switch to onKeyDown and refocus input after sending.
   - Effect: continuous interactions are possible; conversation is kept across reloads in dev.

2. Dashboard layout: ensure sidebar is rendered and redirects to correct signin
   - File: src/app/dashboard/layout.tsx
   - Problem: layout returned children directly and redirected to `/auth/login` (non-existent), causing 404 and sidebar not visible.
   - Fix: wrap dashboard children with the client `DashboardLayout` (src/components/dashboard/dashboard-layout.tsx) and redirect to `/auth/signin` when unauthenticated.
   - Effect: sidebar (desktop & mobile) is rendered for authenticated users and the redirect targets the correct page.

Also small cleanup in `next.config.js` to remove invalid top-level keys and fix syntax issues to avoid startup warnings.

Files changed

- src/components/ai-agent.tsx  (functional fix)
- src/app/dashboard/layout.tsx  (functional fix)
- next.config.js  (cleanup/syntax fixes)

Testing / QA notes (short)

1. Run dev server:
   npm run dev
   (server should compile without the previous next.config.js warning)

2. Verify AI agent:
   - Open Dashboard in browser and expand the IA assistant.
   - Send > 3 messages sequentially; ensure the input remains enabled and you can continue typing.
   - Refresh page: the conversation should persist (localStorage key: `plexo_ai_messages`).

3. Verify Sidebar / Dashboard:
   - Login with seeded SUPER_ADMIN (soporteapps@hexalux.mx) password used during testing (Password123) or your account.
   - Confirm `/dashboard` shows the sidebar (desktop: visible on wide screens; mobile: toggle via menu).

Deployment notes (short)

- No DB migrations required.
- Ensure NEXTAUTH_URL and NEXTAUTH_SECRET are set in deployment environment (Cloud Run). Use secure cookies in production.

Follow-ups (optional)

- Fix TypeScript errors reported by `npx tsc --noEmit` (not introduced by this PR). These are in auth/email files and auth forms. They can be cleaned separately.

---

If you want, I can now create the Git branch and open a PR on GitHub (I will need permission to push); otherwise you can apply the changes and create the PR locally using git. If you want me to open the PR for you, confirm and I will proceed to create the PR draft automatically.