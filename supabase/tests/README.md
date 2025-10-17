# Supabase Tests

pgTAP test stubs live in this directory. Integrate with `supabase db test` once Supabase CLI supports pgTAP harness in your environment.

Suggested structure:
- `rls_policies.sql` — ensure key policies allow/deny expected access.
- `functions.sql` — unit test helpers like `claim_next_job`.

Run locally after configuring pgTAP:
```bash
supabase db test
```
