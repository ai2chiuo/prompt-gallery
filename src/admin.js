// Owner-only admin mode. Loaded only when the URL has ?admin=... or this browser was already unlocked.
// NOT a security boundary (static site): it only toggles "pending delete" marks in localStorage and exports a text list.
// Nothing here changes the site; deletions happen offline via scripts/apply_deletes.py + a rebuild.
(()=>{
const H='__ADMIN_HASH__',FLAG='pgAdminOk',KEY='pgDeleteMarks';
if(!H||!window.crypto||!crypto.subtle)return;
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const ready=f=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',f):f();
(async()=>{
 const u=new URL(location.href),k=u.searchParams.get('admin');
 if(k!==null){u.searchParams.delete('admin');history.replaceState(null,'',u.pathname+u.search+u.hash);
  if(k==='off'){localStorage.removeItem(FLAG);return}
  if(await sha(k)===H)localStorage.setItem(FLAG,H);}
 if(localStorage.getItem(FLAG)!==H)return;
 ready(init);
})();
function init(){
 const get=()=>{try{return new Set(JSON.parse(localStorage.getItem(KEY)||'[]').map(String))}catch{return new Set()}};
 const put=s=>localStorage.setItem(KEY,JSON.stringify([...s]));
 const sorted=s=>[...s].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const st=document.createElement('style');st.textContent=`
 .adm-del{position:absolute;top:6px;right:6px;z-index:5;background:rgba(0,0,0,.65);color:#fff;border:1px solid #ff5d5d;border-radius:6px;padding:2px 8px;font-size:12px;cursor:pointer;user-select:none}
 .card{position:relative}.adm-pd{opacity:.4;outline:2px solid #e5484d;outline-offset:-2px}
 .adm-pd .adm-del{background:#e5484d;opacity:1}.adm-pd::after{content:"待刪除";position:absolute;left:6px;top:6px;background:#e5484d;color:#fff;font-size:12px;padding:1px 8px;border-radius:6px}
 .adm-del.inl{position:static;display:inline-block;margin-left:10px;vertical-align:middle}
 h2.adm-pd{opacity:1;outline:0;color:#e5484d}h2.adm-pd::after{position:static;margin-left:8px;display:inline-block}
 #adm-bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99;background:#1b1d26;color:#eee;border:1px solid #e5484d;border-radius:12px;padding:8px 12px;display:flex;gap:8px;align-items:center;font-size:13px;box-shadow:0 4px 18px #000a}
 #adm-bar button{background:#2a2d38;color:#eee;border:1px solid #444;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:13px}#adm-bar b{color:#ff8a8a}`;
 document.head.appendChild(st);
 const bar=document.createElement('div');bar.id='adm-bar';
 bar.innerHTML='<span>管理模式 · 待刪除 <b id="adm-n">0</b></span><button id="adm-exp">匯出刪除清單</button><button id="adm-clr">清除標記</button><button id="adm-off">離開管理</button>';
 document.body.appendChild(bar);
 const paint=()=>{const s=get();document.getElementById('adm-n').textContent=s.size;
  document.querySelectorAll('[data-id],[data-pid]').forEach(el=>{const id=el.dataset.id||el.dataset.pid;
   el.classList.toggle('adm-pd',s.has(id));const b=el.querySelector('.adm-del');if(b)b.textContent=s.has(id)?'取消刪除':'刪除'})};
 const decorate=()=>{document.querySelectorAll('.card[data-id],h2[data-pid]').forEach(el=>{
  if(el.querySelector('.adm-del'))return;const b=document.createElement('span');b.className='adm-del'+(el.matches('h2')?' inl':'');b.setAttribute('role','button');b.textContent='刪除';el.appendChild(b)});paint()};
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.adm-del');if(!b)return;e.preventDefault();e.stopPropagation();
  const el=b.closest('[data-id],[data-pid]'),id=el.dataset.id||el.dataset.pid,s=get();s.has(id)?s.delete(id):s.add(id);put(s);paint()},true);
 document.getElementById('adm-exp').onclick=()=>{const s=get();if(!s.size){alert('目前沒有標記任何項目');return}
  const txt=sorted(s).join('\n')+'\n';
  try{navigator.clipboard.writeText(txt).catch(()=>{})}catch{}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));a.download='delete-list.txt';document.body.appendChild(a);a.click();a.remove();};
 document.getElementById('adm-clr').onclick=()=>{if(get().size&&confirm('清除所有待刪除標記？')){put(new Set());paint()}};
 document.getElementById('adm-off').onclick=()=>{localStorage.removeItem(FLAG);location.reload()};
 const w=document.getElementById('wall');if(w)new MutationObserver(decorate).observe(w,{childList:true});
 decorate();
}
})();
