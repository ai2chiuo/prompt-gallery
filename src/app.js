const PAGE=40;let all=[],list=[],shown=0;const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
fetch('/data.json').then(r=>r.json()).then(d=>{all=d;const q=new URLSearchParams(location.search);
 const cs=[...new Set(d.map(x=>x.collection).filter(Boolean))];$('#col').innerHTML+=cs.map(c=>`<option>${esc(c)}</option>`).join('');
 if(q.get('q'))$('#q').value=q.get('q');if(q.get('c'))$('#col').value=q.get('c');apply();});
function apply(){const q=$('#q').value.trim().toLowerCase(),c=$('#col').value;
 list=all.filter(x=>(!c||x.collection===c)&&(!q||(x.title+' '+x.prompt+' '+x.tags.join(' ')).toLowerCase().includes(q)));
 list.sort((a,b)=>(b.created||'').localeCompare(a.created||''));shown=0;$('#wall').innerHTML='';$('#count').textContent=`共 ${list.length} 則`;more();}
function more(){$('#wall').insertAdjacentHTML('beforeend',list.slice(shown,shown+PAGE).map(x=>`<a class="card" data-id="${esc(x.id)}" href="/p/${x.id}/">
 <img loading="lazy" decoding="async" src="${x.thumb}" width="${x.w}" height="${x.h}" alt="${esc(x.title)}">
 <div class="t">${esc(x.title)}<div class="m">${esc([x.model,x.collection].filter(Boolean).join(' · '))}</div></div></a>`).join(''));
 shown+=PAGE;$('#more').style.display=shown<list.length?'':'none';}
let tm;$('#q').oninput=()=>{clearTimeout(tm);tm=setTimeout(apply,150)};$('#col').onchange=apply;$('#more').onclick=more;
new IntersectionObserver(e=>{if(e[0].isIntersecting&&shown<list.length)more()},{rootMargin:'800px'}).observe($('#more'));
