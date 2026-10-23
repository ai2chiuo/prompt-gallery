# 提示詞圖庫（MVP）
Zero-dependency static site: `node build.mjs` → `dist/` (index + one page per prompt under /p/<id>/, sitemap.xml, robots.txt, _headers).

## Content gate (must pass before any build/deploy)
Only ids listed in `content/safe-ids.txt` (the allowlist of entries reviewed as SAFE) may appear in `content/prompts.json`. The classification of rejected items is **not** published in this repo.
- Run: `npm run check` (= `node scripts/gate.mjs`). `node build.mjs` runs it first and aborts the build on failure.
- Fails if: an entry's id isn't in `content/safe-ids.txt`; any title/tags/collection/prompt matches the blocklist in `scripts/gate.mjs` (minor/school/loli/少女/學生/制服, age <20, bikini/lingerie/swimwear/性感/裸, cup-size terms, NSFW — strict, no negation handling); an image in `public/images` or `public/thumbs` isn't referenced by an allowlisted entry; an image is missing.
- To add prompts: review first; only add the id to `content/safe-ids.txt` after it is judged SAFE (when unsure, don't add it).

## Add data
1. Review/classify privately (outside this repo). 2. Add SAFE ids to `content/safe-ids.txt`. 3. `python3 scripts/import_safe.py --xlsx PATH [--images-dir DIR]` — imports ONLY allowlisted rows, wipes and rebuilds `public/images`, `public/thumbs` (480px webp) and `content/prompts.json`. (Needs openpyxl + Pillow.)
4. `npm run check && node build.mjs`, preview with `cd dist && python3 -m http.server 4173`.
(`scripts/import_csv.py` is the old generic importer — it does not check the allowlist; don't use it for real data.)

## Config
`site.config.json`: siteName, siteUrl (used by canonical/OG/sitemap — set to real domain), description, adsenseClient (ca-pub-xxx; empty = no script). Ad slots are marked placeholders in build.mjs (`adSlot`).

## Cloudflare Pages
Framework preset: None · Build command: `node build.mjs` · Output directory: `dist` · NODE_VERSION=20.
(Or `npx wrangler pages deploy dist`.) Large video files >25 MB aren't allowed on Pages — host those on R2.

## Content & license
The code is MIT-licensed (see `LICENSE`). The prompts and images in `content/` and `public/` are user-provided content (the site owner's own AI-generated works and prompts; where a prompt originates from someone else, credit is shown as「提示詞來源」). They are **not** covered by the MIT license — all rights remain with their respective owners. Contact the owner via this repo's Issues to request attribution or removal.
