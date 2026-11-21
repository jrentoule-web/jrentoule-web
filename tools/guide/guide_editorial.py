"""Rebuild the Canberra Renovation Guide as one consistent editorial layout.
Reads the guide source (tools/guide/guide-source.src), keeps every word, heading, id, link and the whole
<head>, and re-renders the main content with a small set of components. Run from the repo root: python3 tools/guide/guide_editorial.py && python3 tools/rp_build.py
The output must match canberra-renovation-guide/index.html byte for byte before any new change is made.
Edit the guide through this source and generator, not directly on the page, so a rebuild never undoes a change."""
import pathlib, re
from html.parser import HTMLParser

S = pathlib.Path(__file__).resolve().parent
R = S.parent.parent
SRC = (S / 'guide-source.src').read_text()
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

# ---------------------------------------------------------------- tiny DOM
VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr'}
class Node:
    def __init__(self, tag, attrs, raw):
        self.tag, self.attrs, self.raw, self.kids = tag, dict(attrs), raw, []
    def cls(self): return self.attrs.get('class', '') or ''
    def has(self, c): return c in self.cls().split()
    def html(self):
        if self.tag is None: return self.raw
        inner = ''.join(k.html() for k in self.kids)
        return self.raw if self.tag in VOID else f'{self.raw}{inner}</{self.tag}>'
    def inner(self): return ''.join(k.html() for k in self.kids)
    def els(self): return [k for k in self.kids if k.tag]
    def find(self, pred):
        for k in self.els():
            if pred(k): return k
            f = k.find(pred)
            if f: return f
    def text(self): return re.sub(r'<[^>]+>', '', self.inner())

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.root = Node('root', [], ''); self.stack = [self.root]
    def handle_starttag(self, t, a):
        n = Node(t, a, self.get_starttag_text()); self.stack[-1].kids.append(n)
        if t not in VOID: self.stack.append(n)
    def handle_startendtag(self, t, a):
        self.stack[-1].kids.append(Node(t, a, self.get_starttag_text()))
    def handle_endtag(self, t):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == t: del self.stack[i:]; return
    def _t(self, s): n = Node(None, [], s); self.stack[-1].kids.append(n)
    def handle_data(self, d): self._t(d)
    def handle_entityref(self, n): self._t(f'&{n};')
    def handle_charref(self, n): self._t(f'&#{n};')
    def handle_comment(self, d): self._t(f'<!--{d}-->')

def parse(h): p = P(); p.feed(h); return p.root

main_html = SRC[SRC.index('<main'):SRC.index('</main>') + len('</main>')]
main = parse(main_html).els()[0]
before_main, after_main = SRC[:SRC.index('<main')], SRC[SRC.index('</main>') + len('</main>'):]

# ---------------------------------------------------------------- pieces from the current page
cover = main.find(lambda n: n.has('gcover'))
label = cover.find(lambda n: n.has('label')).inner()
h1 = cover.find(lambda n: n.tag == 'h1')
lead = cover.find(lambda n: n.has('lead')).inner()
meta = cover.find(lambda n: n.has('gcover__meta')).html()
intro = main.find(lambda n: n.has('gintro'))
by = intro.find(lambda n: n.has('gintro__by'))
by_txt = re.sub(r'^<img[^>]*>', '', by.inner())
intro_ps = [p for p in intro.find(lambda n: n.has('gintro__text')).els() if p.tag == 'p']
toc = [(a.attrs['href'][1:], a.inner()) for a in main.find(lambda n: n.tag == 'aside' and n.has('gtoc')).find(lambda n: n.tag == 'ol').els() for a in [a.els()[0]]]
rail_cta = main.find(lambda n: n.has('gtoc__cta')).inner()
chapters = [n for n in main.find(lambda n: n.has('gbody')).els() if n.has('gch')]
assert len(chapters) == 10
endmatter = main.find(lambda n: n.has('endmatter'))
cta = main.find(lambda n: n.tag == 'section' and n.has('cta'))

# ---------------------------------------------------------------- components
def note(label_html, body_html):
    return f'<aside class="ed-note"><p class="ed-note__label">{label_html}</p><div class="ed-note__body">{body_html}</div></aside>'

def entry(h3, meta_html, body_nodes_html):
    m = f'<p class="ed-entry__meta">{meta_html}</p>' if meta_html else ''
    return f'<div class="ed-entry">{h3}{m}{body_nodes_html}</div>'

def entries(items):
    return '<div class="ed-entries">' + ''.join(items) + '</div>'

def is_plain_number(t): return re.fullmatch(r'\s*0?\d+\s*', t or '') is not None

def card_to_entry(card):
    tag = card.find(lambda n: n.has('gcard__tag'))
    h3 = card.find(lambda n: n.tag == 'h3')
    body = ''.join(k.html() for k in card.els() if k is not tag and k is not h3)
    meta_html = None if (tag is None or is_plain_number(tag.text())) else tag.inner()
    # cards that restated their own heading in bold ("<strong>Exempt development:</strong> ...") drop the repeat
    body = re.sub(r'<p><strong>([^<]+):</strong>\s*', lambda m: '<p>' if m.group(1).strip() == h3.text().strip() else m.group(0), body)
    return entry(h3.html(), meta_html, body)

WIDE_SRCSET = {'next-steps'}
PHOTOS = {
    'real-cost': ('kitchen-island-black-1600.jpg', 1600, 1067, 'Waterfall stone island in a Weetangera kitchen renovation by Rentoule Projects',
                  'A full kitchen renovation in Weetangera. Layout, joinery and stone drive most of the difference in kitchen cost.'),
    'planning': ('site-consult-bw.jpg', 1200, 1800, 'Two Rentoule Projects team members crouched on site talking through details on a tablet',
                 'Talking through the details on site. The decisions that save money are made before the next stage starts.'),
    'hidden-costs': ('campbell-hallway.jpg', 2400, 1350, 'Light-filled hallway with new timber floorboards and a hydronic heating panel in a Campbell renovation',
                     'A renovated hallway in Campbell. Heating, wiring and plumbing upgrades are where hidden costs most often surface.'),
    'timeline': ('site-team-insulation.jpg', 1800, 1200, 'Three Rentoule Projects team members checking a tablet in a framed and insulated room on site',
                 'Checking the programme on site. Construction is only the final stage of the timeline.'),
    'builder': ('site-walk.jpg', 1200, 1800, 'Two Rentoule Projects team members walking and talking on a verandah during a renovation',
                'On site during a renovation. Ask any builder who will be on your site day to day.'),
    'design': ('holder-skylight-wide.jpg', 2600, 1733, 'Skylights and exposed timber beams bringing daylight into a Holder living area',
               'Skylights added in a Holder renovation bring daylight deep into the living area.'),
    'approvals': ('site-lining.jpg', 1200, 1800, 'A Rentoule Projects carpenter fitting timber lining boards between insulated wall frames',
                  'Insulation in place and timber linings going up. What goes inside the walls is shaped by the building rules as much as the design.'),
    'mistakes': ('site-marking-out.jpg', 1800, 1200, 'Close-up of a carpenter marking out timber with a pencil and steel square',
                 'Marking out on site. Details settled early cost far less than details decided mid-build.'),
    'next-steps': ('griffith-bathroom.jpg', 3000, 2000, 'Griffith main bathroom with green tile, brass tapware and twin black-framed mirrors',
                   'A finished main bathroom in Griffith.'),
}

def cost_table(t):
    rows = []
    for tr in t.find(lambda n: n.tag == 'tbody').els():
        th = tr.find(lambda n: n.tag == 'th'); tds = [d for d in tr.els() if d.tag == 'td' and not d.has('bar')]
        rows.append(f'<tr>{th.html()}<td class="ed-num">{tds[0].inner()}</td><td>{tds[1].inner()}</td></tr>')
    cap = t.find(lambda n: n.tag == 'caption').inner()
    return (f'<div class="ed-table"><table><caption>{cap}</caption><thead><tr><th scope="col">Project type</th><th scope="col">Typical Canberra range</th>'
            f'<th scope="col">What you get</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div>')

def time_table(t):
    rows = []
    for tr in t.find(lambda n: n.tag == 'tbody').els():
        th = tr.find(lambda n: n.tag == 'th'); tds = [d for d in tr.els() if d.tag == 'td']
        site, total = tds[0].inner(), tds[1].inner()
        tl = tds[2].find(lambda n: n.has('gtl'))
        tot = tl.find(lambda n: n.has('gtl__total')).attrs['style']; st = tl.find(lambda n: n.has('gtl__site')).attrs['style']
        hi = float(re.search(r'--hi:([\d.]+)%', tot).group(1)); r = float(re.search(r'--r:([\d.]+)%', tot).group(1))
        s_ = float(re.search(r'--s:([\d.]+)%', st).group(1)); e_ = float(re.search(r'--e:([\d.]+)%', st).group(1))
        lo = hi * r / 100                     # shortest total
        bar = (f'<span class="ed-bar" aria-hidden="true"><i class="ed-bar__total" style="width:{lo:.1f}%"></i>'
               f'<i class="ed-bar__range" style="left:{lo:.1f}%;width:{hi - lo:.1f}%"></i>'
               f'<i class="ed-bar__site" style="left:{s_:.1f}%;right:{e_:.1f}%"></i></span>')
        rows.append(f'<tr>{th.html()}<td class="ed-num">{site}</td><td class="ed-num">{total}</td><td class="ed-barcell">{bar}</td></tr>')
    cap = t.find(lambda n: n.tag == 'caption').inner()
    return (f'<div class="ed-table ed-table--time"><table><caption>{cap}</caption><thead><tr><th scope="col">Project type</th>'
            f'<th scope="col">Realistic on-site duration</th><th scope="col">Total elapsed time including planning &amp; approvals</th>'
            f'<th scope="col" class="ed-barcell"><span class="ed-axis"><span>0</span><span>10</span><span>20</span><span>30 months</span></span></th></tr></thead>'
            f'<tbody>{"".join(rows)}</tbody></table>'
            f'<p class="ed-legend"><span><i class="ed-key ed-key--total"></i>Whole project, planning to handover</span><span><i class="ed-key ed-key--site"></i>Construction on site</span></p></div>')

def render_chapter(i, ch):
    cid = ch.attrs['id']
    op = ch.find(lambda n: n.has('gch__open'))
    h2 = op.find(lambda n: n.tag == 'h2').html()
    summ = op.find(lambda n: n.has('gch__sum')).inner()
    summ = re.sub(r'^<b>In this chapter</b>', '', summ).strip()
    out = [f'<section class="ed-ch gch" id="{cid}" aria-labelledby="{ch.attrs["aria-labelledby"]}">',
           f'<header class="ed-ch__open"><p class="ed-label">Chapter {i:02d}</p>{h2}<p class="ed-standfirst">{summ}</p></header>']
    for b in ch.els():
        if b is op: continue
        c = b.cls()
        if b.has('gprose') and b.has('gtwo'):
            items = []
            for col in b.els():
                h3 = col.find(lambda n: n.tag == 'h3'); rest = ''.join(k.html() for k in col.els() if k is not h3)
                items.append(entry(h3.html(), None, rest))
            out.append(entries(items))
        elif b.tag == 'ol' and b.has('gsteps'):
            items = []
            for li in b.els():
                d = li.els()[0]; h3 = d.find(lambda n: n.tag == 'h3')
                items.append(entry(h3.html(), None, ''.join(k.html() for k in d.els() if k is not h3)))
            out.append(entries(items))
        elif b.has('gprose'):
            out.append(f'<div class="ed-prose">{b.inner()}</div>')
        elif b.tag == 'table' and b.has('grange--cost'):
            out.append(cost_table(b))
        elif b.tag == 'table' and b.has('grange--time'):
            out.append(time_table(b))
        elif b.has('glegend'):
            continue                                  # replaced by the simpler legend inside the table block
        elif b.has('gnote'):
            lab = b.find(lambda n: n.tag == 'b')
            body = b.inner().replace(lab.html(), '', 1).strip()
            out.append(note(lab.inner().rstrip('.'), f'<p>{body}</p>'))
        elif b.has('gcards'):
            out.append(entries([card_to_entry(c) for c in b.els()]))
        elif b.has('gstages'):
            out.append(entries([entry(s.find(lambda n: n.tag == 'h3').html(), None,
                                      ''.join(k.html() for k in s.els() if k.tag != 'h3')) for s in b.els()]))
        elif b.has('minicta'):
            h3 = b.find(lambda n: n.tag == 'h3'); p = b.find(lambda n: n.tag == 'p')
            out.append(f'<aside class="ed-note ed-note--cta"><p class="ed-note__label">{h3.text()}</p><div class="ed-note__body">'
                       f'<p>{p.inner()} <a href="/contact/" class="ed-link">Get in touch {ARROW}</a></p></div></aside>')
        elif b.has('gpull'):
            out.append(f'<blockquote class="ed-pull"><p>{b.inner()}</p></blockquote>')
        elif b.has('gend'):
            lab = b.find(lambda n: n.tag == 'b')
            out.append(note(lab.inner(), f'<p>{b.inner().replace(lab.html(), "", 1).strip()}</p>'))
        elif b.has('gfig'):
            continue                                  # illustrative images are replaced by real project photos below
        else:
            raise SystemExit(f'unhandled block in {cid}: <{b.tag} class="{c}">')
    if cid in PHOTOS:
        f, w, h, alt, cap = PHOTOS[cid]
        small = f.replace('.jpg', '-1200.jpg')
        ss = f' srcset="/assets/{small} 1200w, /assets/{f} {w}w" sizes="(max-width: 760px) 100vw, 680px"' if (R / 'assets' / small).exists() else ''
        if cid in WIDE_SRCSET:                        # approved live markup: adds the 1600 variant and half-width sizes
            mid = f.replace('.jpg', '-1600.jpg')
            ss = f' srcset="/assets/{small} 1200w, /assets/{mid} 1600w, /assets/{f} {w}w" sizes="(max-width: 900px) 100vw, 50vw"'
        out.append(f'<figure class="ed-fig{" ed-fig--tall" if h > w else ""}"><img src="/assets/{f}"{ss} alt="{alt}" width="{w}" height="{h}" loading="lazy"><figcaption>{cap}</figcaption></figure>')
    if i < 10:
        nid, ntitle = toc[i]
        out.append(f'<a class="ed-next" href="#{nid}"><span class="ed-label">Next &middot; Chapter {i + 1:02d}</span><span class="ed-next__t">{ntitle}</span>{ARROW}</a>')
    out.append('</section>')
    return '\n'.join(out)

toc_li = ''.join(f'<li><a href="#{cid}"><span class="ed-toc__n">{i:02d}</span><span>{t}</span></a></li>' for i, (cid, t) in enumerate(toc, 1))
related = ''.join(
    f'<li><a href="{a.attrs["href"]}"><span class="ed-label">{a.find(lambda n: n.has("related-card__eyebrow")).inner()}</span>'
    f'<span class="ed-related__t">{a.find(lambda n: n.has("related-card__title")).inner()}</span>'
    f'<span class="ed-related__d">{a.find(lambda n: n.has("related-card__text")).inner()}</span></a></li>'
    for a in endmatter.find(lambda n: n.has('related-grid')).els())
price_note = intro_ps[-1]
pn_label = price_note.find(lambda n: n.tag == 'b')

new_main = f'''<main id="main" tabindex="-1" class="ed">

    <section class="ed-cover" aria-labelledby="guide-h">
      <img src="/assets/holder-beams-wide.jpg" alt="" width="2400" height="1600" fetchpriority="high">
      <div class="wrap ed-cover__in">
        <p class="ed-label">{label}</p>
        {h1.html()}
        <p class="ed-cover__lead">{lead}</p>
        <div class="btn-row">
          <a href="#real-cost" class="btn btn--gold">Start reading {ARROW}</a>
        </div>
        {meta.replace('class="gcover__meta"', 'class="ed-cover__meta"')}
      </div>
    </section>

    <div class="ed-mbar gmobile" id="contents">
      <button type="button" id="gsheetOpen" aria-expanded="false" aria-controls="gsheet"><span class="ed-mbar__now" id="gmobileLabel">Contents</span><span class="ed-mbar__all">All chapters</span></button>
      <div class="gmobile__bar"></div>
    </div>
    <div class="gscrim" id="gscrim"></div>
    <div class="gsheet ed-sheet" id="gsheet" role="dialog" aria-modal="true" aria-label="Guide contents">
      <div class="gsheet__head"><p class="ed-label" style="margin:0">In this guide</p><button type="button" id="gsheetClose" aria-label="Close contents">&times;</button></div>
      <nav class="gtoc ed-toc" aria-label="Guide chapters (mobile)"><ol>{toc_li}</ol></nav>
    </div>

    <div class="ed-layout">
      <aside class="ed-rail" aria-label="Guide contents">
        <h2 class="ed-label">In this guide</h2>
        <nav class="gtoc ed-toc" aria-label="Guide chapters"><ol>{toc_li}</ol></nav>
        <div class="ed-rail__meter gtoc__meter" aria-hidden="true"><i></i></div>
        <p class="ed-rail__cta">{rail_cta.replace('<br>', ' ').replace('<a href="/contact/">', '<a href="/contact/" class="ed-link">')}</p>
      </aside>

      <article class="gbody ed-body">
        <section class="ed-intro" aria-label="Introduction">
          <p class="ed-byline"><img src="/assets/logo-monogram-gold.png" alt="" width="200" height="200"><span>{by_txt}</span></p>
          <div class="ed-prose ed-prose--intro">{''.join(p.html() for p in intro_ps[:-1])}</div>
          {note(pn_label.inner(), f'<p>{price_note.inner().replace(pn_label.html(), "", 1).strip()}</p>')}
        </section>

{chr(10).join(render_chapter(i, ch) for i, ch in enumerate(chapters, 1))}

        <section class="ed-related" aria-labelledby="related-h">
          <p class="ed-label">Go deeper</p>
          <h2 id="related-h">Related reading</h2>
          <ul>{related}</ul>
        </section>
      </article>
    </div>

{cta.html()}
  </main>'''

head = before_main.replace('</head>', '  <link rel="stylesheet" href="/assets/css/guide.css">\n</head>', 1) if 'guide.css' not in before_main else before_main
tail = re.sub(r'\s*<a href="/contact/" class="gsticky".*?</a>', '', after_main, count=1, flags=re.S)
(R / 'canberra-renovation-guide' / 'index.html').write_text(head + new_main + tail)
print('guide rebuilt')
