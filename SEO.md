# Tarikh — SEO Reference & Migration Log

> **Purpose:** master reference for all on-page/technical SEO work on the Tarikh site.
> **Canonical origin (single source of truth):** `https://www.tarikh.tech`
> **Apex:** `tarikh.tech` 301s to `https://www.tarikh.tech` (owner preference is the `www` host).
> **Last updated:** October 16, 2026
> **Branch:** `seo/tarikh-tech-migration`

---

## 1. Brand identity

| Item | Value |
|------|-------|
| Brand name | **Tarikh** (तारिख) |
| What the name means | Tarikh (तारिख) — the date a court sets for a case hearing. _(TODO(owner): confirm this is accurate in your context; the sentence is on `/about` and in the hero microcopy, so it is easy to reword.)_ |
| Category terms used with the brand | "Tarikh law ERP", "Tarikh legal practice management software for Nepal", "law firm software Nepal" |
| Instagram | `@tarikh.np` — https://www.instagram.com/tarikh.np/ (verified: linked throughout the site) |
| Facebook / LinkedIn / X | **Not used.** Unverified profiles were removed from `sameAs`. TODO(owner): supply real profile URLs before they are added back. |
| Parent organisation | Comply Nepal — expressed as `parentOrganization` / "by Comply Nepal" text only, never as the brand name. TODO(owner): confirm the legal entity name. |
| Location | Kathmandu, Nepal — **not** published in schema: no real, published office address was supplied, so schema carries `areaServed: Nepal` only. |
| Contact email | `support@complynepal.com` (existing, working) — TODO(owner): confirm a public `@tarikh.tech` address. No address is published that does not receive mail. |
| Phone | **Omitted.** No real phone number supplied; the placeholder `+977-9800000000` was deleted from schema. |
| Public pricing | "Contact us" — no `Offer` in schema until real public pricing exists. |
| Superlatives | **Removed everywhere** ("#1", "best", "leading"). |

---

## 2. URL map (old subdomain → new domain)

Old host: `tarikh.complynepal.com` (subdomain). New host: `www.tarikh.tech`.
The clean-URL change is free to make now because the new domain has no history.
See [`deploy/REDIRECTS.md`](deploy/REDIRECTS.md) for the host-level config, which is **outside this repo** and has to be deployed on the old host.

| Old URL (subdomain) | New canonical URL | Status |
|---|---|---|
| `/` (`/index.html`) | https://www.tarikh.tech/ | 301 |
| `/features.html` | https://www.tarikh.tech/features | 301 |
| `/pricing.html` | https://www.tarikh.tech/pricing | 301 |
| `/privacy.html` | https://www.tarikh.tech/privacy | 301 |
| `/terms.html` | https://www.tarikh.tech/terms | 301 |
| `/blog/` (`/blog/index.html`) | https://www.tarikh.tech/blog/ | 301 |
| `/blog/blog-post-nepal-court-hierarchy.html` | https://www.tarikh.tech/blog/nepal-court-hierarchy | 301 |
| anything else on the old host | https://www.tarikh.tech/ | 301 (catch-all) |

New pages created during this migration: `/about`, `/contact`, `/404.html` (noindex) and six blog posts under `/blog/`.

---

## 3. Phase 0 inventory — `complynepal` occurrences before the migration

Recorded with `grep -rIn "complynepal" --exclude-dir=.git .` — **138 matches in 11 files**:

```
blog/blog-post-nepal-court-hierarchy.html   canonical, hreflang x2, og:url, og:image, twitter:image, 5x JSON-LD
blog/index.html                             canonical, hreflang x2, og:url, og:image, twitter:image, 4x JSON-LD
features.html                               canonical, og:url, og:image, twitter:image, 5x JSON-LD
index.html                                  canonical, hreflang x3, dns-prefetch, og:url, og:image, twitter:image,
                                            12x JSON-LD, hero CTA email (support@complynepal.com)
pricing.html                                canonical, og:url, og:image, twitter:image, 5x JSON-LD
privacy.html                                canonical, og:url, og:image, twitter:image, 5x JSON-LD, body link (line 136), [CONFIRM] email
terms.html                                  canonical, og:url, og:image, twitter:image, 5x JSON-LD, body link (line 136), [CONFIRM] email
robots.txt                                  host comment, sitemap URL x2
sitemap.xml                                 7 locs + 14 xhtml:link hreflang entries + 2 image locs
SEO.md                                      domain tables, migration checklist
SEO_IMPLEMENTATION_SUMMARY.md               domain references
```

All of the above are now replaced with `https://www.tarikh.tech`. The only intentionally-kept occurrences are the redirect map in `deploy/REDIRECTS.md` and the host-config files, plus the existing `support@complynepal.com` mail address (flagged TODO(owner)).

**Hosting platform detected:** none. The repo contains no `_redirects`, `_headers`, `vercel.json`, `netlify.toml`, `.htaccess`, `nginx.conf`, `Dockerfile` or CI workflow. **TODO(owner): confirm the host for `tarikh.tech`.** Config for all common options is provided in `deploy/` and at the repo root.

**Old live-site copy is not the baseline.** The live subdomain's title differs from the repo ("…Nepal's #1…"). The repo copy is the source of truth and the "#1" positioning was not copied anywhere.

---

## 4. What is done

### Phase 1 — Domain replacement
- Every absolute URL in the repo uses `https://www.tarikh.tech`. No trailing-slash inconsistencies (`/` for the home page, `https://www.tarikh.tech/blog/` for the blog index, no trailing slash on files-in-a-folder routes such as `/features`).
- Homepage `dns-prefetch` link to our own origin **deleted** (it was useless).
- `privacy.html` / `terms.html` body links updated to `www.tarikh.tech` (link text and `href`).
- Google Search Console verification meta kept (it belongs to the **old** property) with commented placeholders for the new Google property token and for Bing `msvalidate.01`.
- `SEO.md` / `SEO_IMPLEMENTATION_SUMMARY.md` updated; stale "CHANGE TO NEW DOMAIN" notes deleted.
- `.freebuff/` is **not tracked** (`git ls-files .freebuff` is empty); it stays covered by `.gitignore`.

### Phase 2 — Head, URLs, internal linking
- One consistent `<head>` block on every page: `title` → `description` → `robots` → `canonical` → OG → Twitter → icons → manifest → fonts → CSS → JSON-LD.
- Removed: `<meta name="keywords">`, every `hreflang` alternate and the `xhtml:link` sitemap entries, `twitter:site` / `twitter:creator` (`@tarikh.np` is an Instagram handle, not an X handle), `article:publisher` pointing at Instagram, duplicate preconnect lines.
- Titles ≤ 60 characters and descriptions of 140–158 characters, unique per page, no superlatives. `og:title` / `twitter:title` match the page title. `og:image:width`, `og:image:height` and `og:image:alt` on every page.
- All internal links are root-absolute (`/`, `/features`, `/blog/`, `/#features`). No `index.html`, no `../`, no `href="#"`.
- Clean URLs implemented by moving each page into a folder with an `index.html`, so it works on any static host without rewrite rules.
- Navigation: Features, Pricing, Blog and About added to the header nav, mobile nav and **identical** footer on every page. Legal links included.
- `404.html` with `noindex`, site header/footer and Home / Features / Pricing / Blog links.
- Favicons and manifest regenerated (square, correct purposes) from `assets/logo/logo.svg`.
- Blog: links to unpublished posts and `href="#"` placeholders removed; the posts that were promised are now written (Phase 4). No shipped link 404s.
- Heading hierarchy fixed: one `<h1>` per page, footer column titles are `<p class="footer-heading">`, article cards use `<h3>` under an `<h2>`.
- Blog-post inline `style=""` attributes moved into `css/style.css`.

### Phase 3 — Structured data
- Homepage: the five separate blocks replaced by **one `@graph`** with stable `@id`s (`/#organization`, `/#website`, `/#software`, `/#webpage`, `/#breadcrumb`, `/#faq`).
- `Organization.name` is "Tarikh". Comply Nepal is expressed as `parentOrganization`, not as the brand name.
- `WebSite` has `publisher` → organization, `inLanguage: "en"`, and **no** `SearchAction` (there is no site search).
- `SoftwareApplication`: `applicationCategory: "BusinessApplication"`, `operatingSystem: "Web"`, `provider` → organization, `featureList` trimmed to features the UI actually demonstrates. Deleted: `interactionStatistic`, `downloadUrl`, `softwareHelp`, `offers` (`price: "0"`), `softwareVersion`, fake `datePublished`. `offers` returns only when real public pricing exists.
- `faq-page` was not created: FAQ **lives on the home page** and the JSON-LD question/answer text is compared character-for-character against the visible `#faq` copy by `deploy/verify.py`.
- `BreadcrumbList` on every inner page, including the blog index and each post, with clean URLs.
- Blog posts: `BlogPosting` with `headline`, `datePublished`, `dateModified`, an `image` array, `author` (Organization "Tarikh team" by default — TODO(owner): supply a named author/reviewer and credential), `publisher` → organization, `mainEntityOfPage` → clean URL. Hard-coded `wordCount` removed.
- Every block is validated by `deploy/verify.py` (JSON parses, `@id` references resolve, every URL starts with the new origin). The Rich Results Test and the Schema Markup Validator still need a manual run after deploy.

### Phase 4 — Content and entity signals
- `/about` — the page an entity/brand query should land on: what Tarikh is, who builds it, where it is based, who it is for, how to contact the team, plus the plain-text sentence explaining the name and one Devanagari spelling (तारिख).
- `/contact` — real contact path replacing the Instagram-DM-only funnel. Default: `mailto:` with a prefilled subject (TODO(owner): supply a form backend to upgrade this).
- Conversion and trust: "Book a Demo" CTAs point at `/contact`.
- Six blog posts, each with a TL;DR, H2/H3 structure, a visible author/reviewer line, published/updated dates, 2–3 internal links and one CTA: Peshi/Tarikh date tracking, case management software for Nepal law firms, law ERP vs spreadsheets, NPR billing, document management, and the existing Nepal court hierarchy guide (which gained a hero image, author line and sources).
- Legal-factual content is flagged for the owner in the final report; no statute, fee, court procedure or deadline is stated that could not be sourced.

### Phase 5 — Infrastructure
- `robots.txt` reduced to `User-agent: *` / `Allow: /` / `Sitemap:`.
- `sitemap.xml` lists only indexable canonical URLs on the new origin with accurate `lastmod` from git (no `changefreq`, no `priority`, no `hreflang`, no `404.html`).
- Redirect + header config for Netlify/Cloudflare Pages, Vercel, Apache/cPanel and nginx, covering http→https, apex→www, the old `.html` paths, a real 404 status, cache headers, HSTS, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
- `deploy/REDIRECTS.md` — the old-host redirect map to deploy on `tarikh.complynepal.com`.

### Phase 6 — Performance
- `dashboard.png` converted to AVIF/WebP at 640/960/1536 px, served through `<picture>`/`srcset` with explicit dimensions and `fetchpriority="high"` on the hero.
- Unused `assets/images/dashboard2.png` deleted.
- Below-the-fold images `loading="lazy"`; blog thumbnails distinct, compressed with explicit dimensions.
- CSS/JS minified into `*.min.*` by `deploy/build-assets.py` (no build system). Fonts self-hosted (latin subset, `font-display: swap`, preloaded) to drop the Google Fonts dependency.

---

## 5. Owner inputs still outstanding

| Input | Current default in the build | Impact |
|---|---|---|
| Hosting provider for `tarikh.tech` | All configs produced; recommendation in `deploy/REDIRECTS.md` | Which config file to deploy |
| Public contact email on `tarikh.tech` | `support@complynepal.com` (kept, flagged) | `/contact`, `contactPoint` schema, footer |
| Contact-form backend | `mailto:` with prefilled subject | `/contact` conversion quality |
| Real phone number / office address | Omitted from schema and pages | Local/homepage trust, LocalBusiness eligibility |
| Verified LinkedIn / Facebook / X profiles | Omitted; Instagram only | `sameAs` breadth |
| Product login / app URL | "Login" links that pointed at `#get-started` removed | — |
| Public pricing | "Contact us", no `Offer` in schema | Pricing page, rich results |
| Blog author + reviewer name and credential | Attributed to "Tarikh team" (Organization) | E-E-A-T for legal content |
| Legal entity name ("Tarikh" vs "Tarikh by Comply Nepal") | Brand = "Tarikh"; "by Comply Nepal" only as `parentOrganization` | Schema, footer, terms |
| `[CONFIRM: …]` items in Privacy/Terms | Replace with TODO(owner) text, nothing invented | Legal pages must not make unfounded claims |
| New Google + Bing verification tokens | Commented placeholders in the homepage `<head>` | Verification of the new property |

The full TODO list is repeated in the final migration report.

---

## 6. Launch day / first 30 days (out-of-repo checklist)

### Search Console
1. Add `tarikh.tech` as a **Domain property** (DNS TXT record). A domain property covers `www`, apex, `http` and `https` in one place.
2. Verify, then paste the token into the commented `<meta name="google-site-verification">` placeholder in `index.html` (or rely on DNS TXT alone) and remove the old property's token once the new property is confirmed.
3. Submit `https://www.tarikh.tech/sitemap.xml`.
4. URL Inspection → **Request indexing** for Home, Features, Pricing, About, Contact, the blog index and each post.
5. Keep the old `tarikh.complynepal.com` property live — do not delete it; it still holds the old impressions data.
6. Check whether **Change of Address** is offered for the old property. For a subdomain → subdomain/apex move it often is not, and for a brand-new domain it is usually unavailable. If it is not offered, the 301s plus the new sitemap do the job; note the date you checked.

### Bing Webmaster Tools
7. Import the site from Search Console, submit the sitemap, enable **IndexNow** if the host supports it (Netlify/Cloudflare Pages do via a plugin or a small function).

### Old host
8. Deploy the 301 map in `deploy/REDIRECTS.md` **at the same moment** the new site goes live. Then re-test:
   `curl -sIL https://tarikh.complynepal.com/features.html` → exactly **one** 301 hop to a 200 page.
9. **Keep the old subdomain live and redirecting for at least 12 months.** Do not delete it, do not 404 it, and do not leave it serving a duplicate copy of the site.

### DNS / HTTPS
10. Valid TLS on both `tarikh.tech` and `www.tarikh.tech`; a **single** hop to the canonical host. HSTS only after HTTPS is confirmed everywhere (the configs ship it commented).

### Links and profiles
11. Add a visible contextual link from `complynepal.com` (and anywhere else the team controls) to `https://www.tarikh.tech/`.
12. Update the Instagram bio link, plus any Facebook/LinkedIn page URL, email signature and directory listing, to the new domain.
13. Create/claim a LinkedIn company page, a Facebook page and — if the team has a physical office — a Google Business Profile. Use the exact name "Tarikh" and the same one-line description everywhere, then add them to `sameAs`.

### Links that move the needle
14. Real links: Nepal legal-tech and startup directories; Nepal Bar Association or law-college newsletters; local tech media; Product Hunt; G2 / Capterra / SoftwareSuggest listings; guest posts; partner-firm case studies (with written permission).

### Measurement
15. GA4 or a privacy-friendly alternative (e.g. Plausible/Umami) with a "demo requested" conversion event.
16. Weekly: Search Console → **Pages** (indexed / not-indexed reasons) and **Performance** filtered to brand queries: `tarikh law erp`, `tarikh nepal`, `tarikh legal software`.
17. In 2–4 weeks re-check that `site:tarikh.tech` returns the pages and that searching "Tarikh law ERP Nepal" surfaces the homepage. If brand queries still return nothing, that is a links-and-mentions problem, not an on-page one.

---

## 7. Verification

Run:

```bash
python deploy/verify.py
```

It exits non-zero if any gate fails and is the source of truth for "done". Full details in `deploy/VERIFY.md`.

---

## 8. Maintenance

Update this file whenever the domain changes, the Instagram handle changes, a page is added, schema is modified, the keyword strategy changes, a blog post is published, or Search Console shows issues.

**Last reviewed:** October 16, 2026
**Next review:** after the new property is verified in Search Console.
