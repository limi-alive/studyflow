# Enable StudyFlow Admin — v13

1. Deploy the v13 frontend.
2. In Supabase -> SQL Editor, run the whole file:
   `supabase/migrations/005_cross_device_admin.sql`
3. Promote only the account that should be admin. Replace `YOUR_USERNAME` below with the exact StudyFlow username and run this in Supabase SQL Editor:

```sql
insert into public.admin_users(user_id)
select id from public.profiles
where lower(username) = lower('YOUR_USERNAME')
on conflict (user_id) do nothing;
```

4. Reload StudyFlow and sign in with that account.
5. An **Admin** entry appears in the desktop sidebar. On mobile, open **Profile -> StudyFlow Control Room**.

To remove admin access later:

```sql
delete from public.admin_users
where user_id = (
  select id from public.profiles where lower(username)=lower('YOUR_USERNAME')
);
```

Do not add an admin-registration button to the public app. Admin assignment belongs in Supabase SQL/service-role administration only.
