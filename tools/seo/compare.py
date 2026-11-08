#!/usr/bin/env python3
"""Compare dev inventory against the production baseline. usage: compare.py baseline.json dev.json out.md"""
import json, re, sys
B = json.load(open(sys.argv[1])); D = json.load(open(sys.argv[2])); OUT = sys.argv[3]
bp, dp = B['pages'], D['pages']
rows, issues = [], []

def sents(t): return [x.strip() for x in re.split(r'(?<=[.!?])\s+', t) if len(x.strip()) > 30]
def coverage(bt, dt):
    s = sents(bt)
    if not s: return 1.0, []
    dn = re.sub(r'\s+', ' ', dt)
    miss = [x for x in s if re.sub(r'\s+([.,;:!?])', r'\1', x) not in re.sub(r'\s+([.,;:!?])', r'\1', dn)]
    return 1 - len(miss) / len(s), miss

def ld_map(p): return {x['type']: x.get('raw') for x in p['jsonld']}

for url, b in sorted(bp.items()):
    d = dp.get(url)
    if not d:
        issues.append((url, 'MISSING PAGE', '')); rows.append((url, 'MISSING', '', '', '', '', '', '', '')); continue
    chk = {}
    for k in ['title', 'description', 'canonical', 'robots', 'keywords', 'og_title', 'og_description', 'og_url']:
        chk[k] = 'same' if b[k] == d[k] else 'CHANGED'
        if chk[k] == 'CHANGED': issues.append((url, k, f'{b[k]!r} -> {d[k]!r}'))
    chk['h1'] = 'same' if b['h1'] == d['h1'] else 'CHANGED'
    if chk['h1'] == 'CHANGED': issues.append((url, 'h1', f"{b['h1']} -> {d['h1']}"))
    lost_h = [h for h in b['h2'] + b['h3'] if h not in d['h2'] + d['h3']]
    if lost_h: issues.append((url, 'headings not found as H2/H3', '; '.join(lost_h[:8]) + (' ...' if len(lost_h) > 8 else '')))
    bl, dl = ld_map(b), ld_map(d)
    ld_status = 'same'
    for t, raw in bl.items():
        if t not in dl: ld_status = 'REMOVED ' + t; issues.append((url, 'jsonld removed', t))
        elif dl[t] != raw: ld_status = 'CHANGED ' + t; issues.append((url, 'jsonld changed', t))
    cov, miss = coverage(b['text'], d['text'])
    if cov < 0.97: issues.append((url, f'body text coverage {cov:.0%}', ' | '.join(m[:90] for m in miss[:6])))
    lost_links = [l for l in b['links_internal'] if l not in d['links_internal'] and not l.startswith('/#')]
    if lost_links: issues.append((url, 'internal links no longer in main content', ', '.join(lost_links)))
    sm_b = 'https://rentouleprojects.com' + url in B['sitemap']; sm_d = 'https://rentouleprojects.com' + url in D['sitemap']
    if sm_b != sm_d: issues.append((url, 'sitemap membership changed', f'{sm_b} -> {sm_d}'))
    rows.append((url, chk['title'], chk['description'], chk['canonical'], chk['robots'], chk['h1'], ld_status, f'{cov:.0%}', f"{b['words']}->{d['words']}"))

new_pages = sorted(set(dp) - set(bp))
with open(OUT, 'w') as f:
    f.write('| URL | Title | Description | Canonical | Robots | H1 | JSON-LD | Body text kept | Words |\n|---|---|---|---|---|---|---|---|---|\n')
    for r in rows: f.write('| ' + ' | '.join(r) + ' |\n')
    f.write('\n## Issues\n')
    for u, k, v in issues: f.write(f'- `{u}` **{k}**: {v}\n')
    f.write('\n## New pages\n' + ''.join(f"- `{u}` robots={dp[u]['robots']} canonical={dp[u]['canonical']}\n" for u in new_pages))
    rb = B['robots'].strip().splitlines(); rd = D['robots'].strip().splitlines()
    f.write('\n## robots.txt\n' + ('unchanged\n' if rb == rd else f'baseline: {rb}\ndev: {rd}\n'))
    f.write(f"\n## Sitemap\nbaseline {len(B['sitemap'])} URLs, dev {len(D['sitemap'])}; removed: {sorted(set(B['sitemap'])-set(D['sitemap']))}; added: {sorted(set(D['sitemap'])-set(B['sitemap']))}\n")
print(f'{len(rows)} baseline pages compared, {len(issues)} issues, {len(new_pages)} new pages -> {OUT}')
