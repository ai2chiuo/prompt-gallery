// Zero-dependency static builder: node build.mjs -> dist/
import fs from 'fs';import path from 'path';import crypto from 'crypto';import {runGate} from './scripts/gate.mjs';runGate();
const cfg=JSON.parse(fs.readFileSync('site.config.json','utf8'));const data=JSON.parse(fs.readFileSync('content/prompts.json','utf8'));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const D='dist';fs.rmSync(D,{recursive:true,force:true});fs.mkdirSync(D);fs.cpSync('public',D,{recursive:true});
fs.copyFileSync('src/style.css',D+'/style.css');fs.copyFileSync('src/app.js',D+'/app.js');
// Owner admin mode: the secret is NOT in the repo. It is read from env ADMIN_KEY or the gitignored file .admin-key.
// Only its SHA-256 goes into dist/admin.js (the client hashes ?admin=<key> and compares). No key -> admin mode is a no-op.
const adminKey=(process.env.ADMIN_KEY||(fs.existsSync('.admin-key')?fs.readFileSync('.admin-key','utf8'):'')).trim();
if(adminKey&&adminKey.length<24){console.error('ADMIN_KEY must be at least 24 chars');process.exit(1)}
const adminHash=adminKey?crypto.createHash('sha256').update(adminKey).digest('hex'):'';
fs.writeFileSync(D+'/admin.js',fs.readFileSync('src/admin.js','utf8').replace('__ADMIN_HASH__',adminHash));
console.log(adminKey?'admin mode: enabled (key hash embedded)':'admin mode: disabled (no .admin-key / ADMIN_KEY)');
const dims=f=>{try{const b=fs.readFileSync(f);if(b.toString('ascii',0,4)==='RIFF'){const t=b.toString('ascii',12,16);
 if(t==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];if(t==='VP8L'){const n=b.readUInt32LE(21);return[(n&0x3fff)+1,((n>>14)&0x3fff)+1]}
 if(t==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)]}}catch{}return[480,480]};
const thumb=img=>{const t='thumbs/'+img.replace(/\.[^.]+$/,'.webp');return fs.existsSync('public/'+t)?'/'+t:'/images/'+img};
const ads=cfg.adsenseClient?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cfg.adsenseClient}" crossorigin="anonymous"></script>`:'';
const adSlot=`<div class="ad"><!-- AdSense 廣告位：通過審核後把 <ins class="adsbygoogle"> 程式碼貼在這裡 -->廣告位（預留）</div>`;
const adminLoader=`<script>try{if(location.search.indexOf('admin=')>-1||localStorage.getItem('pgAdminOk')){var s=document.createElement('script');s.src='/admin.js';document.head.appendChild(s)}}catch(e){}</script>`;
const head=(title,desc,url,img)=>`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${img}"><meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/style.css">${ads}${adminLoader}</head><body>`;
const top=`<header><div class="bar"><h1><a href="/">${esc(cfg.siteName)}</a></h1>`;
const slim=data.map(x=>{const th=thumb(x.images[0]||'');const[w,h]=dims('public'+th);return{id:x.id,title:x.title,prompt:x.prompt,tags:x.tags||[],type:x.type,model:x.model,collection:x.collection,created:x.created,thumb:th,w,h}});
fs.writeFileSync(D+'/data.json',JSON.stringify(slim));
fs.writeFileSync(D+'/index.html',head(cfg.siteName+'｜AI 提示詞圖庫',cfg.description,cfg.siteUrl+'/',cfg.siteUrl+(slim[0]?.thumb||''))+top+
`<input id="q" type="search" placeholder="搜尋標題、提示詞、標籤…"><select id="col"><option value="">全部合集</option></select>
<span id="count" class="m"></span></div></header>
<main>${adSlot}<div id="wall" class="wall"></div><button id="more">載入更多</button></main><script src="/app.js" defer></script></body></html>`);
for(const x of data){const url=`${cfg.siteUrl}/p/${x.id}/`;const dir=`${D}/p/${x.id}`;fs.mkdirSync(dir,{recursive:true});
 const src=x.source_handle?`<p>提示詞來源：${x.source_url?`<a href="${esc(x.source_url)}" target="_blank" rel="noopener nofollow">@${esc(x.source_handle)}</a>`:'@'+esc(x.source_handle)}</p>`:'';
 const media=x.images.map(i=>`<img src="/images/${esc(i)}" alt="${esc(x.title)}">`).join("");
 fs.writeFileSync(dir+'/index.html',head(`${x.title}｜${cfg.siteName}`,x.prompt.slice(0,150),url,cfg.siteUrl+thumb(x.images[0]||''))+top+`</div></header><main>
<p><a href="/">← 返回圖庫</a></p><div class="detail"><div>${media}</div><div><h2 data-pid="${esc(x.id)}">${esc(x.title)}</h2>
<p>${x.model?`<span class="badge">${esc(x.model)}</span>`:''} 合集：<a href="/?c=${encodeURIComponent(x.collection)}">${esc(x.collection)}</a></p>
<pre id="pr">${esc(x.prompt)}</pre><button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('pr').innerText).then(()=>this.textContent='已複製 ✓')">一鍵複製提示詞</button>
<p class="tags">${(x.tags||[]).map(t=>`<a href="/?q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}</p>${src}<p class="m">${esc(x.created)}</p>${adSlot}</div></div></main>
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"CreativeWork",name:x.title,text:x.prompt,dateCreated:x.created})}</script></body></html>`);}
fs.writeFileSync(D+'/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${cfg.siteUrl}/</loc></url>${data.map(x=>`<url><loc>${cfg.siteUrl}/p/${x.id}/</loc>${x.created?`<lastmod>${x.created}</lastmod>`:''}</url>`).join('')}</urlset>`);
fs.writeFileSync(D+'/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
fs.writeFileSync(D+'/_headers',`/thumbs/*\n  Cache-Control: public, max-age=31536000, immutable\n/images/*\n  Cache-Control: public, max-age=31536000\n`);
console.log(`built ${data.length} prompt pages -> dist/`);
