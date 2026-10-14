# Finance Insights blog: setup guide

Setup takes about 15 minutes and uses free plans only.

## What's in the folder
| File | Purpose |
|---|---|
| `index.html` | The blog and the publishing dashboard |
| `config.js` | Where you paste your Supabase keys (empty means local mode) |
| `seed-posts.js` | Your 10 published issues (43–52) and 12 planned issues (53–64) |
| `supabase/schema.sql` | Database tables, security rules, auto-publish job and cover-image storage |
| `supabase/seed.sql` | Optional SQL import of the same issues |

## Try it first (local mode)
Open `index.html` in a browser, then go to **Dashboard** and enter the PIN **1234**. In this mode, data is saved in your browser only.

## Go online with Supabase

**1. Create the project.** Go to supabase.com, select **New project**, name it `finance-insights`, choose an EU region, and save the database password somewhere safe.

**2. Create the database.** In Supabase, open **SQL Editor**, select **New query**, paste all of `supabase/schema.sql`, and select **Run**.
> If you see an error about `pg_cron`, open **Database → Extensions**, enable **pg_cron**, and run the file again. Scheduled issues still go live on time without it.

**3. Create your admin login.** Go to **Authentication → Users → Add user → Create new user**. Enter your email and a strong password, and tick **Auto Confirm User**.

**4. Block public sign-ups.** Go to **Authentication → Sign In / Providers** and turn off **Allow new users to sign up**.

**5. Make yourself admin.** Run this in the SQL Editor, using the email from step 3:
```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com';
```

**6. Connect the site.** Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key into `config.js`:
```js
window.FI_CONFIG = {
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'eyJ...'
};
```
The anon key is safe to make public. The database security rules only let visitors read issues that are live.

**7. Import your issues.** Open the site, go to **Dashboard**, and sign in. Then select **Import Finance Insights issues**. You can also run `supabase/seed.sql` in the SQL Editor instead.

## Publish the website (free)
- **Netlify (simplest):** go to app.netlify.com/drop and drag the whole folder in. You get a link like `finance-insights.netlify.app`, and you can rename the site or add your own domain.
- **GitHub Pages:** upload the folder to a repository, then go to **Settings → Pages** and choose **Deploy from main**.

After any change to `config.js`, upload the folder again.

## Your weekly routine
1. Open **Dashboard → Calendar** and click the planned issue (for example **#53 AI Controls for Finance**).
2. Paste the text of your `PostNN_..._article.md` file into the editor. You can delete the H1 title line and the hashtag line, because the page already shows the title and tags.
3. Optional: upload the `_thumbnail.png` file in **Storage → covers**, copy its public URL, and paste it into **Cover image URL**.
4. Choose **Schedule**, keep the date at Saturday 08:00, and select **Schedule issue**. It goes live automatically at that time.
5. Use **LinkedIn version** to copy a ready-made LinkedIn post that links back to the full issue.

## How scheduling works
- A visitor can see a scheduled issue as soon as its publish time passes. The database security rule handles this, so no server is needed.
- The `pg_cron` job also changes the issue's status to *published* every 5 minutes, so the dashboard stays accurate.
- The **Coming up** box on the blog shows only the title and date of future scheduled issues. The articles stay private until they go live.
