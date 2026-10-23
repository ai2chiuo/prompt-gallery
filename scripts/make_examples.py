# Generate EXAMPLE placeholder images (abstract gradients, no real people) + content/prompts.json
import json, random, os
from PIL import Image, ImageDraw
random.seed(7)
cols=["科幻場景","角色一致性","鏡頭語言","產品攝影"]
models=["Grok Imagine","Seedance 2.0","Midjourney v7","GPT Image"]
items=[]
for i in range(1,13):
    w,h=random.choice([(768,1024),(1024,768),(896,896),(720,1280)])
    a=[random.randint(20,230) for _ in range(3)]; b=[random.randint(20,230) for _ in range(3)]
    im=Image.new("RGB",(w,h)); d=ImageDraw.Draw(im)
    for y in range(h):
        t=y/h; d.line([(0,y),(w,y)],fill=tuple(int(a[k]*(1-t)+b[k]*t) for k in range(3)))
    for _ in range(6):
        x,y,r=random.randint(0,w),random.randint(0,h),random.randint(40,220)
        d.ellipse([x-r,y-r,x+r,y+r],outline=(255,255,255),width=3)
    d.rectangle([0,h//2-40,w,h//2+40],fill=(0,0,0))
    d.text((20,h//2-8),f"EXAMPLE #{i:02d} placeholder",fill=(255,255,255))
    fn=f"example-{i:02d}.png"; im.save(f"public/images/{fn}")
    typ="video" if i%4==0 else "image"
    items.append(dict(id=f"example-{i:02d}",title=f"【範例】佔位作品 {i:02d}",
      prompt=f"EXAMPLE 範例提示詞 {i}: cinematic wide shot of an abstract neon landscape, volumetric light, 35mm, film grain, --ar {w}:{h}",
      images=[fn],type=typ,model=models[i%4],collection=cols[i%4],
      tags=["範例","EXAMPLE",random.choice(["霓虹","極簡","電影感","光影"])],
      source_handle="example_author" if i%3==0 else "",source_url="https://x.com/example_author" if i%3==0 else "",
      created=f"2026-10-{i+5:02d}"))
json.dump(items,open("content/prompts.json","w"),ensure_ascii=False,indent=1)
