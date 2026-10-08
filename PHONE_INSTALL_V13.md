# iPhone install — StudyFlow v13

The archive is designed for the a-Shell clone named `studyflow.git`.

From `[Documents]$`:

```sh
tar -xzf studyflow_v13_sync_admin_phone_patch.tar.gz -C studyflow.git
cd studyflow.git
git status
git add .
git commit -m "Add cross-device sync reward rate and admin center"
git push
```

Then wait for GitHub Actions to turn green.

After deployment, run `supabase/migrations/005_cross_device_admin.sql` once in Supabase SQL Editor and follow `ADMIN_SETUP_V13.md` to grant your own account admin access.
