# Verification

`deploy/verify.py` is the mechanical gate for this site. It is the definition of
"done": if it exits non-zero, the migration is not finished.

```bash
python deploy/verify.py            # static gates, fast
python deploy/verify.py --serve    # also boots a local server and fetches every page
```

Python 3.10+, standard library only — no packages, no framework.

## Gates

| # | Gate | Fails when |
|---|---|---|
| 1 | Old host gone | `complynepal` appears outside the documented exceptions: `SEO.md`, `SEO_IMPLEMENTATION_SUMMARY.md`, `deploy/REDIRECTS.md`, the host configs that implement the redirect, this file, `verify.py` itself, and the flagged contact address `support@complynepal.com` on a live page |
| 2 | Head contract | A page has more than one `<h1>`, a `<title>` over 60 characters, a description outside 140–158 characters, a missing/duplicate canonical, an `og:image` that is not absolute on `https://www.tarikh.tech`, an `hreflang` alternate or a `<meta name="keywords">` |
| 3 | One origin | A canonical, `og:url`, JSON-LD URL or sitemap `<loc>` does not start with `https://www.tarikh.tech`, or disagrees with the others |
| 4 | Links resolve | An internal link points at a file that does not exist, an `#anchor` that no element defines, `href="#"`, an `index.html` URL, or a relative `../` path |
| 5 | Structured data | A JSON-LD block does not parse, an `@id` reference never resolves, the FAQ schema text differs from the visible `#faq` copy, or a forbidden field is present (fake phone, `interactionStatistic`, `price: "0"`, `wordCount`, `foundingDate`, an unverified `sameAs`) |
| 6 | Reachability | An indexable page cannot be reached from the homepage within two clicks (orphans are printed) |
| 7 | Serves (`--serve`) | Any page returns a non-200 from the local server; a clean URL (`/features`, `/blog/nepal-court-hierarchy`) does not do exactly one 301 into its `index.html`; or `/does-not-exist` does not answer with `404.html` at status 404 carrying `noindex` (the local handler emulates the behaviour the host configs specify) |
| 8 | Images | A file in `assets/images` is over 300 KB, an `<img>` lacks `alt`/`width`/`height`, or anything but the hero carries `fetchpriority="high"` |
| 9 | Asset pipeline | `css/site.min.css` is missing or stale against its sources, a page links `/css/style.css`, `/css/responsive.css` or `/css/fonts.css` directly, a page still calls `fonts.googleapis.com` / `fonts.gstatic.com`, or the preloaded font is not in the repo |

## Companion scripts

| Script | Purpose |
|---|---|
| `python deploy/minify.py` | Rebuild `css/site.min.css` from `css/fonts.css` + `css/style.css` + `css/responsive.css`. Whitespace and comments only; the tool aborts if it would change anything else, and gate 9 fails if the bundle is stale. **Run it after every CSS edit.** |
| `python deploy/minify.py --check` | The same, without writing. CI-friendly. |
| `python deploy/build-sitemap.py` | Regenerate `sitemap.xml` with `lastmod` taken from `git log -1 --format=%cI -- <file>`. Run after adding, renaming or editing a page. |
| `python deploy/build-assets.py [icons\|thumbs\|hero\|all]` | Regenerate favicons, blog thumbnails and hero derivatives with Pillow. The hero master lives in `deploy/source-images/`, outside the published tree. |
| `node deploy/build-avif.cjs` | AVIF derivatives of the hero (Pillow cannot encode AVIF here). |
| `python deploy/fetch-fonts.py` | Re-download the Inter and Newsreader latin subsets into `assets/fonts` and regenerate `css/fonts.css`. Only needed if a family or weight changes. |
| `python deploy/_migrate_phase2.py` | Rebuild every `<head>`, header and footer from the templates in that script, then rewrite links. Safe to re-run; body copy is untouched. |

## What is not checked here

- The 301 map on the old subdomain (`deploy/REDIRECTS.md`) lives on the old host.
- The real HTTP 404 status depends on the host configuration, not on `404.html`.
- HSTS must be enabled only after HTTPS is confirmed on both hosts.
- The Rich Results Test and the Schema Markup Validator need a manual run after deploy.
- Lighthouse numbers: run them on the deployed site, not on `127.0.0.1` — see
  `SEO.md` for the local before/after measurements taken during the migration.

**Last reviewed:** October 16, 2026
