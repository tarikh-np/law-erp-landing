# Tarikh Landing Page — SEO Implementation Summary

**Date:** September 6, 2026  
**Hosted at:** `tarikh.complynepal.com`  
**Instagram:** `@tarikh.np`

---

## Objective

Establish **Tarikh** as the #1 ranked brand in Nepal for:
- Law ERP software
- Legal case management software
- Law firm management software
- Nepal legal tech / Nepal court case tracking

---

## What Was Changed

### 1. Technical SEO — `index.html`

| Change | Detail |
|--------|--------|
| **Title Tag** | `"Tarikh — Nepal's #1 Legal Case Management & Law ERP Software for Law Firms"` — keyword-rich, brand-first, Nepal-targeted, "#1" positioning |
| **Meta Description** | Expanded from 1 sentence to 2 sentences covering: Nepal's leading law ERP, matters, court hearings, Peshi/Tarikh dates, Nepal court system, Bikram Samvat, Devanagari, 77 districts |
| **Meta Keywords** | Added 15+ Nepal-specific keywords: law ERP Nepal, case management software Nepal, legal practice management Nepal, law firm software Nepal, court hearing tracker Nepal, Nepal law firm ERP, legal software Nepal, matter management Nepal, Peshi date tracker, Nepal court calendar, law firm automation Nepal, तारिख ल importance leaving ERP, नेपाल ल importance leaving सफ्टवेयर |
| **Meta Robots** | Added `max-image-preview:large, max-snippet:-1, max-video-preview:-1` for rich results |
| **Meta Author** | `Tarikh — Comply Nepal` |
| **Hreflang** | Added `ne-NP` (Nepali language) hreflang in addition to `en-NP` and `x-default` |
| **Canonical** | Maintained — `https://tarikh.complynepal.com/` |
| **Preconnect / DNS-prefetch** | Added preconnect for Google Fonts, Google.com and dns-prefetch for own domain |
| **PWA / App Meta** | Added manifest link, apple-mobile-web-app-capable, apple-mobile-web-app-title, mobile-web-app-capable, application-name |

### 2. Open Graph & Twitter Cards

| Change | Detail |
|--------|--------|
| **OG Title** | `"Tarikh — Nepal's #1 Law ERP & Case Management Software"` |
| **OG Description** | Expanded — mentions Nepal's law firms, matters, court hearings, Peshi/Tarikh dates, clients, documents, billing, Instagram: @tarikh.np |
| **OG Image** | Width/height/alt tags added for rich previews |
| **OG Locale** | `en_NP` |
| **OG Publisher** | Instagram link added as `article:publisher` |
| **Twitter Card** | `summary_large_image` with Nepal-optimized title/description |
| **Twitter Site/Creator** | `@tarikh.np` added as site and creator |

### 3. Structured Data (JSON-LD) — 5 schemas on homepage

| Schema | Purpose |
|--------|---------|
| **SoftwareApplication** | Primary — targets "law ERP Nepal", "case management software Nepal". Includes alternate names (Tarikh NP, Tarikh Nepal, तारिख), featureList (20 features), keywords (Nepal legal terms in Nepali script), offer, provider with sameAs links (Instagram, Facebook, LinkedIn), contactPoint, areaServed (Nepal), softwareVersion, datePublished/Modified, interactionStatistic |
| **Organization** | Reinforces Nepal presence — Kathmandu, Bagmati, NP, sameAs social links, brand schema, knowsAbout (Nepal legal terms) |
| **WebSite** | Search action enabled — `?s={search_term_string}` for site-specific queries |
| **FAQPage** | **Expanded from 8 to 11 questions** — added Nepal-specific questions: "What is Tarikh and how is it different from other law ERP software in Nepal?", "Is Tarikh the best case management software for law firms in Nepal?", "Does Tarikh support Peshi dates and Nepal's Bikram Samvat calendar?", "How does Tarikh handle Nepal's court system and legal terminology?", "Where can Nepali law firms get Tarikh software?" |
| **BreadcrumbList** | Homepage breadcrumb for Google SERP display |

### 4. Content SEO — Hero & Body Copy

| Section | Change |
|---------|--------|
| **Hero Eyebrow** | `"Nepal's #1 Law ERP & Case Management Software"` |
| **H1** | `"Case management & law ERP software built for Nepal's law firms"` — italicized "Nepal's law firms" for emphasis |
| **Hero Sub** | Expanded to mention: Peshi/Tarikh dates, Nepal's courts, legal workflow, Nimli-legal platform |
| **Hero Benefits** | Replaced generic benefits with Nepal-specific ones: "Built for Nepal's Courts", "Peshi/Tarikh Date Native — Bikram Samvat calendar & Nepal court dates built-in", "Nepal's Best Law ERP — Matter, court, client, document & billing in one platform" |
| **Nepal Section** | Rewrote with stronger keyword density — "Supreme Court, High Courts, District Courts", "तारिख/पेठी", "Bikram Samvat (BS) calendar", "Devanagari script", "77 Nepal districts", "Nepali Rupees (NPR)", "Nepal court website scraping", "Nepal-specific matter types", "law ERP Nepal's law firms have been waiting for" |
| **Case Management Section** | Added "Nepal's Best Law ERP" label; "from the first filing at a Nepal court to the final invoice" |

### 5. Footer & Social

| Change | Detail |
|--------|--------|
| **Footer copyright** | `"© 2026 Tarikh by Comply Nepal. All rights reserved. | Nepal's #1 Law ERP & Case Management Software for Law Firms"` |
| **Footer tags** | Added "Peshi Dates · Nepal Court System" |
| **Instagram link** | Added `@tarikh.np` with Instagram SVG icon, `target="_blank" rel="noopener noreferrer"` |
| **Footer social section** | Dedicated div with Instagram link and hover styling |
| **Footer Resources nav** | Added Blog link and Instagram link |
| **CSS** | Inlined CSS for `.footer-legal`, `.footer-social`, `.footer-social-label` |

### 6. Features Page (`features.html`)

| Change | Detail |
|--------|--------|
| **Title** | `"Tarikh Features — Nepal's Best Law ERP: Matter, Court, Client & Billing Management"` |
| **Meta Description** | Expanded with full feature list — Nepal's leading law ERP, matter management, court hearing tracking, Peshi date support, client management, document control, billing/invoicing, RBAC, audit logs, Nepal court system integration |
| **Meta Keywords** | Added 14 keywords targeting features page specifically |
| **OG Title/Description** | Nepal-optimized for social sharing |
| **Breadcrumb** | Changed to `"Features — Nepal's Law ERP"` |

### 7. Sitemap (`sitemap.xml`)

| Change | Detail |
|--------|--------|
| **Comment** | Added "Tarikh sitemap — Nepal's Law ERP & Case Management Software" |
| **Last Updated** | `2026-09-06` |
| **Namespaces** | Added `xhtml` for hreflang and `image` for image sitemap |
| **Homepage** | Priority 1.0, changefreq weekly, hreflang alternates, image inclusion |
| **Features page** | Priority 0.9, monthly |
| **Pricing page** | Priority 0.8, monthly |
| **Privacy page** | Priority 0.5, yearly |
| **Terms page** | Priority 0.5, yearly |
| **Blog placeholder** | Commented example for future blog posts |

### 8. Robots.txt

| Change | Detail |
|--------|--------|
| **Comment header** | Site name, domain, Instagram handle, sitemap URL |
| **All user-agents** | Allow all, crawl-delay 2 |
| **Googlebot** | Explicit allow, crawl-delay 2 |
| **Bingbot** | Explicit allow, crawl-delay 2 |
| **Social crawlers** | `facebookexternalhit`, `Twitterbot`, `Instagram` — all allowed for OG tag fetching |
| **Sitemap** | Declared twice (redundancy) |

### 9. Blog — Content Hub for Topical Authority

| File | Purpose |
|------|---------|
| **`blog/index.html`** | Blog index — NPLegal Tech & Law Firm Insights. 6 article cards (court hierarchy, Peshi dates, billing, case management software, law ERP vs spreadsheets, document management). Newsletter signup. Topic clusters section (6 categories). |
| **`blog/blog-post-nepal-court-hierarchy.html`** | Pillar content — Nepal Court Hierarchy Explained. Full article with Supreme Court, High Courts, District Courts, specialized courts. Schema: Article. Related posts section. This targets the keyword "Nepal court hierarchy" and related terms. |

---

## SEO Strategy Summary

### Target Keywords (Nepal-focused)

**Primary (Homepage):**
- "law ERP Nepal"
- "case management software Nepal"
- "legal practice management Nepal"
- "law firm software Nepal"
- "Nepal's #1 law ERP"

**Secondary (Features):**
- "matter management software features"
- "court hearing tracking Nepal"
- "Nepal law firm billing"
- "Peshi date management"
- "Nepal legal tech features"

**Content Hub (Blog):**
- "Nepal court hierarchy"
- "Supreme Court Nepal"
- "High Courts Nepal"
- "District Courts Nepal"
- "Nepal court system"
- "Peshi date tracking Nepal"
- "Bikram Samvat calendar"
- "law firm billing best practices Nepal"
- "case management software for Nepal law firms"

### Ranking Tactics Used

1. **Keyword in Title Tag** — "#1 Law ERP", "Nepal's law firms" in H1
2. **Nepali script keywords** — तारिख, पेठी, नेपाल in meta keywords
3. **Hreflang for Nepal** — en-NP + ne-NP signals Nepal targeting to Google
4. **FAQPage schema** — Rich snippets for 11 Nepal-specific Q&As
5. **SoftwareApplication schema** — Appears in Google's software/app rich results
6. **Local Nepal signals** — Kathmandu, Bagmati, NP address, Nepal currency (NPR)
7. **Social proof signals** — Instagram @tarikh.np in OG, Twitter, schema sameAs
8. **Topical authority** — Blog with pillar content on Nepal court system
9. **Image SEO** — OG image with alt text, sitemap image inclusion
10. **Internal linking** — Footer links to Blog, Features, all pages interconnected
11. **Content depth** — Nepal section with 3 substantial paragraphs targeting Nepal court system
12. **Canonical + hreflang consistency** — No duplicate content issues

---

## Files Modified

| File | Changes |
|------|---------|
| `index.html` | Title, meta, OG, Twitter, JSON-LD (5 schemas), hero, benefits, Nepal section, case management section, footer, CSS |
| `features.html` | Title, meta description, keywords, OG, breadcrumb |
| `sitemap.xml` | Full rewrite with all pages, hreflang, image, priorities |
| `robots.txt` | Full rewrite with Nepal-focused crawl directives |
| `blog/index.html` | New file — blog content hub (6 articles + newsletter + topics) |
| `blog/blog-post-nepal-court-hierarchy.html` | New file — pillar content on Nepal court system |

---

## Next Steps for Continued SEO

1. **Create more blog posts** — One for each topic card: Peshi dates, law firm billing, case management software, law ERP vs spreadsheets, document management
2. **Add internal links** between blog posts and homepage/features pages
3. **Build backlinks** — Submit to Nepal business directories, legal tech directories, partner with Comply Nepal for cross-promotion
4. **Google Business Profile** — Register Tarikh as a business in Kathmandu, Nepal
5. **Nepali language version** — Create `?lang=ne` pages or a separate Nepali HTML version for `ne-NP` hreflang
6. **Generate og-cover.png** — Design the 1200×630 social preview image (TODO placeholder exists)
7. **Submit sitemap to Google Search Console** — `https://tarikh.complynepal.com/sitemap.xml`
8. **Monitor rankings** — Track "law ERP Nepal", "case management software Nepal", "Nepal court hierarchy"
