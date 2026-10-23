"""Import ONLY rows whose id is listed in content/safe-ids.txt into content/prompts.json.
Usage: python3 scripts/import_safe.py [--xlsx PATH] [--images-dir DIR]
Reads the source xlsx (row number = id), copies only SAFE images to public/images/,
builds 480px webp thumbs in public/thumbs/. HOLD/BLOCK rows and images are never touched/copied.
Always wipes public/images, public/thumbs and content/prompts.json first so nothing stale remains."""
import csv, json, os, re, shutil, sys
import openpyxl
from PIL import Image
A=sys.argv[1:]
def arg(k,d): return A[A.index(k)+1] if k in A else d
XLSX=arg('--xlsx','prompts.xlsx')
SRC=os.path.dirname(XLSX)
IMG=arg('--images-dir',os.path.join(SRC,'圖片'))
TITLE_OVERRIDE={230:'奇幻法師角色肖像（臉書首圖）',772:'長圖資訊海報：靈網大陸',595:'紙箱圖案造型外套街拍',550:'古風婚禮場景：嗩吶',
 813:'粗布長袍人物肖像',496:'恐龍連身睡衣造型（Kigurumi）',807:'海賊王惡魔果實食物圖解',826:'幻想料理：100HP 紅藥水',827:'美食知識海報：補血麵包',
 862:'漫畫日記：廁所冒險',911:'植物學圖解海報：辛夷',824:'立體繪本：彈出式世界',735:'偵探造型街拍',744:'蜜蜂吉祥物造型',129:'東方仙宮全景',212:'倒生建木：東方神話史詩',215:'天穹龍柱：東方神話史詩'}
def collection(tags,title,prompt):
    t=' '.join(tags)+' '+title
    L=t.lower()
    if re.search('旗袍|qipao',L): return '旗袍'
    if re.search('漢服|古風|仙俠|仙宮|東方|古畫|婚禮',L): return '古風仙俠'
    if re.search('服裝設計|clothing-design|fashion-sheet|假人|商品圖|服裝參考|電商|提取服裝',L): return '服裝設計'
    if re.search('cosplay|cos\\b|real-cosplay',L): return 'COSPLAY'
    if re.search('角色設定|角色表|角色參考|角色',L): return '角色設定'
    if re.search('海報|圖解|資訊|漫畫|插畫|anime|動漫|食物|料理|植物|繪本',L): return '插畫與海報'
    if re.search('電影感|場景|fantasy|奇幻',L): return '場景與電影感'
    return '其他'
def clean_tags(raw):
    ts=[]
    for t in re.split('[、,，]',raw.replace('[','').replace(']','').replace('\\','')):
        t=t.strip().strip("'\"")
        if not t or '?' in t or t=='None' or re.fullmatch(r'\d+:\d+',t) or len(t)>24: continue
        if t not in ts: ts.append(t)
    return ts[:6]
safe={int(l.strip()) for l in open('content/safe-ids.txt') if l.strip() and not l.startswith('#')}
for d in ('public/images','public/thumbs'):
    shutil.rmtree(d,ignore_errors=True); os.makedirs(d)
ws=openpyxl.load_workbook(XLSX).active
rows=list(ws.iter_rows(values_only=True))[1:]
out=[]
for i,r in enumerate(rows,start=1):
    if i not in safe: continue
    title,prompt,img,model,cat,tags,src=[('' if x in (None,'None') else str(x)) for x in r]
    if not img or not os.path.exists(os.path.join(IMG,img)): print('SKIP no image',i); continue
    shutil.copy2(os.path.join(IMG,img),'public/images/'+img)
    im=Image.open('public/images/'+img).convert('RGB'); im.thumbnail((480,960))
    im.save('public/thumbs/'+os.path.splitext(img)[0]+'.webp','WEBP',quality=78)
    tl=title.strip().split('\n')[0]
    t=TITLE_OVERRIDE.get(i) or (tl if len(tl)<=34 else tl[:32]+'…')
    tg=clean_tags(tags)
    out.append(dict(id=str(i),title=t,prompt=prompt.strip(),images=[img],type='image',model=model,
        collection=collection(tg,tl,prompt),tags=tg,source_handle=src.lstrip('@'),source_url='',created='2026-10-23'))
json.dump(out,open('content/prompts.json','w'),ensure_ascii=False,indent=1)
print(len(out),'SAFE entries imported;',len(safe),'ids in safe-ids.txt')
