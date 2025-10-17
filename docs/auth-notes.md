# Authentication Notes

## Supabase Setup
- Ensure `.env.local` contains valid `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Rotate leaked credentials immediately; update workers and local environments after rotation.

## Available Routes (per locale)
- `/[locale]/auth/sign-in` — Supabase password sign-in via server action.
- `/[locale]/auth/sign-up` — collects basic profile data, triggers email verification, then redirects to `check-email`.
- `/[locale]/auth/check-email` — informs the user that verification is required before access.
- `/[locale]/auth/reset-password` — UI placeholders for requesting and applying password resets (backend wiring pending).

## Components & Actions
- Server actions stored in `app/[locale]/auth/*/actions.ts` handle Supabase auth mutations.
- `app/_actions/auth.ts` exports `signOutAction` for global header usage.
- Header reads the Supabase session on the server and renders either CTA buttons or a sign-out button with the user email.

## Outstanding Work
1. Implement reset password server actions (`auth.resetPasswordForEmail`, `auth.exchangeCodeForSession`, `auth.updateUser`).
2. Add resend verification capability on the `check-email` page.
3. Introduce persistent session cookies/Remember Me handling.
4. Create pgTAP/Playwright coverage for auth happy-path and failure states.
