# Tarikh — SEO Implementation Summary

**Canonical origin:** `https://www.tarikh.tech` (apex `tarikh.tech` → 301 → `www`)
**Received:** the site moved from the subdomain `tarikh.complynepal.com`. The old host stays live, 301-redirecting, for at least 12 months.
**Instagram:** `@tarikh.np`
**Last updated:** October 16, 2026 — see `SEO.md` for the master reference and `deploy/REDIRECTS.md` for the host-level redirect map.

> This file is a per-phase change log. It replaces the earlier summary, which described a
> different set of tags (keyword meta, hreflang set, `#1` positioning, `interactionStatistic`,
> `price: "0"`, and FAQ/feature counts that did not match the live page). Those items have been
> removed from the site, so they are no longer described here.

---

## Phase 0 — Inventory

- `grep -rIn "complynepal" --exclude-dir=.git .` → **138 matches across 11 files** (HTML heads, JSON-LD, `robots.txt`, `sitemap.xml`, both SEO docs). Full per-file list in `SEO.md` §3.
- No hosting-platform file existed in the repo (`_redirects`, `_headers`, `vercel.json`, `netlify.toml`, `.htaccess`, `nginx.conf`, `Dockerfile`, CI). Config for every common host is now provided in `deploy/` and at the repo root; the host still needs confirming.
- `.freebuff/` is not tracked by git and stays in `.gitignore`.

## Phase 1 — Domain replacement

- All absolute URLs now use `https://www.tarikh.tech`.
- Homepage `dns-prefetch` to our own origin deleted.
- `privacy.html` and `terms.html` body links updated (text and `href`).
- Old Search Console token kept; commented placeholders added for the new Google property token and for Bing `msvalidate.01`.
- Contact email: the existing working address is kept and flagged as `TODO(owner)`. No address was invented.
- `SEO.md` and this file rewritten; stale "CHANGE TO NEW DOMAIN" notes deleted.

## Phases 2–7

See `SEO.md` §4 for the per-phase detail and `deploy/VERIFY.md` for the automated gate.
