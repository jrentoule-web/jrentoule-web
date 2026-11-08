#!/usr/bin/env python3
"""Simulate Netlify static serving + redirect rules for a site tree.
Rules: evaluated top to bottom, first match wins; a non-forced rule is skipped when a
file exists at the requested path (shadowing); '*' splat matches any suffix.
usage: redirsim.py <prod_root> <dev_root> <out.md>"""
import re, sys, pathlib
P, D, OUT = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]

def rules(root):
    t = (root / 'netlify.toml').read_text(); out = []
    for blk in re.findall(r'\[\[redirects\]\]\n((?:  [^\n]*\n?)+)', t):
        r = dict(re.findall(r'(\w+) = "?([^"\n]*)"?', blk))
        out.append((r['from'], r['to'], int(r.get('status', 301)), r.get('force') == 'true'))
    return out

def exists(root, path):
    path = path.split('#')[0].split('?')[0]
    f = root / path.lstrip('/')
    if path.endswith('/'): f = f / 'index.html'
    return f.is_file()

def resolve(root, path, depth=0):
    """returns (final_path, status_chain)"""
    if depth > 5: return (path, ['LOOP'])
    for frm, to, st, force in rules(root):
        if frm.endswith('*'):
            if not path.startswith(frm[:-1]): continue
        elif path != frm and path.rstrip('/') != frm.rstrip('/'):
            continue
        if exists(root, path) and not force: continue
        if st == 404: return (path, ['404 (rule)'])
        if st in (301, 302):
            nxt = to.split('?')[0]
            fin, chain = resolve(root, nxt.split('#')[0] if nxt.split('#')[0] else '/', depth + 1)
            return (to if not chain or chain == ['200'] else fin, [str(st)] + chain)
        return (path, [str(st)])
    return (path, ['200'] if exists(root, path) else ['404'])

prod_pages = ['/' + f.relative_to(P).as_posix().replace('index.html', '') for f in P.rglob('*.html') if not f.relative_to(P).as_posix().startswith(('.git', 'tools'))]
sources = sorted({r[0] for r in rules(P)})
rows, problems = [], []
for path in sorted(set(prod_pages)) + sources:
    test = path.replace('*', 'example/') if '*' in path else path
    pf, pc = resolve(P, test); df, dc = resolve(D, test)
    kind = 'page' if path in prod_pages else 'redirect source'
    status = 'ok'
    if dc[-1].startswith('404') and not pc[-1].startswith('404'): status = 'BROKEN'
    elif len(dc) > 2: status = 'CHAIN'
    elif kind == 'page' and dc != ['200'] and pc == ['200']: status = 'CHANGED URL'
    elif df.split('#')[0] == '/' and pf.split('#')[0] != '/': status = 'NEW HOMEPAGE REDIRECT'
    if status != 'ok': problems.append((path, status))
    rows.append(f"| `{path}` | {kind} | {' > '.join(pc)} `{pf}` | {' > '.join(dc)} `{df}` | {status} |")
with open(OUT, 'w') as f:
    f.write('| URL | Type | Production | Development | Result |\n|---|---|---|---|---|\n' + '\n'.join(rows) + '\n')
    f.write('\n**Problems:** ' + (', '.join(f'`{p}` {s}' for p, s in problems) if problems else 'none') + '\n')
print(len(rows), 'URLs simulated;', len(problems), 'problems', problems)
