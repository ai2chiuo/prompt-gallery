#!/usr/bin/env python3
"""Apply an exported delete list: python3 scripts/apply_deletes.py delete-list.txt [--dry-run] [--no-gate]
Removes the listed ids from content/prompts.json and content/safe-ids.txt, deletes their images and thumbs
from public/ (unless another remaining entry still uses the same file), then runs the content gate.
Run from the repo root. Offline only; never touches the network."""
import json, os, re, subprocess, sys

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry-run' in sys.argv
    if len(args) != 1:
        sys.exit(__doc__)
    root = os.getcwd()
    for need in ('content/prompts.json', 'content/safe-ids.txt', 'scripts/gate.mjs'):
        if not os.path.exists(need):
            sys.exit(f'run from the repo root (missing {need})')
    ids = []
    for line in open(args[0], encoding='utf-8'):
        line = line.strip()
        if line and not line.startswith('#'):
            if not re.fullmatch(r'[\w-]+', line):
                sys.exit(f'invalid id in list: {line!r}')
            ids.append(line)
    ids = list(dict.fromkeys(ids))
    if not ids:
        sys.exit('delete list is empty')
    data = json.load(open('content/prompts.json', encoding='utf-8'))
    have = {str(x['id']) for x in data}
    unknown = [i for i in ids if i not in have]
    gone = {i for i in ids if i in have}
    if unknown:
        print('WARN not in prompts.json (skipped):', ', '.join(unknown))
    keep = [x for x in data if str(x['id']) not in gone]
    removed = [x for x in data if str(x['id']) in gone]
    still = {i for x in keep for i in x.get('images', [])}
    files = []
    for x in removed:
        for img in x.get('images', []):
            img = os.path.basename(img)
            if img in still:
                continue
            files.append('public/images/' + img)
            files.append('public/thumbs/' + re.sub(r'\.[^.]+$', '.webp', img))
    # safe-ids: drop the listed ids, keep comments/blank lines
    lines = open('content/safe-ids.txt', encoding='utf-8').read().splitlines()
    new_lines = [l for l in lines if l.strip() not in gone]
    print(f'{"DRY RUN: " if dry else ""}removing {len(removed)} entries, {sum(os.path.exists(f) for f in files)} files')
    for x in removed:
        print(f'  - {x["id"]} {x["title"]}')
    if dry:
        return
    with open('content/prompts.json', 'w', encoding='utf-8') as f:
        json.dump(keep, f, ensure_ascii=False, indent=1)
    with open('content/safe-ids.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines) + '\n')
    for p in files:
        if os.path.exists(p):
            os.remove(p)
    if '--no-gate' in sys.argv:
        return
    r = subprocess.run(['node', 'scripts/gate.mjs'])
    if r.returncode:
        sys.exit('GATE FAILED after applying deletes')
    print('done. Now: node build.mjs and redeploy.')

main()
