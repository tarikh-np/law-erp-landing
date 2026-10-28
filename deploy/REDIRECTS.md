# Redirect map — moving `tarikh.complynepal.com` to `www.tarikh.tech`

**This file is outside the repo's reach.** The redirects below have to be configured on the
host that serves `tarikh.complynepal.com`. Nothing in this repository can make them happen.

## The rule

Keep the old subdomain **live and redirecting for at least 12 months**. Specifically:

- **Do not delete it.**
- **Do not let it 404.**
- **Do not leave it serving a duplicate copy of the site** — a page that is reachable on two
  hosts with no canonical between them splits whatever signal the old subdomain has built up,
  and there is no change-of-address tool available for most subdomain moves to lean on.

Every old URL maps **1:1** to its new URL with a **301** (permanent), preserving the path. The
`.html` extension is dropped because the new domain has no history and this is the cheapest
moment to make the change.

## The map

| Old URL (on `tarikh.complynepal.com`)                  | New URL (canonical)                                    | Status |
|--------------------------------------------------------|--------------------------------------------------------|--------|
| `https://tarikh.complynepal.com/`                       | `https://www.tarikh.tech/`                             | 301    |
| `https://tarikh.complynepal.com/index.html`             | `https://www.tarikh.tech/`                             | 301    |
| `https://tarikh.complynepal.com/features.html`          | `https://www.tarikh.tech/features`                     | 301    |
| `https://tarikh.complynepal.com/pricing.html`           | `https://www.tarikh.tech/pricing`                      | 301    |
| `https://tarikh.complynepal.com/privacy.html`           | `https://www.tarikh.tech/privacy`                      | 301    |
| `https://tarikh.complynepal.com/terms.html`             | `https://www.tarikh.tech/terms`                        | 301    |
| `https://tarikh.complynepal.com/blog/`                  | `https://www.tarikh.tech/blog/`                        | 301    |
| `https://tarikh.complynepal.com/blog/index.html`        | `https://www.tarikh.tech/blog/`                        | 301    |
| `https://tarikh.complynepal.com/blog/blog-post-nepal-court-hierarchy.html` | `https://www.tarikh.tech/blog/nepal-court-hierarchy` | 301 |
| `http://tarikh.complynepal.com/<anything>`              | `https://www.tarikh.tech/<anything>`                   | 301    |
| **catch-all**: anything else, including paths that never existed | `https://www.tarikh.tech/`              | 301    |

The catch-all matters. Old crawls and old shares will include URLs that are not on this list —
including ones with trailing slashes, query strings and `www.` variants.

---

## Ready-to-paste snippets

### Apache / cPanel (`.htaccess` on the old host)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  # https for everything first
  RewriteCond %{HTTPS} !=on
  RewriteRule ^(.*)$ https://www.tarikh.tech/$1 [R=301,L]

  # 1:1 path-preserving map
  RewriteRule ^index\.html$                                https://www.tarikh.tech/                           [R=301,L]
  RewriteRule ^features\.html$                             https://www.tarikh.tech/features                   [R=301,L]
  RewriteRule ^pricing\.html$                              https://www.tarikh.tech/pricing                    [R=301,L]
  RewriteRule ^privacy\.html$                              https://www.tarikh.tech/privacy                    [R=301,L]
  RewriteRule ^terms\.html$                                https://www.tarikh.tech/terms                      [R=301,L]
  RewriteRule ^blog/index\.html$                           https://www.tarikh.tech/blog/                      [R=301,L]
  RewriteRule ^blog/blog-post-nepal-court-hierarchy\.html$ https://www.tarikh.tech/blog/nepal-court-hierarchy [R=301,L]

  # catch-all: every other path, one hop, no 404s left behind
  RewriteRule ^(.*)$ https://www.tarikh.tech/$1 [R=301,L]
</IfModule>
```

### nginx (old host)

```nginx
server {
    listen      80;
    listen      [::]:80;
    server_name tarikh.complynepal.com;
    return 301 https://www.tarikh.tech$request_uri;
}

server {
    listen              443 ssl;
    listen              [::]:443 ssl;
    http2               on;
    server_name         tarikh.complynepal.com;

    ssl_certificate     /etc/letsencrypt/live/tarikh.complynepal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tarikh.complynepal.com/privkey.pem;

    # 1:1 map. Match the old .html paths exactly first, then catch everything else.
    location = /                             { return 301 https://www.tarikh.tech/; }
    location = /index.html                   { return 301 https://www.tarikh.tech/; }
    location = /features.html                { return 301 https://www.tarikh.tech/features; }
    location = /pricing.html                 { return 301 https://www.tarikh.tech/pricing; }
    location = /privacy.html                 { return 301 https://www.tarikh.tech/privacy; }
    location = /terms.html                   { return 301 https://www.tarikh.tech/terms; }
    location = /blog/                        { return 301 https://www.tarikh.tech/blog/; }
    location = /blog/index.html              { return 301 https://www.tarikh.tech/blog/; }
    location = /blog/blog-post-nepal-court-hierarchy.html {
        return 301 https://www.tarikh.tech/blog/nepal-court-hierarchy;
    }

    # catch-all
    location / {
        return 301 https://www.tarikh.tech$request_uri;
    }
}
```

### Netlify / Cloudflare Pages (`_redirects` on the old-host project)

```
/index.html                                https://www.tarikh.tech/                         301
/features.html                             https://www.tarikh.tech/features                 301
/pricing.html                              https://www.tarikh.tech/pricing                  301
/privacy.html                              https://www.tarikh.tech/privacy                  301
/terms.html                                https://www.tarikh.tech/terms                    301
/blog/index.html                           https://www.tarikh.tech/blog/                    301
/blog/blog-post-nepal-court-hierarchy.html https://www.tarikh.tech/blog/nepal-court-hierarchy 301
/*                                         https://www.tarikh.tech/:splat                   301
```

On both platforms that file belongs to the project that is bound to the **old** host, not the new
one. The repo-root `_redirects` in this project is for the new host and does something different
(it maps old flat paths on `www.tarikh.tech` itself).

### Vercel (old-host project `vercel.json`)

```json
{
  "redirects": [
    { "source": "/index.html", "destination": "https://www.tarikh.tech/", "permanent": true },
    { "source": "/features.html", "destination": "https://www.tarikh.tech/features", "permanent": true },
    { "source": "/pricing.html", "destination": "https://www.tarikh.tech/pricing", "permanent": true },
    { "source": "/privacy.html", "destination": "https://www.tarikh.tech/privacy", "permanent": true },
    { "source": "/terms.html", "destination": "https://www.tarikh.tech/terms", "permanent": true },
    { "source": "/blog/index.html", "destination": "https://www.tarikh.tech/blog/", "permanent": true },
    {
      "source": "/blog/blog-post-nepal-court-hierarchy.html",
      "destination": "https://www.tarikh.tech/blog/nepal-court-hierarchy",
      "permanent": true
    },
    { "source": "/(.*)", "destination": "https://www.tarikh.tech/$1", "permanent": true }
  ]
}
```

On Vercel the cleanest option is to keep the old project connected to the old domain and add this
file, or add `tarikh.complynepal.com` as a domain on the **new** project and let the apex/domain
settings redirect it. Either way, exactly one hop.

---

## Verify it, on the old host, the day you go live

Each command must show **one** `301` and then a `200`. Two or more redirects is a problem:
search engines and browsers both handle a single hop far better, and chains are a common cause of
"the old page still shows up" complaints.

```bash
for u in \
  https://tarikh.complynepal.com/ \
  https://tarikh.complynepal.com/index.html \
  https://tarikh.complynepal.com/features.html \
  https://tarikh.complynepal.com/pricing.html \
  https://tarikh.complynepal.com/privacy.html \
  https://tarikh.complynepal.com/terms.html \
  https://tarikh.complynepal.com/blog/ \
  https://tarikh.complynepal.com/blog/blog-post-nepal-court-hierarchy.html \
  https://tarikh.complynepal.com/some-page-that-never-existed ; do
  printf '%-70s ' "$u"
  curl -sIL -o /dev/null -w '%{http_code} -> %{redirect_url}\n' "$u"
done
```

Then confirm the destination is the canonical host, with no second hop:

```bash
curl -sIL https://tarikh.complynepal.com/features.html | grep -Ei '^(HTTP/|location:)'
```

Expected:

```
HTTP/2 301
location: https://www.tarikh.tech/features
HTTP/2 200
```

Finally, confirm the old host is not serving a second copy of the site:

```bash
curl -sIL https://tarikh.complynepal.com/ | grep -Ei '^(HTTP/|location:)'
curl -s https://tarikh.complynepal.com/features.html | head -c 200   # must be an empty body / redirect page, not the real HTML
```

And that HTTP on the new host collapses to one hop:

```bash
curl -sIL http://tarikh.tech/ | grep -Ei '^(HTTP/|location:)'
# expect: 301 -> https://www.tarikh.tech/
```

---

## Recommended host for `www.tarikh.tech`

The repo now ships config for **Netlify / Cloudflare Pages** (`_redirects`, `_headers`),
**Vercel** (`vercel.json`), **Apache / cPanel** (`.htaccess`) and **nginx**
(`deploy/nginx.conf.snippet`). Pick the one that matches where the domain points.

**Recommendation: Vercel.** For a static site with no build step it is the least work — connect
the git repo, it deploys on push, TLS is automatic on both hosts, and the apex → www redirect is a
checkbox in *Project → Settings → Domains* rather than something you maintain in a config file.
`vercel.json` in this repo already carries the redirects and headers. Note that Vercel's free
Hobby tier is for non-commercial projects; a commercial site needs Pro.

Cloudflare Pages is a close second and is a good choice if the domain's DNS is already on
Cloudflare — `_redirects` and `_headers` in this repo work as-is and the apex redirect is a
redirect rule in the dashboard.

**TODO(owner): confirm which of these is actually hosting `tarikh.tech`, and delete the config
files for the other platforms** so nobody edits the wrong one later. The configs are deliberately
duplicated right now because the prompt that produced this migration did not name a host.
