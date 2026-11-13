#!/usr/bin/env python3
"""SEO inventory of a static site tree. usage: inventory.py <root> <out.json>
Records, per HTML page: URL, title, meta description, canonical, robots, OG, H1-H3,
JSON-LD (types and key fields), internal links, word count and normalised body text.
Also records sitemap URLs, robots.txt rules and netlify.toml redirects."""
import re, json, html, pathlib, sys

root = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2])
SKIP_DIRS = ('.git', 'tools', 'node_modules')

def txt(s):
    s = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', s, flags=re.S)
    s = re.sub(r'<!--.*?-->', ' ', s, flags=re.S)
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s))
    for a, b in [('’', "'"), ('‘', "'"), ('“', '"'), ('”', '"'), ('–', '-'), ('—', '-'), ('\xa0', ' ')]:
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', s).strip()

def meta(s, name, attr='name'):
    m = re.search(rf'<meta {attr}="{re.escape(name)}" content="([^"]*)"', s)
    return html.unescape(m.group(1)) if m else None

pages = {}
for f in sorted(root.rglob('*.html')):
    rel = f.relative_to(root).as_posix()
    if rel.split('/')[0] in SKIP_DIRS: continue
    url = '/' + (rel[:-len('index.html')] if rel.endswith('index.html') else rel)
    s = f.read_text(errors='ignore')
    head = s.split('</head>')[0]
    body = s.split('</head>', 1)[1] if '</head>' in s else s
    main = re.search(r'<main\b.*?</main>', body, re.S)
    main = main.group(0) if main else body
    ld = []
    for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            j = json.loads(b)
            for item in (j if isinstance(j, list) else [j]):
                ld.append({'type': item.get('@type'), 'headline': item.get('headline') or item.get('name'),
                           'datePublished': item.get('datePublished'), 'dateModified': item.get('dateModified'),
                           'n_faq': len(item.get('mainEntity', [])) if item.get('@type') == 'FAQPage' else None,
                           'raw': json.dumps(item, sort_keys=True)})
        except Exception as e:
            ld.append({'type': 'INVALID', 'error': str(e)})
    links = sorted(set(html.unescape(h) for h in re.findall(r'href="([^"]+)"', main)
                       if not h.startswith(('http', 'mailto:', 'tel:', '//', '#', 'javascript'))))
    pages[url] = {
        'file': rel,
        'title': txt(m.group(1)) if (m := re.search(r'<title>(.*?)</title>', head, re.S)) else None,
        'description': meta(head, 'description'),
        'keywords': meta(head, 'keywords'),
        'canonical': m.group(1) if (m := re.search(r'<link rel="canonical" href="([^"]+)"', head)) else None,
        'robots': meta(head, 'robots'),
        'og_title': meta(head, 'og:title', 'property'), 'og_description': meta(head, 'og:description', 'property'),
        'og_image': meta(head, 'og:image', 'property'), 'og_url': meta(head, 'og:url', 'property'),
        'h1': [txt(x) for x in re.findall(r'<h1[^>]*>(.*?)</h1>', s, re.S)],
        'h2': [txt(x) for x in re.findall(r'<h2[^>]*>(.*?)</h2>', main, re.S)],
        'h3': [txt(x) for x in re.findall(r'<h3[^>]*>(.*?)</h3>', main, re.S)],
        'jsonld': ld,
        'links_internal': links,
        'text': txt(main),
    }
    pages[url]['words'] = len(pages[url]['text'].split())

sitemap = re.findall(r'<loc>([^<]+)</loc>', (root / 'sitemap.xml').read_text()) if (root / 'sitemap.xml').exists() else []
robots = (root / 'robots.txt').read_text() if (root / 'robots.txt').exists() else ''
redirects = []
t = (root / 'netlify.toml').read_text() if (root / 'netlify.toml').exists() else ''
for blk in re.findall(r'\[\[redirects\]\]\n((?:  [^\n]*\n?)+)', t):
    r = dict(re.findall(r'(\w+) = "?([^"\n]*)"?', blk))
    redirects.append({'from': r.get('from'), 'to': r.get('to'), 'status': r.get('status'), 'force': r.get('force') == 'true'})
out.write_text(json.dumps({'pages': pages, 'sitemap': sitemap, 'robots': robots, 'redirects': redirects}, indent=1))
print(f'{len(pages)} pages, {len(sitemap)} sitemap URLs, {len(redirects)} redirects -> {out}')
