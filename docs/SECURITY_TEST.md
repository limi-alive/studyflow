# Mandatory two-user RLS test

Run this after applying `supabase/schema.sql` in a staging Supabase project.

1. Create User A and User B using normal authentication.
2. Sign in as User A and create a subject/session. Confirm its `user_id` is User A's auth UUID.
3. Copy that row UUID.
4. Sign in as User B and attempt `select`, `update` and `delete` for User A's UUID through the normal anon-key client.
5. All operations must return no accessible row / be rejected by RLS.
6. Repeat with A/B reversed.
7. Try inserting a row while authenticated as User A but with `user_id = User B`. It must be rejected by the `WITH CHECK` policy.
8. Never run this test with the service-role key; that role bypasses RLS by design.

Release is blocked if any cross-user access succeeds.
