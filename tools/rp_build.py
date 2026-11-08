#!/usr/bin/env python3
"""Sync shared partials (head, header, footer) into every public page.

Usage: python3 tools/rp_build.py   (run from the repository root)

Each page marks the shared regions with comments:
  <!-- rp:head -->...<!-- /rp:head -->
  <!-- rp:header -->...<!-- /rp:header -->
  <!-- rp:footer -->...<!-- /rp:footer -->
Edit tools/partials/*.html, run this script, commit the result.
The active nav item is set from the page's location. No build step is
needed on Netlify: the committed HTML is the site.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PARTIALS = ROOT / 'tools' / 'partials'
SKIP = {'internal'}  # team pages keep their own legacy layout

def nav_key(rel):
    p = '/' + rel.replace('index.html', '')
    if p == '/': return 'home'
    for prefix, key in [('/services/', 'services'), ('/how-we-work/', 'how-we-work'), ('/projects/', 'projects'),
                        ('/canberra-renovation-guide/', 'guide'), ('/blog/', 'journal'), ('/about/', 'about'),
                        ('/careers/', 'careers'), ('/contact/', 'contact')]:
        if p.startswith(prefix): return key
    return ''

def main():
    parts = {n: (PARTIALS / f'{n}.html').read_text() for n in ('head', 'header', 'footer')}
    changed = 0
    for f in sorted(ROOT.rglob('*.html')):
        rel = f.relative_to(ROOT).as_posix()
        if rel.split('/')[0] in SKIP or rel.startswith('tools/') or rel.startswith('.'):
            continue
        s = f.read_text()
        orig = s
        for name, body in parts.items():
            if name == 'header':
                key = nav_key(rel)
                body = re.sub(r' aria-current="page"', '', body)
                if key:
                    body = body.replace(f'data-nav="{key}"', f'data-nav="{key}" aria-current="page"')
            pat = re.compile(rf'(<!-- rp:{name} -->\n)(.*?)(\n?\s*<!-- /rp:{name} -->)', re.S)
            if pat.search(s):
                s = pat.sub(lambda m: m.group(1) + body.rstrip('\n') + '\n  <!-- /rp:' + name + ' -->', s, count=1)
        if s != orig:
            f.write_text(s); changed += 1
    print(f'partials synced into {changed} page(s)')

if __name__ == '__main__':
    sys.exit(main())
