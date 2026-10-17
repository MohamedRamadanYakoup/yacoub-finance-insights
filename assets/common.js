/* =====================================================================
   Finance Insights — shared code for the blog (/) and the dashboard (/admin/)
   ===================================================================== */
const CFG = window.FI_CONFIG || {};
const CLOUD = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
const LS_KEY = 'finance_insights_v1';
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DEFAULT_SETTINGS = {blogName:'Finance Insights',tagline:'Weekly insights for finance professionals.',author:'Mohamed Yacoub',role:'Author of the Finance Insights LinkedIn newsletter',linkedin:'https://www.linkedin.com/',weeklyDay:6,weeklyTime:'08:00',showUpcoming:true,pin:'1234'};
const CAT = {'Finance':'#C9A86A','AI':'#2d9b9d','Tech':'#2d9b9d','Career Growth':'#E8E2D0'};
const catColor = c => CAT[c] || '#9dc9ca';

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const now = () => new Date();
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&3|8)).toString(16) }));
const fmtD = d => new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const fmtDT = d => new Date(d).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const pad = n => String(n).padStart(2,'0');
const toLocalInput = d => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` };
const dayKey = d => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` };
const words = t => (t||'').trim().split(/\s+/).filter(Boolean).length;
const readTime = t => Math.max(1, Math.round(words(t)/230));
const slugify = s => String(s||'post').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g,'-').replace(/^-|-$/g,'').slice(0,70) || 'post';
const initials = n => esc((n||'FI').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase());
function weekStart(d){ const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x }
function nextSlot(from, dow, time){ const [h,m] = time.split(':').map(Number); const d = new Date(from); d.setHours(h,m,0,0); let add = (dow-d.getDay()+7)%7; if(add===0 && d<=from) add = 7; d.setDate(d.getDate()+add); return d }
function countdown(t){ let s = (new Date(t)-now())/1000; if(s<=0) return 'due now'; const d = Math.floor(s/86400); s -= d*86400; const h = Math.floor(s/3600); const m = Math.floor((s-h*3600)/60); return d ? `in ${d}d ${h}h` : h ? `in ${h}h ${m}m` : `in ${m}m` }
const isLive = p => p.status==='published' || (p.status==='scheduled' && p.publishAt && new Date(p.publishAt) <= now());
const effStatus = p => isLive(p) ? 'live' : (p.status==='draft' && p.publishAt) ? 'planned' : p.status;
const STATUS_LABEL = {live:'Published',scheduled:'Scheduled',draft:'Draft',planned:'Planned'};
const postUrl = p => '/post/' + encodeURIComponent(p.slug || slugify(p.title));
function loadScript(src){ return window.FI_SEED&&src.includes('seed') ? Promise.resolve() : new Promise((res,rej)=>{ const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s) }) }
let _tt; function toast(m){ const t = $('#toast'); if(!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(_tt); _tt = setTimeout(()=>t.classList.remove('show'), 2800) }

/* ---------- brand ---------- */
function markSVG(id){ id = id || ('m'+Math.random().toString(36).slice(2,7)); return `<svg class="mark" viewBox="0 0 64 64" role="img" aria-label="Finance Insights"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d5859"/><stop offset=".5" stop-color="#0a4445"/><stop offset="1" stop-color="#073334"/></linearGradient></defs>
<polygon points="32,3 58,17.5 58,46.5 32,61 6,46.5 6,17.5" fill="url(#${id})" stroke="rgba(255,255,255,.28)" stroke-width="1.6"/>
<polygon points="4,24 17,15 15,33" fill="#1a7b7d" opacity=".9"/><polygon points="8,32 19,26 17,40" fill="#2d9b9d" opacity=".8"/>
<polygon points="15,4 29,6 20,17" fill="#e8dcc8" opacity=".95"/><polygon points="45,52 60,45 56,60" fill="#c8a869"/>
<path d="M41 22 L52 15" stroke="#9dc9ca" stroke-width="2.6" stroke-linecap="round"/><polygon points="49,11 56,13.5 51.5,19" fill="#9dc9ca"/>
<line x1="20" y1="22" x2="44" y2="22" stroke="#c8a869" stroke-width=".9" opacity=".7"/><line x1="20" y1="44" x2="44" y2="44" stroke="#c8a869" stroke-width=".9" opacity=".7"/>
<text x="32" y="39.5" text-anchor="middle" font-family="Inter,Segoe UI,Arial" font-weight="900" font-size="17" fill="#fff" letter-spacing="1">FI</text></svg>` }
function brandHTML(sub, href){ return `<a class="brand" href="${href||'/'}" ${href&&href.startsWith('#')?'':'data-link'}>${markSVG()}<div class="wordmark"><span class="chev">▲</span><b>FINANCE</b><b>INSIGHTS</b>${sub?`<small>${esc(sub)}</small>`:'<span class="chev" style="margin-top:2px">▼</span>'}</div></a>` }
function hexSVG(issue, color){ return `<svg class="hex" viewBox="0 0 200 200" aria-hidden="true"><polygon points="100,8 182,54 182,146 100,192 18,146 18,54" fill="rgba(13,88,89,.85)" stroke="rgba(255,255,255,.18)" stroke-width="3"/>
<polygon points="8,70 46,44 40,96" fill="#1a7b7d" opacity=".85"/><polygon points="38,14 82,20 56,52" fill="#e8dcc8" opacity=".9"/><polygon points="150,160 192,140 182,190" fill="${color}"/>
<polygon points="86,70 132,100 86,130" fill="${color}" opacity=".95"/><text x="100" y="178" text-anchor="middle" font-family="Inter,Arial" font-weight="900" font-size="20" fill="rgba(255,255,255,.55)" letter-spacing="2">${issue?('#'+issue):''}</text></svg>` }
function coverHTML(p, cls=''){ const c = catColor(p.category);
  const bg = p.coverImg ? `style="background-image:url('${esc(p.coverImg)}')"` : '';
  return `<div class="cover ${p.coverImg?'img':''} ${cls}" ${bg}>${hexSVG(p.issue,c)}<span class="cpill" style="background:${c}">${esc(p.category||'Finance')}</span><div class="ttl">${esc(p.title||'')}</div>${p.issue?`<span class="iss">Issue ${p.issue}</span>`:''}</div>` }

/* ---------- markdown → HTML (+ table of contents) ---------- */
function md(src){
  const toc = [], used = {};
  const hid = t => { let b = slugify(t.replace(/<[^>]+>/g,'')) || 'section', id = b, n = 2; while(used[id]) id = b+'-'+(n++); used[id] = 1; return id };
  const inline = s => s.replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g,'<img src="$2" alt="$1" loading="lazy">')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>')
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,;:!?])/g,'$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines = esc(src||'').split('\n'); let html = '', list = null, para = [];
  const fp = () => { if(para.length){ html += `<p>${inline(para.join(' '))}</p>`; para = [] } };
  const cl = () => { if(list){ html += `</${list}>`; list = null } };
  for(let i=0;i<lines.length;i++){
    const l = lines[i].trimEnd(); let m;
    if(!l.trim()){ fp(); cl(); continue }
    if(l.trim().startsWith('|')){ fp(); cl(); const rows = []; while(i<lines.length && lines[i].trim().startsWith('|')){ rows.push(lines[i].trim()); i++ } i--;
      const cells = r => r.replace(/^\||\|$/g,'').split('|').map(c=>inline(c.trim()));
      const body = rows.filter((r,k)=>!(k===1 && /^\|?[\s:|-]+\|?$/.test(r)));
      html += '<div class="tbl"><table><thead><tr>'+cells(body[0]).map(c=>`<th>${c}</th>`).join('')+'</tr></thead><tbody>'+body.slice(1).map(r=>'<tr>'+cells(r).map(c=>`<td>${c}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>'; continue }
    if(/^(-{3,}|\*{3,})$/.test(l.trim())){ fp(); cl(); html += '<hr>'; continue }
    if(m = l.match(/^(#{1,4})\s+(.*)/)){ fp(); cl(); const n = Math.max(2, m[1].length), t = inline(m[2]), id = hid(m[2]);
      if(n<=3) toc.push({id, level:n, text:m[2].replace(/\*/g,'')}); html += `<h${n} id="${id}">${t}</h${n}>`; continue }
    if(m = l.match(/^&gt;\s?(.*)/)){ fp(); cl(); html += `<blockquote>${inline(m[1])}</blockquote>`; continue }
    if(m = l.match(/^::\s?(.*)/)){ fp(); cl(); html += `<div class="formula">${inline(m[1])}</div>`; continue }
    if(m = l.match(/^[-*]\s+(.*)/)){ fp(); if(list!=='ul'){ cl(); html += '<ul>'; list = 'ul' } html += `<li>${inline(m[1])}</li>`; continue }
    if(m = l.match(/^\d+\.\s+(.*)/)){ fp(); if(list!=='ol'){ cl(); html += '<ol>'; list = 'ol' } html += `<li>${inline(m[1])}</li>`; continue }
    cl(); para.push(l) }
  fp(); cl(); return {html, toc} }

/* ---------- read an _article.md file and pull out its parts ---------- */
function parseArticleMd(text){
  let lines = text.replace(/\r/g,'').split('\n'); const out = {};
  const ti = lines.findIndex(l=>/^#\s+\S/.test(l));
  if(ti>=0 && ti<6){ out.title = lines[ti].replace(/^#\s+/,'').trim(); lines.splice(ti,1) }
  for(let i=0;i<Math.min(6,lines.length);i++){ const m = lines[i].match(/Issue\s+(\d+)/i);
    if(m){ out.issue = +m[1]; if(/Finance Insights/i.test(lines[i]) && lines[i].length<220){ lines.splice(i,1) } break } }
  const tags = [];
  while(lines.length && (!lines[lines.length-1].trim() || /^(#[\w\u0600-\u06FF]+[\s,]*)+$/.test(lines[lines.length-1].trim()))){
    const l = lines.pop().trim(); if(l) tags.unshift(...l.match(/#[\w\u0600-\u06FF]+/g).map(t=>t.slice(1))) }
  if(tags.length) out.tags = [...new Set(tags)];
  while(lines.length && !lines[0].trim()) lines.shift();
  out.content = lines.join('\n').trim();
  const hookIdx = lines.findIndex(l=>/^##\s+the hook/i.test(l));
  const fromIdx = hookIdx>=0 ? hookIdx+1 : 0;
  const para = []; for(let i=fromIdx;i<lines.length;i++){ const l = lines[i].trim(); if(!l){ if(para.length) break; continue } if(/^(#|>|[-*]\s|\||::)/.test(l)){ if(para.length) break; continue } para.push(l) }
  if(para.length){ let e = para.join(' ').replace(/\*\*/g,'').replace(/\*/g,''); if(e.length>260){ const cut = e.slice(0,260); e = cut.slice(0, Math.max(cut.lastIndexOf('. ')+1, 160)).trim() } out.excerpt = e }
  const blob = (out.title+' '+(out.tags||[]).join(' ')).toLowerCase();
  if(/\bai\b|copilot|prompt|agent|genai|generativeai|financeai/.test(blob)) out.category = 'AI';
  else if(/career|acca|portfolio|skills|role|interview/.test(blob)) out.category = 'Career Growth';
  return out }

/* =====================================================================
   DATA LAYER — Supabase when config.js has keys, otherwise this browser
   ===================================================================== */
let sb = null;
const S = {settings:{...DEFAULT_SETTINGS}, posts:[], log:[], upcoming:[]};
const AUTH = {user:null, isAdmin:false};
const fromRow = r => ({id:r.id,slug:r.slug,issue:r.issue,title:r.title,excerpt:r.excerpt||'',content:r.content||'',category:r.category||'Finance',tags:r.tags||[],coverImg:r.cover_img||'',series:r.series!==false,status:r.status,publishAt:r.publish_at||'',views:r.views||0,createdAt:r.created_at,updatedAt:r.updated_at});
const toRow = p => ({id:p.id,slug:p.slug,issue:p.issue||null,title:p.title,excerpt:p.excerpt,content:p.content,category:p.category,tags:p.tags||[],cover_img:p.coverImg||null,series:p.series!==false,status:p.status,publish_at:p.publishAt||null,updated_at:new Date().toISOString()});
const seedPosts = () => (window.FI_SEED||[]).map(s=>({id:uuid(),views:0,series:true,coverImg:'',...s,publishAt:new Date(s.publishAt).toISOString()}));
function localSave(){ localStorage.setItem(LS_KEY, JSON.stringify({settings:S.settings, posts:S.posts, log:S.log})) }

const DB = {
  async init(){
    if(CLOUD){
      sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
      const {data:{session}} = await sb.auth.getSession(); await setUser(session?.user||null);
    } else {
      let d = null; try{ d = JSON.parse(localStorage.getItem(LS_KEY)) }catch(e){}
      if(!d || !d.posts){ await loadScript('/seed-posts.js').catch(()=>{}); d = {settings:{...DEFAULT_SETTINGS}, posts:seedPosts(), log:[]} }
      S.settings = {...DEFAULT_SETTINGS, ...d.settings}; S.posts = d.posts; S.log = d.log||[]; localSave();
      AUTH.isAdmin = sessionStorage.getItem('fi_auth')==='1';
    }
  },
  async load(withLog){
    if(!CLOUD){ S.upcoming = S.posts.filter(p=>p.status==='scheduled' && !isLive(p)).sort((a,b)=>new Date(a.publishAt)-new Date(b.publishAt)); return }
    const [ps, st, up] = await Promise.all([
      sb.from('posts').select('*').order('publish_at',{ascending:false, nullsFirst:false}),
      sb.from('settings').select('data').eq('id',1).maybeSingle(),
      sb.from('upcoming_posts').select('*').order('publish_at')]);
    if(ps.error) throw ps.error;
    S.posts = (ps.data||[]).map(fromRow);
    if(st.data && st.data.data) S.settings = {...DEFAULT_SETTINGS, ...st.data.data};
    S.upcoming = (up.data||[]).map(r=>({title:r.title, category:r.category, issue:r.issue, publishAt:r.publish_at}));
    if(withLog && AUTH.isAdmin){ const l = await sb.from('activity').select('*').order('at',{ascending:false}).limit(60); S.log = (l.data||[]).map(r=>({t:r.at, i:r.icon, m:r.message})) }
  },
  async save(p){
    p.updatedAt = new Date().toISOString();
    if(!CLOUD){ const i = S.posts.findIndex(x=>x.id===p.id); if(i>=0) S.posts[i] = p; else { p.createdAt = p.updatedAt; S.posts.push(p) } localSave(); return }
    const {error} = await sb.from('posts').upsert(toRow(p)); if(error) throw error;
    const i = S.posts.findIndex(x=>x.id===p.id); if(i>=0) S.posts[i] = p; else S.posts.push(p);
  },
  async saveMany(arr){
    if(!CLOUD){ arr.forEach(p=>S.posts.push(p)); localSave(); return }
    const {error} = await sb.from('posts').insert(arr.map(p=>({...toRow(p), views:p.views||0}))); if(error) throw error },
  async remove(id){ if(!CLOUD){ S.posts = S.posts.filter(p=>p.id!==id); localSave(); return } const {error} = await sb.from('posts').delete().eq('id',id); if(error) throw error; S.posts = S.posts.filter(p=>p.id!==id) },
  view(p){ // one read per visitor session; the author's own visits are not counted
    if(AUTH.isAdmin) return; const k = 'fi_read_'+p.id; if(sessionStorage.getItem(k)) return; sessionStorage.setItem(k,'1'); p.views = (p.views||0)+1;
    if(!CLOUD){ localSave(); return } sb.rpc('increment_views',{p_id:p.id}).then(()=>{}) },
  async saveSettings(s){ S.settings = s; if(!CLOUD){ localSave(); return } const {error} = await sb.from('settings').upsert({id:1, data:s}); if(error) throw error },
  async log(i, m){ S.log.unshift({t:new Date().toISOString(), i, m}); S.log = S.log.slice(0,80); if(!CLOUD){ localSave(); return } sb.from('activity').insert({icon:i, message:m}).then(()=>{}) },
  async publishDue(){ const due = S.posts.filter(p=>p.status==='scheduled' && new Date(p.publishAt)<=now());
    for(const p of due){ p.status = 'published'; try{ await DB.save(p); await DB.log('⚡',`Auto-published “${p.title}”`) }catch(e){} } return due.length },
  async uploadCover(file, slug){
    if(!CLOUD){ if(file.size>1.5e6) throw new Error('In local mode images must be under 1.5 MB');
      return await new Promise((res,rej)=>{ const r = new FileReader(); r.onload = ()=>res(r.result); r.onerror = rej; r.readAsDataURL(file) }) }
    const ext = (file.name.split('.').pop()||'png').toLowerCase(), path = `${slugify(slug||'cover')}-${Date.now().toString(36)}.${ext}`;
    const {error} = await sb.storage.from('covers').upload(path, file, {upsert:true, contentType:file.type}); if(error) throw error;
    return sb.storage.from('covers').getPublicUrl(path).data.publicUrl }
};
async function setUser(u){ AUTH.user = u; AUTH.isAdmin = false; if(u && sb){ const {data} = await sb.rpc('is_admin'); AUTH.isAdmin = !!data } }
