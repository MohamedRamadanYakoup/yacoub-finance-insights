# Finance Insights v2: how to update your GitHub site

Your issues, login, Supabase database and DNS records don't change.

## 1. Upload the new files (about 5 minutes)
1. Unzip `finance-insights-v2.zip`.
2. Open your **finance-insights** repository on GitHub, then click **Add file → Upload files**.
3. Drag in everything from the unzipped folder: `index.html`, `404.html`, `robots.txt`, `UPDATE.md` and the folders `admin`, `assets`, `scripts`, `supabase` and `.github`.
   - **Don't delete** `config.js` or `seed-posts.js` from your repository. They aren't in this zip, so your keys and posts stay safe.
   - The `.github` folder is hidden on some computers. In Windows File Explorer, go to **View → Show → Hidden items**.
4. Click **Commit changes**.

## 2. Switch GitHub Pages to the automatic publisher (recommended)
This step gives every issue a proper preview (title, hook and image) when you share it on LinkedIn.
1. In the repository, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Go to the **Actions** tab, click **Publish Finance Insights**, then **Run workflow**.
4. Wait for the green ✓, then check that **Settings → Pages → Custom domain** still shows `mohamedyacoub.com` with **Enforce HTTPS** ticked.

The publisher runs automatically every 30 minutes and whenever you change a file. If you skip this step, the site still works, but LinkedIn shows the general Finance Insights card for every link instead of each issue's own.

## 3. Your new dashboard address
**https://mohamedyacoub.com/admin/** (bookmark it)

The public blog no longer has a Dashboard button. Old links like `/#/admin` and `/#/post/...` still work and redirect.

## Writing an issue
1. **Writing plan:** open the issue you want to write and click **Write**.
2. **Paste your `_article.md` text** into the empty editor, or click **⬆ Import .md**. The title, issue number, hook and hashtags fill in automatically.
3. **Cover:** click **⬆ Upload image** and choose your `_thumbnail.png`. If you get an error about the "covers" bucket, run `supabase/covers-bucket.sql` once in the Supabase SQL Editor.
4. **👁 Preview** opens the issue exactly as readers will see it.
5. Choose **Schedule**, click **⬢ Issue day**, then click **🗓 Schedule**.

Your work autosaves every few seconds. If the browser closes, you'll be offered your unsaved changes when you open the issue again.
