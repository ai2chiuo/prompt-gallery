// Content gate. Run: `node scripts/gate.mjs` (or `npm run check`). Also runs automatically at the start of `node build.mjs`.
// Fails (exit 1) if:
//  1) any entry in content/prompts.json has an id that is not in content/safe-ids.txt (the allowlist of reviewed-SAFE ids)
//  2) any entry's title/tags/prompt/collection matches the blocklist below (no negation handling on purpose: strict)
//  3) public/images or public/thumbs contain a file no SAFE entry references (stops HOLD/BLOCK images from leaking into dist)
//  4) an entry references a missing image
import fs from 'fs';
export const BLOCKLIST = {
  '未成年/學校/蘿莉': /未成年|兒童|儿童|女童|幼女|幼態|幼态|幼齒|童顏|童颜|娃娃臉|娃娃脸|baby-?face|蘿莉|萝莉|洛麗|洛丽|loli|underage|\bminors?\b|\bchild|\bkids?\b|\bteen|school|student|學生|学生|學校|学校|校服|校園|校园|學園|高中|國中|国中|中學|小學|女高|制服|水手服|百褶|(?<![A-Za-z])JK(?![A-Za-z])|少女|萌妹|妹妹|妹子/i,
  '未滿20歲': /(?<!\d)(?:[4-9]|1\d)\s*(?:歲|岁|歳|[- ]?years?[- ]?old|yo\b)|\bage[d]?\s*[:：]?\s*(?:[4-9]|1\d)\b/i,
  '泳裝/內衣': /bikini|比基尼|lingerie|內衣|内衣|swimsuit|swimwear|泳裝|泳衣|泳装|胸罩|內褲|内裤|丁字|\bbra\b|肚兜|情趣/i,
  '性感/裸露/NSFW': /性感|sexy|誘惑|诱惑|裸|nude|naked|nsfw|topless|乳頭|乳头|乳溝|乳沟|低胸|cleavage|underboob|露點|露点|走光|色情|porn|\bsex\b|私密部位|露乳|露臀|露背|露腰|露臍/i,
  '罩杯/身體強調': /[A-K]\s*罩杯|罩杯|\b[A-K]\s*cup\b|巨乳|爆乳|大胸|豐滿|丰满|胸部|超短|極短|极短/i,
};
export function runGate(){
  const errs=[];
  if(!fs.existsSync('content/safe-ids.txt')) { console.error('GATE FAIL: content/safe-ids.txt missing'); process.exit(1); }
  const allow=new Set(fs.readFileSync('content/safe-ids.txt','utf8').split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')));
  const data=JSON.parse(fs.readFileSync('content/prompts.json','utf8'));
  const used=new Set();
  for(const x of data){
    const id=String(x.id);
    if(!allow.has(id)) errs.push(`#${id} "${x.title}": id not in content/safe-ids.txt (not reviewed as SAFE)`);
    const text=[x.title,x.collection,(x.tags||[]).join(' '),x.prompt].join('\n');
    for(const [name,rx] of Object.entries(BLOCKLIST)){const m=text.match(rx); if(m) errs.push(`#${id} "${x.title}": blocklist [${name}] matched "${m[0]}"`);}
    for(const i of x.images||[]){ used.add(i); if(!fs.existsSync('public/images/'+i)) errs.push(`#${id}: missing image ${i}`); used.add(i.replace(/\.[^.]+$/,'.webp')); }
  }
  for(const d of ['public/images','public/thumbs']) if(fs.existsSync(d)) for(const f of fs.readdirSync(d)) if(!used.has(f)) errs.push(`${d}/${f}: not referenced by any SAFE entry (would leak into dist)`);
  if(errs.length){ console.error(`GATE FAIL (${errs.length}):\n`+errs.join('\n')); process.exit(1); }
  console.log(`gate OK: ${data.length} entries all on allowlist, no blocklist hits, no orphan files`);
}
if(import.meta.url===`file://${process.argv[1]}`) runGate();
