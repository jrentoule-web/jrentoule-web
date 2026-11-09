# SEO Preservation and Regression Report: Website Refresh

Prepared 8 November 2026 on branch `claude/focused-maxwell-1b81lz` (draft PR #1). **Status: not merged. Production unchanged.**

## Method and baseline
- **Production baseline:** commit `1186494` on `main`. Netlify confirms this is the commit behind the current production deploy (`6af046b4`). The site has no build step, so these files are exactly what rentouleprojects.com serves.
- **Live crawl:** not possible from this environment, because rentouleprojects.com is not reachable from the sandbox. The deployed commit was inventoried instead. Re-check the live site at launch, for example with Screaming Frog or a browser.
- **What the inventory captures** (`tools/seo/inventory.py`), for every page: URL, title, meta description, keywords, canonical, robots tag, Open Graph tags, H1 to H3, JSON-LD (types and full content), internal links, word count and body text. It also captures sitemap URLs, robots.txt and all 62 Netlify redirects. The baseline is saved in `tools/seo/baseline-production-1186494.json`.
- **Comparison** (`tools/seo/compare.py`): each production page is checked field by field against the development build. Body text is compared sentence by sentence.
- **Redirects** (`tools/seo/redirsim.py`): every production page URL and every redirect source is resolved under Netlify's rules (first match wins, a non-forced rule is shadowed by an existing file, splats). This is done for both production and development.
- **Google Search Console:** not available. No Search Console or Analytics connection exists in this environment, so no clicks, impressions, rankings or queries are assumed anywhere in this report.

## Production baseline summary
- 34 HTML pages. **30 are indexable and all 30 are in the sitemap:** the home page, the Canberra Renovation Guide, 25 articles and 3 service landing pages.
- **Excluded by design:** `/how-we-work/`, `/success-consult/` and `/internal/` (noindex, and disallowed in robots.txt).
- 62 redirects, mostly legacy WordPress paths and campaign short links.

## URLs that must not change (all preserved)
- `/canberra-renovation-guide/`
- all 25 `/blog/<slug>/` articles
- `/services/dual-occupancy-canberra/`, `/services/knockdown-rebuild-canberra/` and `/services/mr-fluffy-block-rebuild/`
- `/`

## Preservation checklist
| # | Check | Result |
|---|---|---|
| 1 | Every production URL still serves 200 at the same address | **Pass** (34/34) |
| 2 | Title tags unchanged on indexable pages | **Pass** (30/30) |
| 3 | Meta descriptions unchanged on indexable pages | **Pass** (30/30) |
| 4 | Canonical tags unchanged and self-referencing | **Pass** (33/33; success page has none, as in production) |
| 5 | Robots meta unchanged, with no accidental noindex | **Pass** (34/34 identical) |
| 6 | robots.txt unchanged | **Pass** (byte-identical) |
| 7 | Every production sitemap URL still listed | **Pass** (30/30; 6 new pages added) |
| 8 | JSON-LD structured data unchanged (Article, BreadcrumbList, FAQPage, Service, HomeAndConstructionBusiness) | **Pass** on all indexable pages |
| 9 | H1 unchanged | **Pass** on 29/30 indexable pages; home page see R1 |
| 10 | Article, guide and service body text preserved | **Pass**: 98 to 100% of sentences match exactly; the remaining fragments are byline and card-label formatting only |
| 11 | Article and guide headings (H2/H3) preserved | **Pass** (including original CTA headings) |
| 12 | Meta keywords and Open Graph tags preserved | **Pass** on indexable pages |
| 13 | Internal links from articles preserved | **Pass**; one pre-existing broken link was fixed and redirected |
| 14 | Home page internal links to every article and service page preserved | **Pass**, via the article index section |
| 15 | Every legacy redirect still resolves to a live page in one hop, with no chains | **Pass** (62/62) |
| 16 | No new redirects to the home page | **Pass** (22 hash-view redirects now go one-to-one to the matching page instead) |
| 17 | Development preview not indexable | **Pass**: a preview-only `X-Robots-Tag: noindex, nofollow` header, set by a build command that runs only for deploy previews and branch deploys; production has no build command |
| 18 | Forms, HubSpot, attribution, Meta Pixel and Clarity unchanged | **Pass** |

## Per-URL results
| URL | Title | Description | Canonical | Robots | H1 | JSON-LD | Body text kept | Words |
|---|---|---|---|---|---|---|---|---|
| / | same | same | same | same | CHANGED | same | 29% | 5173->2070 |
| /blog/act-missing-middle-housing-reform-mpa04/ | same | same | same | same | same | same | 99% | 6632->6651 |
| /blog/act-property-developer-licence-2026/ | same | same | same | same | same | same | 98% | 2041->2063 |
| /blog/bathroom-renovation-costs-canberra/ | same | same | same | same | same | same | 99% | 4160->4174 |
| /blog/best-suburbs-renovation-roi-canberra/ | same | same | same | same | same | same | 98% | 2604->2618 |
| /blog/canberra-construction-costs-up-40-percent-2026/ | same | same | same | same | same | same | 98% | 2586->2610 |
| /blog/choosing-right-builder-canberra/ | same | same | same | same | same | same | 99% | 3092->3113 |
| /blog/da-approval-act-renovations/ | same | same | same | same | same | same | 99% | 3133->3151 |
| /blog/energy-efficiency-eer-canberra/ | same | same | same | same | same | same | 98% | 1884->1902 |
| /blog/extension-vs-renovation-canberra/ | same | same | same | same | same | same | 98% | 2356->2373 |
| /blog/federal-budget-2026-canberra-renovations/ | same | same | same | same | same | same | 98% | 2293->2310 |
| /blog/fireplaces-wood-heaters-canberra/ | same | same | same | same | same | same | 98% | 2509->2525 |
| /blog/full-house-renovation-canberra/ | same | same | same | same | same | same | 99% | 2900->2917 |
| /blog/home-extension-costs-canberra/ | same | same | same | same | same | same | 99% | 3075->3093 |
| /blog/home-renovation-costs-canberra/ | same | same | same | same | same | same | 98% | 2938->2956 |
| /blog/how-to-plan-renovation-canberra/ | same | same | same | same | same | same | 98% | 2275->2291 |
| /blog/kitchen-renovation-costs-canberra/ | same | same | same | same | same | same | 99% | 3723->3738 |
| /blog/middle-east-conflict-construction-costs-australia/ | same | same | same | same | same | same | 100% | 16735->16752 |
| /blog/missing-middle-explained-canberra/ | same | same | same | same | same | same | 98% | 2294->2312 |
| /blog/ncc-2025-canberra-renovations/ | same | same | same | same | same | same | 98% | 2168->2185 |
| /blog/nsw-approval-pathways-da-cdc-cc-2026/ | same | same | same | same | same | same | 99% | 2900->2949 |
| /blog/renovate-extend-rebuild-or-move-canberra/ | same | same | same | same | same | same | 99% | 3153->3171 |
| /blog/renovation-hidden-costs-canberra/ | same | same | same | same | same | same | 98% | 2745->2760 |
| /blog/rz1-design-options-mpa04-canberra/ | same | same | same | same | same | same | 99% | 2792->2842 |
| /blog/second-storey-extensions-canberra/ | same | same | same | same | same | same | 98% | 2154->2174 |
| /blog/tree-protection-canberra-act/ | same | same | same | same | same | same | 99% | 2545->2598 |
| /canberra-renovation-guide/ | same | same | same | same | same | same | 91% | 4037->4515 |
| /how-we-work/ | CHANGED | CHANGED | same | same | CHANGED | CHANGED Article | 0% | 3344->2001 |
| /internal/ | same | same | same | same | same | same | 100% | 279->279 |
| /internal/daily-site-rhythm/ | same | same | same | same | same | same | 100% | 677->677 |
| /services/dual-occupancy-canberra/ | same | same | same | same | same | same | 99% | 3578->3588 |
| /services/knockdown-rebuild-canberra/ | same | same | same | same | same | same | 99% | 2232->2242 |
| /services/mr-fluffy-block-rebuild/ | same | same | same | same | same | same | 99% | 2187->2195 |
| /success-consult/ | same | same | same | same | same | same | 100% | 335->374 |


## Redirect simulation (production vs development)
| URL | Type | Production | Development | Result |
|---|---|---|---|---|
| `/` | page | 200 `/` | 200 `/` | ok |
| `/blog/act-missing-middle-housing-reform-mpa04/` | page | 200 `/blog/act-missing-middle-housing-reform-mpa04/` | 200 `/blog/act-missing-middle-housing-reform-mpa04/` | ok |
| `/blog/act-property-developer-licence-2026/` | page | 200 `/blog/act-property-developer-licence-2026/` | 200 `/blog/act-property-developer-licence-2026/` | ok |
| `/blog/bathroom-renovation-costs-canberra/` | page | 200 `/blog/bathroom-renovation-costs-canberra/` | 200 `/blog/bathroom-renovation-costs-canberra/` | ok |
| `/blog/best-suburbs-renovation-roi-canberra/` | page | 200 `/blog/best-suburbs-renovation-roi-canberra/` | 200 `/blog/best-suburbs-renovation-roi-canberra/` | ok |
| `/blog/canberra-construction-costs-up-40-percent-2026/` | page | 200 `/blog/canberra-construction-costs-up-40-percent-2026/` | 200 `/blog/canberra-construction-costs-up-40-percent-2026/` | ok |
| `/blog/choosing-right-builder-canberra/` | page | 200 `/blog/choosing-right-builder-canberra/` | 200 `/blog/choosing-right-builder-canberra/` | ok |
| `/blog/da-approval-act-renovations/` | page | 200 `/blog/da-approval-act-renovations/` | 200 `/blog/da-approval-act-renovations/` | ok |
| `/blog/energy-efficiency-eer-canberra/` | page | 200 `/blog/energy-efficiency-eer-canberra/` | 200 `/blog/energy-efficiency-eer-canberra/` | ok |
| `/blog/extension-vs-renovation-canberra/` | page | 200 `/blog/extension-vs-renovation-canberra/` | 200 `/blog/extension-vs-renovation-canberra/` | ok |
| `/blog/federal-budget-2026-canberra-renovations/` | page | 200 `/blog/federal-budget-2026-canberra-renovations/` | 200 `/blog/federal-budget-2026-canberra-renovations/` | ok |
| `/blog/fireplaces-wood-heaters-canberra/` | page | 200 `/blog/fireplaces-wood-heaters-canberra/` | 200 `/blog/fireplaces-wood-heaters-canberra/` | ok |
| `/blog/full-house-renovation-canberra/` | page | 200 `/blog/full-house-renovation-canberra/` | 200 `/blog/full-house-renovation-canberra/` | ok |
| `/blog/home-extension-costs-canberra/` | page | 200 `/blog/home-extension-costs-canberra/` | 200 `/blog/home-extension-costs-canberra/` | ok |
| `/blog/home-renovation-costs-canberra/` | page | 200 `/blog/home-renovation-costs-canberra/` | 200 `/blog/home-renovation-costs-canberra/` | ok |
| `/blog/how-to-plan-renovation-canberra/` | page | 200 `/blog/how-to-plan-renovation-canberra/` | 200 `/blog/how-to-plan-renovation-canberra/` | ok |
| `/blog/kitchen-renovation-costs-canberra/` | page | 200 `/blog/kitchen-renovation-costs-canberra/` | 200 `/blog/kitchen-renovation-costs-canberra/` | ok |
| `/blog/middle-east-conflict-construction-costs-australia/` | page | 200 `/blog/middle-east-conflict-construction-costs-australia/` | 200 `/blog/middle-east-conflict-construction-costs-australia/` | ok |
| `/blog/missing-middle-explained-canberra/` | page | 200 `/blog/missing-middle-explained-canberra/` | 200 `/blog/missing-middle-explained-canberra/` | ok |
| `/blog/ncc-2025-canberra-renovations/` | page | 200 `/blog/ncc-2025-canberra-renovations/` | 200 `/blog/ncc-2025-canberra-renovations/` | ok |
| `/blog/nsw-approval-pathways-da-cdc-cc-2026/` | page | 200 `/blog/nsw-approval-pathways-da-cdc-cc-2026/` | 200 `/blog/nsw-approval-pathways-da-cdc-cc-2026/` | ok |
| `/blog/renovate-extend-rebuild-or-move-canberra/` | page | 200 `/blog/renovate-extend-rebuild-or-move-canberra/` | 200 `/blog/renovate-extend-rebuild-or-move-canberra/` | ok |
| `/blog/renovation-hidden-costs-canberra/` | page | 200 `/blog/renovation-hidden-costs-canberra/` | 200 `/blog/renovation-hidden-costs-canberra/` | ok |
| `/blog/rz1-design-options-mpa04-canberra/` | page | 200 `/blog/rz1-design-options-mpa04-canberra/` | 200 `/blog/rz1-design-options-mpa04-canberra/` | ok |
| `/blog/second-storey-extensions-canberra/` | page | 200 `/blog/second-storey-extensions-canberra/` | 200 `/blog/second-storey-extensions-canberra/` | ok |
| `/blog/tree-protection-canberra-act/` | page | 200 `/blog/tree-protection-canberra-act/` | 200 `/blog/tree-protection-canberra-act/` | ok |
| `/canberra-renovation-guide/` | page | 200 `/canberra-renovation-guide/` | 200 `/canberra-renovation-guide/` | ok |
| `/how-we-work/` | page | 200 `/how-we-work/` | 200 `/how-we-work/` | ok |
| `/internal/` | page | 200 `/internal/` | 200 `/internal/` | ok |
| `/internal/daily-site-rhythm/` | page | 200 `/internal/daily-site-rhythm/` | 200 `/internal/daily-site-rhythm/` | ok |
| `/services/dual-occupancy-canberra/` | page | 200 `/services/dual-occupancy-canberra/` | 200 `/services/dual-occupancy-canberra/` | ok |
| `/services/knockdown-rebuild-canberra/` | page | 200 `/services/knockdown-rebuild-canberra/` | 200 `/services/knockdown-rebuild-canberra/` | ok |
| `/services/mr-fluffy-block-rebuild/` | page | 200 `/services/mr-fluffy-block-rebuild/` | 200 `/services/mr-fluffy-block-rebuild/` | ok |
| `/success-consult/` | page | 200 `/success-consult/` | 200 `/success-consult/` | ok |
| `/about/` | redirect source | 301 > 200 `/#about` | 200 `/about/` | ok |
| `/bathroom-renovation-costs-canberra/` | redirect source | 301 > 200 `/blog/bathroom-renovation-costs-canberra/` | 301 > 200 `/blog/bathroom-renovation-costs-canberra/` | ok |
| `/best-suburbs-renovation-roi-canberra/` | redirect source | 301 > 200 `/blog/best-suburbs-renovation-roi-canberra/` | 301 > 200 `/blog/best-suburbs-renovation-roi-canberra/` | ok |
| `/blog/` | redirect source | 301 > 200 `/#blog` | 200 `/blog/` | ok |
| `/building-a-sustainable-future-in-australia/` | redirect source | 301 > 200 `/#blog` | 301 > 200 `/blog/` | ok |
| `/building-services-canberra/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/services/` | ok |
| `/card` | redirect source | 301 > 200 `/?utm_source=print&utm_medium=offline&utm_campaign=business_card` | 301 > 200 `/?utm_source=print&utm_medium=offline&utm_campaign=business_card` | ok |
| `/careers-available/` | redirect source | 301 > 200 `/#careers` | 301 > 200 `/careers/` | ok |
| `/careers/` | redirect source | 301 > 200 `/#careers` | 200 `/careers/` | ok |
| `/careers/*` | redirect source | 301 > 200 `/#careers` | 301 > 200 `/careers/` | ok |
| `/case-studies/` | redirect source | 301 > 200 `/#case-studies` | 301 > 200 `/projects/` | ok |
| `/choosing-right-builder-canberra/` | redirect source | 301 > 200 `/blog/choosing-right-builder-canberra/` | 301 > 200 `/blog/choosing-right-builder-canberra/` | ok |
| `/chris-weetangera/` | redirect source | 301 > 200 `/#case-studies` | 301 > 200 `/projects/#weetangera` | ok |
| `/contact/` | redirect source | 301 > 200 `/#contact` | 200 `/contact/` | ok |
| `/custom-home-builder-canberra/` | redirect source | 301 > 200 `/` | 301 > 200 `/services/#custom-homes` | ok |
| `/do-you-need-da-approval-renovations-act/` | redirect source | 301 > 200 `/blog/da-approval-act-renovations/` | 301 > 200 `/blog/da-approval-act-renovations/` | ok |
| `/email` | redirect source | 301 > 200 `/?utm_source=email&utm_medium=signature&utm_campaign=email_signature` | 301 > 200 `/?utm_source=email&utm_medium=signature&utm_campaign=email_signature` | ok |
| `/energy-efficiency-eer-canberra/` | redirect source | 301 > 200 `/blog/energy-efficiency-eer-canberra/` | 301 > 200 `/blog/energy-efficiency-eer-canberra/` | ok |
| `/extension-vs-renovation-canberra/` | redirect source | 301 > 200 `/blog/extension-vs-renovation-canberra/` | 301 > 200 `/blog/extension-vs-renovation-canberra/` | ok |
| `/facebook` | redirect source | 301 > 200 `/?utm_source=facebook&utm_medium=organic_social&utm_campaign=bio_link` | 301 > 200 `/?utm_source=facebook&utm_medium=organic_social&utm_campaign=bio_link` | ok |
| `/fb` | redirect source | 301 > 200 `/?utm_source=facebook&utm_medium=organic_social&utm_campaign=bio_link` | 301 > 200 `/?utm_source=facebook&utm_medium=organic_social&utm_campaign=bio_link` | ok |
| `/fixed-price-builder-canberra/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/how-we-work/` | ok |
| `/guide` | redirect source | 301 > 200 `/canberra-renovation-guide/?utm_source=shortlink&utm_medium=guide&utm_campaign=renovation_guide` | 301 > 200 `/canberra-renovation-guide/?utm_source=shortlink&utm_medium=guide&utm_campaign=renovation_guide` | ok |
| `/guide-ad` | redirect source | 301 > 200 `/canberra-renovation-guide/?utm_source=meta&utm_medium=paid_social&utm_campaign=renovation_guide_ebook&utm_content=ad_v1` | 301 > 200 `/canberra-renovation-guide/?utm_source=meta&utm_medium=paid_social&utm_campaign=renovation_guide_ebook&utm_content=ad_v1` | ok |
| `/home-2/` | redirect source | 301 > 200 `/` | 301 > 200 `/` | ok |
| `/home-extension-canberra/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/services/#extensions` | ok |
| `/home-extension-costs-canberra/` | redirect source | 301 > 200 `/blog/home-extension-costs-canberra/` | 301 > 200 `/blog/home-extension-costs-canberra/` | ok |
| `/home-renovation-costs-canberra/` | redirect source | 301 > 200 `/blog/home-renovation-costs-canberra/` | 301 > 200 `/blog/home-renovation-costs-canberra/` | ok |
| `/how-much-does-a-home-extension-cost-in-canberra-per-square-metre/` | redirect source | 301 > 200 `/blog/home-extension-costs-canberra/` | 301 > 200 `/blog/home-extension-costs-canberra/` | ok |
| `/how-to-plan-renovation-canberra/` | redirect source | 301 > 200 `/blog/how-to-plan-renovation-canberra/` | 301 > 200 `/blog/how-to-plan-renovation-canberra/` | ok |
| `/how-we-create-sustainable-homes-in-australia/` | redirect source | 301 > 200 `/#blog` | 301 > 200 `/blog/` | ok |
| `/insta` | redirect source | 301 > 200 `/?utm_source=instagram&utm_medium=organic_social&utm_campaign=bio_link` | 301 > 200 `/?utm_source=instagram&utm_medium=organic_social&utm_campaign=bio_link` | ok |
| `/instagram` | redirect source | 301 > 200 `/?utm_source=instagram&utm_medium=organic_social&utm_campaign=bio_link` | 301 > 200 `/?utm_source=instagram&utm_medium=organic_social&utm_campaign=bio_link` | ok |
| `/kitchen-renovation-costs-canberra/` | redirect source | 301 > 200 `/blog/kitchen-renovation-costs-canberra/` | 301 > 200 `/blog/kitchen-renovation-costs-canberra/` | ok |
| `/knockdown-rebuild-canberra/` | redirect source | 301 > 200 `/services/knockdown-rebuild-canberra/` | 301 > 200 `/services/knockdown-rebuild-canberra/` | ok |
| `/li` | redirect source | 301 > 200 `/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=bio_link` | 301 > 200 `/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=bio_link` | ok |
| `/linkedin` | redirect source | 301 > 200 `/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=bio_link` | 301 > 200 `/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=bio_link` | ok |
| `/locations/*` | redirect source | 301 > 200 `/` | 301 > 200 `/services/#areas` | ok |
| `/middle-east-conflict-construction-costs-australia/` | redirect source | 301 > 200 `/blog/middle-east-conflict-construction-costs-australia/` | 301 > 200 `/blog/middle-east-conflict-construction-costs-australia/` | ok |
| `/ncc-2025-canberra-renovations/` | redirect source | 301 > 200 `/blog/ncc-2025-canberra-renovations/` | 301 > 200 `/blog/ncc-2025-canberra-renovations/` | ok |
| `/project-1/` | redirect source | 301 > 200 `/#case-studies` | 301 > 200 `/projects/` | ok |
| `/project-2/` | redirect source | 301 > 200 `/#case-studies` | 301 > 200 `/projects/` | ok |
| `/qr` | redirect source | 301 > 200 `/?utm_source=print&utm_medium=offline&utm_campaign=trifold_2026` | 301 > 200 `/?utm_source=print&utm_medium=offline&utm_campaign=trifold_2026` | ok |
| `/renovation-builder-canberra/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/services/#renovations` | ok |
| `/renovation-guide` | redirect source | 301 > 200 `/canberra-renovation-guide/?utm_source=shortlink&utm_medium=guide&utm_campaign=renovation_guide` | 301 > 200 `/canberra-renovation-guide/?utm_source=shortlink&utm_medium=guide&utm_campaign=renovation_guide` | ok |
| `/renovation-hidden-costs-canberra/` | redirect source | 301 > 200 `/blog/renovation-hidden-costs-canberra/` | 301 > 200 `/blog/renovation-hidden-costs-canberra/` | ok |
| `/request-a-consult/` | redirect source | 301 > 200 `/#contact` | 301 > 200 `/contact/` | ok |
| `/second-storey-addition-canberra/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/blog/second-storey-extensions-canberra/` | ok |
| `/services/` | redirect source | 301 > 200 `/#services` | 200 `/services/` | ok |
| `/services/bathroom-renovations/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/services/#renovations` | ok |
| `/services/custom-homes/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/services/#custom-homes` | ok |
| `/services/extensions/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/services/#extensions` | ok |
| `/services/kitchen-renovations/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/services/#renovations` | ok |
| `/services/renovations/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/services/#renovations` | ok |
| `/services/single-storey-additions/` | redirect source | 301 > 200 `/#services` | 301 > 200 `/services/#extensions` | ok |
| `/sign` | redirect source | 301 > 200 `/?utm_source=print&utm_medium=offline&utm_campaign=site_signage` | 301 > 200 `/?utm_source=print&utm_medium=offline&utm_campaign=site_signage` | ok |
| `/thank-you/` | redirect source | 301 > 200 `/` | 301 > 200 `/` | ok |
| `/the-art-of-sustainable-design-in-australia/` | redirect source | 301 > 200 `/#blog` | 301 > 200 `/blog/` | ok |
| `/the-future-of-sustainable-architecture-in-australia/` | redirect source | 301 > 200 `/#blog` | 301 > 200 `/blog/` | ok |
| `/why-sustainability-matters-in-australian-construction/` | redirect source | 301 > 200 `/#blog` | 301 > 200 `/blog/` | ok |
| `/youtube` | redirect source | 301 > 200 `/?utm_source=youtube&utm_medium=organic_social&utm_campaign=bio_link` | 301 > 200 `/?utm_source=youtube&utm_medium=organic_social&utm_campaign=bio_link` | ok |
| `/yt` | redirect source | 301 > 200 `/?utm_source=youtube&utm_medium=organic_social&utm_campaign=bio_link` | 301 > 200 `/?utm_source=youtube&utm_medium=organic_social&utm_campaign=bio_link` | ok |

**Problems:** none


## Material SEO risks, flagged for decision (not resolved automatically)
- **R1. Home page consolidation (material).** In production, the home page URL contains the About, Services, Projects, Case Studies, Blog list, Careers and Contact views as hash sections: about 5,170 words and 8 H1s on one URL. The refresh moves that content to dedicated, crawlable pages (`/about/`, `/services/`, `/projects/`, `/blog/`, `/careers/`, `/contact/`). The home page keeps its production title, description, keywords, Open Graph tags, primary H1, both JSON-LD blocks and all of its own section copy verbatim (welcome, stats, guide promo, service cards, testimonials, the 12 cost-guide cards and the 5-question FAQ), plus links to every article and service page. Remaining risk: home-page rankings for terms that only appeared in the moved sections, such as the suburb list in the services view, may shift to the new pages. Without Search Console data this can't be quantified. **Decision needed:** approve the split, or keep the old single-page structure.
- **R2. How We Work.** It is noindex in production and remains noindex here, with robots.txt and the sitemap unchanged. Making it indexable at launch is recommended, but it is a separate decision. Its title, description and content differ from the old unpublished draft, which has no search impact while it's noindex.

## Recommended improvements (not implemented; approval needed)
1. Home page H1 "Crafting visions into reality" has no search terms. Consider "Premium renovations, extensions and custom homes in Canberra".
2. The home page FAQPage schema lists 3 questions, 2 of which aren't in the visible FAQ (this is the case in production too). Align the schema with the visible questions.
3. The home page `aggregateRating` (5 stars, 5 reviews) is self-served on the business itself, which Google treats as ineligible for review stars. Consider removing it or sourcing it properly.
4. The home page schema `url` is `https://www.rentouleprojects.com` while canonicals are non-www. Align them.
5. The guide has Article schema but no BreadcrumbList, which the articles have. Add one.
6. Remove `meta keywords` sitewide. They're ignored by Google, harmless, and kept for now.
7. Article hero images are now real `<img>` elements with empty alt text (they were CSS backgrounds before). Add descriptive alt text if image search matters.
8. `/thank-you/` still redirects to the home page, as in production. Consider `/success-consult/`.
9. Editorial updates flagged earlier (EER requirement, NCC 2025 cut-off date, price note "as of May 2026", the "4 to 8 weeks" PSA duration, the 12-month statutory defect claim) need separate approval before any wording changes.

## New pages added (indexable, in the sitemap)
`/about/`, `/services/`, `/projects/`, `/contact/`, `/careers/`, `/blog/`. Their titles and descriptions are new and should be reviewed. `/404.html` is noindex.

## Data still missing
- **Google Search Console** (last 16 months): clicks, impressions, CTR and position by page and by query; the top landing pages; Page Indexing (coverage) and Sitemaps status; Core Web Vitals.
- **Google Analytics or HubSpot:** organic landing-page sessions and conversions, to judge R1.
- **Backlinks:** the most-linked URLs. All existing URLs are preserved or redirected regardless.
- **Live crawl of production at launch:** confirms the deployed headers, redirects and canonicals behave as simulated.

## Re-running before launch
```
git worktree add /tmp/prod origin/main
python3 tools/seo/inventory.py /tmp/prod /tmp/base.json
python3 tools/seo/inventory.py . /tmp/dev.json
python3 tools/seo/compare.py /tmp/base.json /tmp/dev.json /tmp/regression.md
python3 tools/seo/redirsim.py /tmp/prod . /tmp/redirects.md
```

## Addendum: landing-page rollout (preview only)

Re-run after the homepage became the full-screen landing page and the rest of the site moved to the same look.

- **33 of 34 production pages: unchanged findings.** The 25 articles, 3 service landing pages, the Canberra Renovation Guide and the rest keep their URL, title, description, canonical, robots, H1, JSON-LD, headings, body text and internal links. Their changes are styling only (colours, page headers, calmer headings and guide layout).
- **Homepage:** same title, description, keywords, canonical, robots (index, follow), H1 and both JSON-LD blocks. Every internal link from the previous homepage is still present. Headings kept: more than the previous refresh (adds "Ready to start your project?", "What our clients say", "What might it cost?", "Start with the free guide", "What we stand for", "Our services", "Your project, our priority"). Body text: 26% of the production homepage's sentences are still present (previous refresh: 29%); the difference is mainly John's deck review and label text the tool reads as joined sentences. The production homepage was a ~5,200-word single page, so this is the one known, accepted change in exposure (R1).
- **Projects and About** were rebuilt; both are pages added in this refresh (not in production), keep their URLs and anchors (`#weetangera`, `#holder`, `#griffith`), and add `#weetangera-family-home`.
- **Comparison pages `/homepage-b/` and `/homepage-c/` were removed**; they were never linked, never in the sitemap and always noindex.
- **robots.txt:** unchanged. **Sitemap:** baseline 30 URLs plus the 6 refresh pages. **Redirects:** 96 production URLs and redirect sources simulated against this branch, 0 problems.
