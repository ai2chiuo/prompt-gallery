"""CSV -> content/prompts.json, and build webp thumbnails.
Usage: python3 scripts/import_csv.py data.csv [--images-dir DIR]
CSV columns: id,title,prompt,images,type,model,collection,tags,source_handle,source_url,created
  images / tags: separated by '|'. Image files are copied from --images-dir into public/images/.
Run with no CSV (python3 scripts/import_csv.py --thumbs-only) to just (re)build thumbnails."""
import csv, json, sys, os, shutil
from PIL import Image
def thumbs():
    os.makedirs("public/thumbs",exist_ok=True)
    for f in os.listdir("public/images"):
        src=f"public/images/{f}"; dst="public/thumbs/"+os.path.splitext(f)[0]+".webp"
        if os.path.exists(dst) and os.path.getmtime(dst)>=os.path.getmtime(src): continue
        try:
            im=Image.open(src).convert("RGB"); im.thumbnail((480,960)); im.save(dst,"WEBP",quality=78)
        except Exception as e: print("skip",f,e)
if __name__=="__main__":
    a=sys.argv[1:]
    if a and a[0]!="--thumbs-only":
        imgdir=a[a.index("--images-dir")+1] if "--images-dir" in a else None
        out=[]
        for r in csv.DictReader(open(a[0],encoding="utf-8-sig")):
            imgs=[x.strip() for x in (r.get("images") or "").split("|") if x.strip()]
            if imgdir:
                for x in imgs:
                    p=os.path.join(imgdir,x)
                    if os.path.exists(p): shutil.copy2(p,"public/images/"+x)
                    else: print("missing image",p)
            out.append(dict(id=r["id"].strip(),title=r.get("title",""),prompt=r.get("prompt",""),images=imgs,
              type=(r.get("type") or "image").strip(),model=r.get("model",""),collection=r.get("collection",""),
              tags=[t.strip() for t in (r.get("tags") or "").split("|") if t.strip()],
              source_handle=(r.get("source_handle") or "").lstrip("@"),source_url=r.get("source_url",""),created=r.get("created","")))
        json.dump(out,open("content/prompts.json","w"),ensure_ascii=False,indent=1); print(len(out),"entries")
    thumbs()
