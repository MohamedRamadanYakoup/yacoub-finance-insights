// Builds the site for GitHub Pages:
//  • copies the site into _site/
//  • creates /post/<slug>/index.html for every live issue, with its own title, description and image
//    so LinkedIn and Google show a proper preview
//  • creates 404.html (so new links work instantly) and sitemap.xml
// Runs automatically from .github/workflows/pages.yml — you never need to run it by hand.
import fs from 'node:fs';
import path from 'node:path';

const SITE = (process.env.SITE_URL || 'https://mohamedyacoub.com').replace(/\/$/, '');
const OUT = '_site';
const SKIP = new Set(['.git', '.github', 'scripts', '_site', 'node_modules', 'supabase']);

fs.rmSync(OUT, { recursive: true, force: true });
for (const name of fs.readdirSync('.')) {
  if (SKIP.has(name) || name.startsWith('.')) continue;
  fs.cpSync(name, path.join(OUT, name), { recursive: true });
}

const html = fs.readFileSync('index.html', 'utf8');
fs.writeFileSync(path.join(OUT, '404.html'), html);

const cfgText = fs.existsSync('config.js') ? fs.readFileSync('config.js', 'utf8') : '';
const url = (cfgText.match(/supabaseUrl\s*:\s*['"]([^'"]+)['"]/) || [])[1];
const key = (cfgText.match(/supabaseAnonKey\s*:\s*['"]([^'"]+)['"]/) || [])[1];
const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let posts = [];
if (url && key) {
  try {
    const nowIso = new Date().toISOString();
    const q = `${url.replace(/\/$/, '')}/rest/v1/posts?select=slug,title,excerpt,cover_img,issue,publish_at,updated_at&or=(status.eq.published,and(status.eq.scheduled,publish_at.lte.${nowIso}))&order=publish_at.desc`;
    const r = await fetch(q, { headers: { apikey: key } });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    posts = await r.json();
  } catch (err) { console.warn('Could not read issues from Supabase — continuing without preview pages:', err.message); }
} else console.warn('config.js has no Supabase keys — skipping preview pages.');

for (const p of posts) {
  if (!p.slug) continue;
  const link = `${SITE}/post/${encodeURIComponent(p.slug)}`;
  const img = p.cover_img || `${SITE}/assets/og-default.png`;
  const title = `${p.title} — Finance Insights${p.issue ? ' #' + p.issue : ''}`;
  const og = `<!--OG-->
<title>${e(title)}</title>
<meta name="description" content="${e(p.excerpt)}">
<link rel="canonical" href="${link}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Finance Insights">
<meta property="og:title" content="${e(p.title)}">
<meta property="og:description" content="${e(p.excerpt)}">
<meta property="og:image" content="${e(img)}">
<meta property="og:url" content="${link}">
<meta property="article:published_time" content="${e(p.publish_at)}">
<meta name="twitter:card" content="summary_large_image">
<!--/OG-->`;
  const dir = path.join(OUT, 'post', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html.replace(/<!--OG-->[\s\S]*?<!--\/OG-->/, og));
}

const urls = [`${SITE}/`, ...posts.map(p => `${SITE}/post/${encodeURIComponent(p.slug)}`)];
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${posts.length} issue preview page(s).`);
