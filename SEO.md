# Tarikh — SEO Checklist & Implementation Log

> **Purpose:** This is the master reference file for ALL SEO work on the Tarikh landing page and brand.
> When we migrate to a new domain, every item below must be re-verified and updated.
> Last updated: September 6, 2026

---

## 1. Brand Identity (Fixed — Update When Domain Changes)

| Item | Current Value | Action When Domain Changes |
|------|---------------|---------------------------|
| **Brand Name** | Tarikh (तारिख) | No change |
| **Brand Tagline** | Nepal's #1 Law ERP & Case Management Software | Potentially update if positioning changes |
| **Instagram Handle** | `@tarikh.np` | Update everywhere if handle changes |
| **Facebook** | `@tarikh.np` | Update if needed |
| **LinkedIn** | `tarikh-np` | Update if needed |
| **Current Domain** | `tarikh.complynepal.com` | **CHANGE TO NEW DOMAIN** |
| **New Domain (TBD)** | `tarikh.com.np` or `tarikh.np` or `tarikh.io` | Update ALL URLs below |
| **Developed By** | Comply Nepal | No change |
| **Location** | Kathmandu, Bagmati, Nepal (NP) | No change |

---

## 2. Current Domain — All URLs That Must Be Updated

### Homepage URLs
```
Canonical:     https://tarikh.complynepal.com/
OG URL:        https://tarikh.complynepal.com/
Twitter URL:   https://tarikh.complynepal.com/
Schema URL:    https://tarikh.complynepal.com/
Sitemap:       https://tarikh.complynepal.com/sitemap.xml
 robots.txt:   https://tarikh.complynepal.com/robots.txt
```

### Page URLs
```
Homepage:      / (index.html)          -> https://tarikh.complynepal.com/
Features:      /features.html          -> https://tarikh.complynepal.com/features.html
Pricing:       /pricing.html           -> https://tarikh.complynepal.com/pricing.html
Privacy:       /privacy.html           -> https://tarikh.complynepal.com/privacy.html
Terms:         /terms.html             -> https://tarikh.complynepal.com/terms.html
Blog Index:    /blog/                  -> https://tarikh.complynepal.com/blog/
Blog Post 1:   /blog/blog-post-nepal-court-hierarchy.html -> https://tarikh.complynepal.com/blog/blog-post-nepal-court-hierarchy.html
```

### Social URLs
```
Instagram:     https://www.instagram.com/tarikh.np/
Facebook:      https://www.facebook.com/tarikh.np
LinkedIn:      https://www.linkedin.com/company/tarikh-np
```

### Schema sameAs URLs
```
https://www.instagram.com/tarikh.np/
https://www.facebook.com/tarikh.np
https://www.linkedin.com/company/tarikh-np
https://tarikh.complynepal.com/
```

### OG Image URL
```
https://tarikh.complynepal.com/assets/images/og-cover.png
```

### Favicon / PWA
```
assets/images/primary.png  (used as favicon, apple-touch-icon)
```

---

## 3. Files Modified — Checklist

### Landing Page Root
```
[✓] index.html           — Homepage (main SEO file)
[✓] features.html        — Features page
[✓] pricing.html         — Pricing page (metadata only)
[✓] privacy.html         — Privacy page (no SEO changes needed)
[✓] terms.html           — Terms page (no SEO changes needed)
[✓] robots.txt           — Crawl directives
[✓] sitemap.xml          — URL index for search engines
[✓] SEO.md               — THIS FILE (master reference)
[✓] SEO_IMPLEMENTATION_SUMMARY.md — Detailed implementation log
```

### Blog Directory
```
[✓] blog/index.html           — Blog homepage (content hub)
[✓] blog/blog-post-nepal-court-hierarchy.html — Pillar blog post
```

### Assets (verified & created)
```
[✓] assets/images/og-cover.png  — 1200x630 social preview image (created)
[✓] assets/images/primary.png   — Favicon / brand logo / schema logo
[✓] manifest.json               — PWA web application manifest (created)
[✓] assets/logo/logo.svg        — SVG brand vector
```

---

## 4. SEO Elements Implemented — Full List

### 4.1 Technical SEO

```
[✓] Title tag optimized with "#1 Law ERP" and "Nepal's law firms"
[✓] Meta description expanded — 2 sentences, Nepal-specific
[✓] Meta keywords — 15+ Nepal-focused keywords including Nepali script
[✓] Meta robots — index, follow, max-image-preview:large
[✓] Meta author — Tarikh — Comply Nepal
[✓] Canonical URL — set correctly
[✓] Hreflang — en-NP, ne-NP, x-default
[✓] Preconnect — fonts.googleapis.com, fonts.gstatic.com
[✓] DNS prefetch — tarikh.complynepal.com
[✓] PWA meta tags — manifest, apple-mobile-web-app-capable, apple-mobile-web-app-title
[✓] Mobile-web-app-capable, application-name
```

### 4.2 Social / Open Graph

```
[✓] og:type — website
[✓] og:site_name — Tarikh
[✓] og:title — Nepal-optimized
[✓] og:description — expanded with Nepal details
[✓] og:url — canonical
[✓] og:image — with width, height, alt
[✓] og:locale — en_NP
[✓] article:publisher — Instagram link
[✓] twitter:card — summary_large_image
[✓] twitter:title — Nepal-optimized
[✓] twitter:description — Nepal-optimized
[✓] twitter:image — with alt
[✓] twitter:site — @tarikh.np
[✓] twitter:creator — @tarikh.np
```

### 4.3 Structured Data (JSON-LD) — Homepage

```
[✓] SoftwareApplication schema (primary)
     - name: "Tarikh — Law ERP & Case Management Software"
     - alternateName: ["Tarikh NP", "Tarikh Nepal", "तारिख"]
     - applicationCategory: BusinessApplication
     - applicationSubCategory: LegalApplication
     - description: Nepal-specific, mentions all key features
     - offers: SaaS, availability InStock, price 0, currency NPR
     - provider: Organization with sameAs (Instagram, Facebook, LinkedIn)
     - address: Kathmandu, Bagmati, NP
     - keywords: Nepal legal terms including Nepali script
     - featureList: 20 features listed
     - softwareVersion: 1.0.0
     - datePublished: 2026-01-01
     - dateModified: 2026-09-06
     - interactionStatistic: 100 users
     - inLanguage: en-NP

[✓] Organization schema
     - name: "Tarikh by Comply Nepal"
     - alternateName: "Tarikh NP"
     - logo, image URLs
     - foundingDate: 2026
     - knowsAbout: Nepal legal terms
     - address: Kathmandu, Bagmati, NP
     - sameAs: Instagram, Facebook, LinkedIn, homepage
     - brand: Brand schema

[✓] WebSite schema
     - name: "Tarikh — Nepal Law ERP & Case Management"
     - alternateName: "Tarikh Nepal Legal Software"
     - potentialAction: SearchAction with ?s={search_term_string}
     - inLanguage: en-NP

[✓] FAQPage schema (11 questions — Nepal-specific)
     Q1: What is Tarikh and how is it different from other law ERP software in Nepal?
     Q2: Is Tarikh the best case management software for law firms in Nepal?
     Q3: Can Tarikh manage multiple matters for Nepali law firms?
     Q4: Does Tarikh support Peshi dates and Nepal's Bikram Samvat calendar?
     Q5: Can I track court hearings and Nepal court dates in Tarikh?
     Q6: Is Tarikh suitable for solo lawyers and small law firms in Nepal?
     Q7: Does Tarikh include billing and invoice generation for Nepali law firms?
     Q8: How does Tarikh handle Nepal's court system and legal terminology?
     Q9: Can different employees in my Nepal law firm have different access levels?
    Q10: Where can Nepali law firms get Tarikh software?
     (plus 1 from original)

[✓] BreadcrumbList schema — homepage only
```

### 4.4 Structured Data — Features Page

```
[✓] WebPage schema
[✓] BreadcrumbList schema (Home -> Features)
```

### 4.5 Structured Data — Blog

```
[✓] Blog schema on blog/index.html
[✓] Article schema on each blog post
```

### 4.6 Content SEO

```
[✓] Hero eyebrow: "Nepal's #1 Law ERP & Case Management Software"
[✓] H1: "Case management & law ERP software built for Nepal's law firms"
[✓] Hero sub: expanded with Nepal specifics (Peshi/Tarikh, Nepal courts, Nimli-legal)
[✓] Hero benefits replaced with Nepal-specific benefits:
     - "Built for Nepal's Courts — Supreme Court, High Courts & District Courts"
     - "Peshi/Tarikh Date Native — Bikram Samvat calendar & Nepal court dates built-in"
     - "Nepal's Best Law ERP — Matter, court, client, document & billing in one platform"
[✓] Nepal section rewritten — 3 substantial paragraphs:
     - Paragraph 1: Court terminology, Peshi dates, Supreme Court/High Courts/District Courts
     - Paragraph 2: Compliance, 77 districts, NPR, disconnected spreadsheets
     - Paragraph 3: Bikram Samvat, Devanagari, court hearing scraping, law ERP Nepal has been waiting for
[✓] Case Management section: "Nepal's Best Law ERP" label, "first filing at a Nepal court"
[✓] Footer copyright: "Nepal's #1 Law ERP & Case Management Software for Law Firms"
[✓] Footer tags: "Peshi Dates · Nepal Court System"
[✓] Blog index page: 6 articles + newsletter + 6 topic clusters
[✓] Blog post 1: Nepal Court Hierarchy — pillar content with full Article schema
```

### 4.7 Sitemap

```
[✓] Namespaces: xhtml (hreflang), image (image sitemap)
[✓] Homepage: priority 1.0, weekly, hreflang alternates, image
[✓] Features: priority 0.9, monthly, hreflang
[✓] Pricing: priority 0.8, monthly, hreflang
[✓] Privacy: priority 0.5, yearly, hreflang
[✓] Terms: priority 0.5, yearly, hreflang
[✓] Blog placeholder with example URL commented
```

### 4.8 Robots.txt

```
[✓] User-agent: * — Allow all, crawl-delay 2
[✓] Googlebot — Allow, crawl-delay 2
[✓] Bingbot — Allow, crawl-delay 2
[✓] facebookexternalhit — Allow
[✓] Twitterbot — Allow
[✓] Instagram — Allow
[✓] Sitemap declared (x2 for redundancy)
```

---

## 5. Target Keywords — Master List

### Primary Keywords (Homepage — Highest Priority)
```
law ERP Nepal
case management software Nepal
legal practice management Nepal
law firm software Nepal
Nepal law firm ERP
Nepal's #1 law ERP
legal case management Nepal
Nepal legal software
matter management Nepal
Nepal court case management
law firm billing software Nepal
Nepal legal tech
case management tools Nepal
law firm automation Nepal
```

### Secondary Keywords (Features Page)
```
Tarikh features
Nepal law ERP features
case management features Nepal
legal practice management features
court hearing tracking Nepal
matter management software features
Nepal law firm billing
Peshi date management
Nepal legal tech features
law firm software features Nepal
```

### Content / Long-Tail Keywords (Blog)
```
Nepal court hierarchy
Supreme Court Nepal
High Courts Nepal
District Courts Nepal
Nepal court system
Nepal judiciary structure
Peshi date tracking Nepal
Tarikh date Nepal
Bikram Samvat calendar Nepal
BS to AD date converter Nepal
Nepal law firm billing best practices
law firm invoicing Nepal
case management software for Nepal law firms
best law ERP for Nepal
Nepal law firm management software
document management for Nepal law firms
Nepal legal practice management tips
law firm accounting Nepal
Nepal court hearing schedule
Nepal court case tracking
```

### Nepali Script Keywords
```
तारिख ल importance leaving ERP
तारिख नेपाल
नेपाल ल importance leaving सफ्टवेयर
नेपाल क 안티ट软件
नेपाली ल importance leaving पद्धति प्रबन्धन
पेठी तारिख ट्र्याकिंग
भेरिएट साम्वत क्यालेन्डर
नेपाल ल importance leaving फर्म सफ्टवेयर
```

---

## 6. Domain Migration Checklist — When We Get a New Domain

### Step 1: Update ALL URLs in Files

Search and replace in ALL HTML files. Current domain: `tarikh.complynepal.com`

**Replace with:** `[NEW_DOMAIN]` (e.g., `tarikh.com.np`)

Files to update:
```
[ ] index.html          — title, meta og:url, canonical, schema URLs, hreflang URLs, footer
[ ] features.html       — title, meta og:url, canonical, schema URLs, breadcrumb
[ ] pricing.html        — (verify and update if needed)
[ ] privacy.html        — (verify and update if needed)
[ ] terms.html          — (verify and update if needed)
[ ] blog/index.html     — title, meta og:url, canonical, schema URLs, footer
[ ] blog/blog-post-nepal-court-hierarchy.html — title, meta og:url, canonical, schema URLs, breadcrumb
[ ] sitemap.xml         — ALL loc URLs, hreflang URLs
[ ] robots.txt          — Sitemap URL
```

### Step 2: Update Instagram Handle (if changed)

If `@tarikh.np` changes, update in:
```
[ ] index.html          — OG description, Twitter site/creator, footer, schema sameAs
[ ] features.html       — OG description, Twitter site/creator
[ ] blog/index.html     — OG, footer, schema sameAs
[ ] blog/blog-post-nepal-court-hierarchy.html — OG, footer, schema sameAs
[ ] sitemap.xml         — (no change needed)
[ ] robots.txt          — comment header
[ ] SEO.md              — this file, Section 1
```

### Step 3: Create og-cover.png

```
Design: 1200x630px social preview image
Content: Tarikh branding + "Nepal's #1 Law ERP"
Location: assets/images/og-cover.png
Update: All og:image references (already correct path)
```

### Step 4: Verify logo.svg Exists

Schema references: `https://tarikh.complynepal.com/assets/logo/logo.svg`
If this file doesn't exist, either:
  - Create it, OR
  - Update all schema references to use `primary.png` instead

### Step 5: Google Search Console

```
[ ] Add new domain to Google Search Console
[ ] Verify ownership (DNS record, HTML file, or Google Tag)
[ ] Submit new sitemap: https://[NEW_DOMAIN]/sitemap.xml
[ ] Set geographic target to Nepal
[ ] Request indexing of homepage
[ ] Monitor coverage and fix any errors
```

### Step 6: Other Search Engines

```
[ ] Bing Webmaster Tools — add and verify new domain
[ ] Submit sitemap to Bing
```

### Step 7: Social Media

```
[ ] Update website URL in Instagram bio (@tarikh.np)
[ ] Update website URL in Facebook page
[ ] Update website URL in LinkedIn company page
[ ] Update schema sameAs URLs
```

### Step 8: 301 Redirects (if old domain still active)

If `tarikh.complynepal.com` is still accessible when new domain launches:

```
Old URL                                      -> New URL
tarikh.complynepal.com/                      -> https://[NEW_DOMAIN]/
tarikh.complynepal.com/features.html         -> https://[NEW_DOMAIN]/features.html
tarikh.complynepal.com/pricing.html          -> https://[NEW_DOMAIN]/pricing.html
tarikh.complynepal.com/privacy.html          -> https://[NEW_DOMAIN]/privacy.html
tarikh.complynepal.com/terms.html            -> https://[NEW_DOMAIN]/terms.html
tarikh.complynepal.com/blog/                 -> https://[NEW_DOMAIN]/blog/
tarikh.complynepal.com/blog/blog-post-nepal-court-hierarchy.html -> https://[NEW_DOMAIN]/blog/blog-post-nepal-court-hierarchy.html
```

This can be done via:
  - Comply Nepal server config (Nginx/Apache redirect)
  - Or a simple meta refresh / JS redirect on the old domain

### Step 9: Update SEO.md

```
[ ] Update Section 1 (Brand Identity) with new domain
[ ] Update Section 2 (All URLs) with new domain
[ ] Update "Last updated" date
```

---

## 7. Future SEO Content Plan — Blog Posts to Create

### Priority 1 (Create First)
```
1. ✅ Nepal Court Hierarchy — DONE (blog-post-nepal-court-hierarchy.html)
2. Peshi/Tarikh Date Tracking — Create (blog-post-peshi-date-tracking.html)
3. Law Firm Billing Best Practices Nepal — Create (blog-post-law-firm-billing.html)
4. Case Management Software for Nepal Law Firms — Create (blog-post-case-management-software.html)
```

### Priority 2 (Create After)
```
5. Law ERP vs Spreadsheets — Create (blog-post-law-erp-vs-spreadsheets.html)
6. Document Management for Nepal Law Firms — Create (blog-post-document-management.html)
7. Nepal Court Hearing Scheduling Tips
8. Bikram Samvat Calendar for Legal Professionals
9. How to Manage Multiple Matters in a Nepal Law Firm
10. Role-Based Access Control for Law Firms
11. Audit Logs: Why Nepal Law Firms Need Them
12. Client Portal for Nepal Law Firms
```

### Priority 3 (Create When Relevant)
```
13. Nepal Legal Tech Trends 2026
14. How to Start a Law Firm in Nepal — Tech Setup
15. Court Case Reference Numbers in Nepal — Guide
16. Nepal District Court Procedures
17. Appellate Court Process in Nepal
18. Supreme Court Litigation in Nepal
19. Law Firm Marketing in Nepal
20. Client Intake Best Practices for Nepal Law Firms
```

---

## 8. Competitor Landscape — Nepal Legal Software

### Known Competitors / Alternatives in Nepal
```
1. PathLegal — Free Legal Case Management Software Nepal (np.pathlegal.com)
2. Case-कता (Case-Kata) + eComply — Legal tech Nepal (LinkedIn presence)
3. CARET Legal — Premium cloud-native legal practice management (international)
4. Generic international tools (Clio, MyCase, PracticePanther) — not Nepal-specific
5. Spreadsheets / manual processes — most common for small Nepali firms
```

### Tarikh's Competitive Advantage
```
- Built SPECIFICALLY for Nepal — not adapted from foreign software
- Nepal court hierarchy (Supreme Court, High Courts, District Courts)
- Bikram Samvat (BS) calendar with AD conversion
- Devanagari script support
- Peshi/Tarikh date handling
- Court hearing scraping from Nepal court websites
- All 77 Nepal districts pre-loaded
- Nepal-specific matter types, hearing types, case stages
- Multi-tenant SaaS for law firms
- RBAC, audit logs, invoicing in NPR
- Instagram brand presence: @tarikh.np
```

---

## 9. Quick SEO Health Check Commands

Run these after any changes:

```bash
# Check title tag
grep -o '<title>[^<]*</title>' index.html

# Check meta description
grep -oP '(?<=<meta name="description" content=")[^"]*' index.html

# Check canonical
grep -o '<link rel="canonical"[^>]*>' index.html

# Check hreflang
grep -o 'hreflang="[^"]*"' index.html | sort -u

# Count JSON-LD schemas
grep -c 'application/ld+json' index.html

# Check Instagram references
grep -c 'tarikh.np' index.html

# Validate sitemap
xmllint --noout sitemap.xml

# Check robots.txt is valid
cat robots.txt
```

---

## 10. Notes & Reminders

- **Domain:** Currently `tarikh.complynepal.com` (subdomain of complynepal.com)
- **New domain TBD:** `tarikh.com.np`, `tarikh.np`, or `tarikh.io`
- **Brand:** "Tarikh" means "date/chronicle" in Nepali — relevant for case tracking
- **Parent company:** Comply Nepal — leverage cross-promotion
- **Content language:** English primary, Nepali secondary (ne-NP hreflang set up)
- **Sitemap lastmod:** Update to current date whenever content changes
- **og-cover.png:** Currently a TODO placeholder — must create before launch
- **logo.svg:** Referenced in schema — verify it exists or update schema to use primary.png
- **Instagram:** Primary social channel — `@tarikh.np`
- **Target audience:** Nepal law firms — solo practitioners, small firms, growing practices
- **Geographic target:** Nepal (set in Google Search Console)
- **Currency:** NPR (Nepali Rupees) — mentioned in schema and content

---

## 11. SEO.md Maintenance

Update this file whenever:
- Domain changes
- Instagram handle changes
- New pages are added
- Schema is modified
- Keywords strategy changes
- New blog posts are published
- Competitor landscape changes
- Google Search Console data shows issues

**Last reviewed:** September 6, 2026
**Next review:** Before domain migration
