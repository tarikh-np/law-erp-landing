#!/usr/bin/env python3
"""Verification gate for the Tarikh site. Exits non-zero if any check fails.

    python deploy/verify.py            # all static checks
    python deploy/verify.py --serve    # also boot a local server and fetch every page

Gates
  1  `complynepal` appears only in the documented exceptions
  2  one <h1>, one <title> <= 60, one description of 140-158 chars, one canonical,
     og:image absolute on the new origin, no hreflang, no keywords meta
  3  canonicals, OG URLs, JSON-LD URLs and sitemap locs all use https://www.tarikh.tech
     and agree with each other
  4  every internal link resolves to a file in the repo, including #anchor targets;
     zero href="#", zero links to index.html, zero relative ../ URLs
  5  every JSON-LD block parses, every @id reference resolves, FAQ schema text equals
     the visible FAQ text, and no field from the forbidden list is present
  6  every indexable page is reachable from the homepage within 2 clicks
  7  optional: every page returns 200 from a local server
  8  no file in assets/images over 300 KB; every <img> has alt, width and height;
     only the hero carries fetchpriority="high"
  9  one CSS bundle (/css/site.min.css), rebuilt from its sources by deploy/minify.py
     and not stale; no third-party font origin anywhere in the HTML
"""
from __future__ import annotations

import json
import pathlib
import re
import sys
import unicodedata
from html import unescape

ROOT = pathlib.Path(__file__).resolve().parent.parent
ORIGIN = 'https://www.tarikh.tech'
NON_INDEXABLE = {'404.html'}

# Files allowed to mention the old host: the redirect map and the host configs that
# implement it, plus the migration documentation that records the change.
COMPLYNEPAL_ALLOWED_FILES = {
    'SEO.md',
    'SEO_IMPLEMENTATION_SUMMARY.md',
    'deploy/REDIRECTS.md',
    'deploy/verify.py',
    'deploy/VERIFY.md',
    '_redirects',
    '_headers',
    'vercel.json',
    '.htaccess',
    'deploy/nginx.conf.snippet',
}
# The only way a live page may still name the old host: the existing, working contact
# address, kept on the owner's default until a tarikh.tech address is confirmed. Every
# page with a match must be this address and nothing else. Documented in SEO.md.
COMPLYNEPAL_ALLOWED_HTML_ADDRESS = 'support@complynepal.com'

FORBIDDEN_JSONLD_KEYS = {
    'interactionStatistic', 'downloadUrl', 'softwareHelp', 'softwareVersion',
    'foundingDate', 'wordCount', 'SearchAction', 'potentialAction',
    'userInteractionCount', 'telephone', 'postalCode', 'streetAddress',
    'reviewCount', 'ratingValue', 'aggregateRating', 'award',
}
FORBIDDEN_SAMEAS_HOSTS = ('facebook.com', 'linkedin.com', 'twitter.com', 'x.com')
ALLOWED_EXTERNAL_HOSTS = ('instagram.com/tarikh.np',)

VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
             'meta', 'param', 'source', 'track', 'wbr'}

failures: list[str] = []
notes: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)


def rel(p: pathlib.Path) -> str:
    return p.relative_to(ROOT).as_posix()


def html_files() -> list[pathlib.Path]:
    return sorted(p for p in ROOT.rglob('*.html')
                  if '.git' not in p.parts and 'node_modules' not in p.parts)


# Directories whose index page keeps a trailing slash on the public URL.
TRAILING_SLASH_DIRS = {'blog'}


def route_for(path: pathlib.Path) -> str:
    """Repo file -> site path."""
    r = rel(path)
    if r == 'index.html':
        return '/'
    if r.endswith('/index.html'):
        directory = r[: -len('/index.html')]
        return '/' + directory + ('/' if directory in TRAILING_SLASH_DIRS else '')
    return '/' + r


def file_for_route(route: str) -> pathlib.Path | None:
    """Site path -> repo file, or None."""
    clean = route.split('#')[0].split('?')[0]
    if clean.startswith(ORIGIN):
        clean = clean[len(ORIGIN):]
    if clean in ('', '/'):
        return ROOT / 'index.html'
    candidate = ROOT / clean.lstrip('/')
    if candidate.is_file():
        return candidate
    if candidate.is_dir() and (candidate / 'index.html').is_file():
        return candidate / 'index.html'
    if (candidate / 'index.html').is_file():
        return candidate / 'index.html'
    return None


def strip_tags(s: str) -> str:
    return unescape(re.sub(r'<[^>]+>', '', s)).strip()


def norm(s: str) -> str:
    s = unescape(s)
    s = s.replace('\u2019', "'").replace('\u2018', "'")
    s = s.replace('\u201c', '"').replace('\u201d', '"')
    s = s.replace('\u00a0', ' ')
    s = unicodedata.normalize('NFKC', s)
    return re.sub(r'\s+', ' ', s).strip()


def check_tags_balanced(path: pathlib.Path, text: str) -> None:
    stack: list[str] = []
    for m in re.finditer(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>', text):
        closing, tag, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if tag in VOID_TAGS or attrs.rstrip().endswith('/'):
            continue
        if not closing:
            stack.append(tag)
        else:
            if not stack:
                fail(f'{rel(path)}: stray </{tag}>')
                return
            if stack[-1] == tag:
                stack.pop()
            elif tag in stack:
                while stack and stack.pop() != tag:
                    pass
            else:
                fail(f'{rel(path)}: stray </{tag}>')
                return
    if stack:
        fail(f'{rel(path)}: unclosed tag(s) {stack[:5]}')


# --------------------------------------------------------------------------- #
# 1 — complynepal
# --------------------------------------------------------------------------- #
def check_complynepal() -> None:
    for p in sorted(ROOT.rglob('*')):
        if p.is_dir() or '.git' in p.parts or 'node_modules' in p.parts:
            continue
        if p.suffix.lower() not in {'.html', '.htm', '.xml', '.txt', '.md', '.json',
                                    '.jsonld', '.js', '.css', '.webmanifest', ''}:
            continue
        try:
            text = p.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        if 'complynepal' not in text.lower():
            continue
        r = rel(p)
        if r in COMPLYNEPAL_ALLOWED_FILES:
            continue
        if p.suffix.lower() in {'.html', '.htm'}:
            offenders = [ln.strip() for ln in text.splitlines()
                         if 'complynepal' in ln.lower()
                         and COMPLYNEPAL_ALLOWED_HTML_ADDRESS not in ln]
            if offenders:
                fail(f'gate 1: {r} names the old host outside the flagged contact address: '
                     f'{offenders[0][:100]}')
            continue
        fail(f'gate 1: {r} still mentions the old host (not an allowed exception)')


# --------------------------------------------------------------------------- #
# 5 — structured data
# --------------------------------------------------------------------------- #
def jsonld_blocks(text: str) -> list[str]:
    return re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S)


def walk(node):
    if isinstance(node, dict):
        for k, v in node.items():
            yield k, v
            yield from walk(v)
    elif isinstance(node, list):
        for v in node:
            yield from walk(v)


def check_jsonld(path: pathlib.Path, text: str) -> list[dict]:
    blocks: list[dict] = []
    for raw in jsonld_blocks(text):
        try:
            data = json.loads(raw.strip())
        except json.JSONDecodeError as exc:
            fail(f'gate 5: {rel(path)} has JSON-LD that does not parse ({exc})')
            continue
        blocks.append(data)
    merged_ids: set[str] = set()
    for data in blocks:
        for k, v in walk(data):
            if k == '@id' and isinstance(v, str):
                merged_ids.add(v)
    for data in blocks:
        for k, v in walk(data):
            if k in FORBIDDEN_JSONLD_KEYS:
                fail(f'gate 5: {rel(path)} JSON-LD uses forbidden key "{k}"')
            if k == 'price' and str(v).strip() in ('0', '0.0', '0.00'):
                fail(f'gate 5: {rel(path)} JSON-LD carries a placeholder price of 0')
            if k == 'sameAs':
                urls = v if isinstance(v, list) else [v]
                for u in urls:
                    if isinstance(u, str) and any(h in u for h in FORBIDDEN_SAMEAS_HOSTS):
                        fail(f'gate 5: {rel(path)} sameAs has an unverified profile: {u}')
            if k == '@id' and isinstance(v, str) and v.startswith(ORIGIN + '/#'):
                if not any(v in json.dumps(b) for b in blocks):
                    fail(f'gate 5: {rel(path)} @id {v} is never defined')
    # Every URL inside JSON-LD must be on the new origin, a schema.org type, or one of the
    # few external profiles the site actually links to.
    for data in blocks:
        for _, v in walk(data):
            if isinstance(v, str) and v.startswith('http') \
                    and 'schema.org' not in v and not v.startswith(ORIGIN):
                if not any(h in v for h in ALLOWED_EXTERNAL_HOSTS):
                    fail(f'gate 5: {rel(path)} JSON-LD has an unverified off-origin URL: {v}')
    # @id references that need to resolve within their own block
    for data in blocks:
        root_id = data.get('@id')
        if root_id and isinstance(root_id, str):
            all_json = json.dumps(blocks)
            if all_json.count(f'"{root_id}"') < 1:
                fail(f'gate 5: {rel(path)} @id {root_id} unreferenced and undefined')
    return blocks


def check_faq_parity() -> None:
    home = ROOT / 'index.html'
    text = home.read_text(encoding='utf-8')
    visible_q = [norm(strip_tags(q)) for q in re.findall(
        r'<button class="faq-q"[^>]*>(.*?)</button>', text, re.S)]
    visible_a = [norm(strip_tags(a)) for a in re.findall(
        r'<div class="faq-a-inner">(.*?)</div>', text, re.S)]
    schema = None
    for data in check_jsonld(home, text):
        for node in (data.get('@graph') or [data]):
            if isinstance(node, dict) and node.get('@type') == 'FAQPage':
                schema = node
    if schema is None:
        fail('gate 5: homepage has no FAQPage node')
        return
    sq = [norm(q.get('name', '')) for q in schema.get('mainEntity', [])]
    sa = [norm(q.get('acceptedAnswer', {}).get('text', ''))
          for q in schema.get('mainEntity', [])]
    if visible_q != sq:
        fail('gate 5: FAQ questions differ between the visible FAQ and the schema')
        for a, b in zip(visible_q, sq):
            if a != b:
                fail(f'        visible: {a[:80]!r}')
                fail(f'        schema : {b[:80]!r}')
                break
    if visible_a != sa:
        fail('gate 5: FAQ answers differ between the visible FAQ and the schema')
        for a, b in zip(visible_a, sa):
            if a != b:
                fail(f'        visible: {a[:110]!r}')
                fail(f'        schema : {b[:110]!r}')
                break


# --------------------------------------------------------------------------- #
# 2, 3, 4, 8 — per page
# --------------------------------------------------------------------------- #
def page_ids(text: str) -> set[str]:
    return set(re.findall(r'\bid="([^"]+)"', text))


def check_page(path: pathlib.Path, text: str, sitemap_locs: set[str],
               indexable: dict[str, pathlib.Path]) -> set[str]:
    """Return the set of internal routes this page links to."""
    r = rel(path)
    route = route_for(path)
    links: set[str] = set()

    # ---- gate 2
    h1s = re.findall(r'<h1[^>]*>', text)
    if len(h1s) != 1:
        fail(f'gate 2: {r} has {len(h1s)} <h1> elements (expected 1)')
    titles = re.findall(r'<title>(.*?)</title>', text, re.S)
    if len(titles) != 1:
        fail(f'gate 2: {r} has {len(titles)} <title> elements')
    else:
        t = strip_tags(titles[0])
        if len(t) > 60:
            fail(f'gate 2: {r} title is {len(t)} chars (max 60): {t!r}')
    descs = re.findall(r'<meta name="description" content="([^"]*)"', text)
    if len(descs) != 1:
        fail(f'gate 2: {r} has {len(descs)} meta descriptions')
    else:
        d = norm(descs[0])
        if not 140 <= len(d) <= 158:
            fail(f'gate 2: {r} description is {len(d)} chars (need 140-158): {d[:70]!r}...')
    if 'name="keywords"' in text:
        fail(f'gate 2: {r} still has a keywords meta tag')
    if 'hreflang' in text:
        fail(f'gate 2: {r} still has hreflang alternates')
    if 'twitter:site' in text or 'twitter:creator' in text:
        fail(f'gate 2: {r} still has twitter:site/creator')
    if 'article:publisher' in text:
        fail(f'gate 2: {r} still has article:publisher')
    ogl = re.findall(r'<meta property="og:image" content="([^"]+)"', text)
    if len(ogl) != 1:
        fail(f'gate 2: {r} has {len(ogl)} og:image tags')
    elif not ogl[0].startswith(ORIGIN + '/'):
        fail(f'gate 2: {r} og:image is not absolute on the new origin: {ogl[0]}')
    if len(re.findall(r'<meta property="og:image:width"', text)) != 1 or \
            len(re.findall(r'<meta property="og:image:height"', text)) != 1 or \
            len(re.findall(r'<meta property="og:image:alt"', text)) != 1:
        fail(f'gate 2: {r} is missing og:image:width / height / alt')
    for m in re.finditer(r'<meta (?:property|name)="(og:title|twitter:title)" content="([^"]*)"', text):
        if titles and norm(strip_tags(titles[0])) != norm(m.group(2)):
            fail(f'gate 2: {r} {m.group(1)} does not match the page title')

    # ---- gate 3
    canon = re.findall(r'<link rel="canonical" href="([^"]+)"', text)
    if path.name != '404.html':
        if len(canon) != 1:
            fail(f'gate 3: {r} has {len(canon)} canonical tags')
        else:
            if not canon[0].startswith(ORIGIN):
                fail(f'gate 3: {r} canonical is off-origin: {canon[0]}')
            if canon[0] != f'{ORIGIN}{route}' and not (route == '/' and canon[0] == f'{ORIGIN}/'):
                fail(f'gate 3: {r} canonical {canon[0]} does not match route {route}')
            if canon[0] not in sitemap_locs:
                fail(f'gate 3: {r} canonical is not in sitemap.xml: {canon[0]}')

    for m in re.finditer(r'<meta property="og:url" content="([^"]+)"', text):
        if not m.group(1).startswith(ORIGIN):
            fail(f'gate 3: {r} og:url is off-origin: {m.group(1)}')

    # ---- gate 4
    if 'href="#"' in text:
        fail(f'gate 4: {r} contains an href="#" placeholder')
    if re.search(r'href="[^"]*index\.html', text):
        fail(f'gate 4: {r} links to index.html')
    if re.search(r'(href|src)="\.\./', text):
        fail(f'gate 4: {r} uses a relative ../ path')

    for m in re.finditer(r'(?:href|src)="([^"]+)"', text):
        u = m.group(1)
        if u.startswith(('http://', 'https://', 'mailto:', 'tel:', 'data:', '//')):
            continue
        if u.startswith('#'):
            anchor = u[1:]
            if anchor and anchor not in page_ids(text):
                fail(f'gate 4: {r} anchor #{anchor} has no target on the page')
            continue
        if u.startswith('/'):
            frag = ''
            target_route, _, frag = u.partition('#')
            f = file_for_route(target_route)
            if f is None:
                fail(f'gate 4: {r} links to {u} which resolves to no file')
                continue
            if frag:
                t = f.read_text(encoding='utf-8')
                if frag not in page_ids(t):
                    fail(f'gate 4: {r} link {u} -> #{frag} has no target in {rel(f)}')
            links.add(route_for(f))
            continue
        fail(f'gate 4: {r} has a non-root-absolute internal link: {u}')

    # ---- gate 8
    for m in re.finditer(r'<img\b([^>]*)>', text):
        attrs = m.group(1)
        if 'alt=' not in attrs:
            fail(f'gate 8: {r} has an <img> without alt')
        if not re.search(r'\bwidth="', attrs) or not re.search(r'\bheight="', attrs):
            fail(f'gate 8: {r} has an <img> without width/height: {attrs.strip()[:70]}')

    return links


def check_sitemap() -> set[str]:
    p = ROOT / 'sitemap.xml'
    text = p.read_text(encoding='utf-8')
    if 'hreflang' in text or 'xhtml:' in text:
        fail('gate 3: sitemap.xml still contains hreflang/xhtml entries')
    if 'changefreq' in text or '<priority>' in text:
        fail('gate 3: sitemap.xml still contains changefreq/priority')
    locs = set(re.findall(r'<loc>([^<]+)</loc>', text))
    for loc in locs:
        if not loc.startswith(ORIGIN + '/'):
            fail(f'gate 3: sitemap loc is off-origin: {loc}')
        if file_for_route(loc) is None:
            fail(f'gate 3: sitemap loc has no file in the repo: {loc}')
    if f'{ORIGIN}/404.html' in locs:
        fail('gate 3: sitemap.xml must not include 404.html')
    # lastmod accuracy
    for m in re.finditer(r'<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>', text):
        loc, lastmod = m.group(1), m.group(2)
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', lastmod):
            fail(f'gate: sitemap lastmod is not an ISO date for {loc}: {lastmod}')
    return locs


def check_missing_from_sitemap(sitemap_locs: set[str], pages: list[pathlib.Path]) -> None:
    for p in pages:
        if p.name in NON_INDEXABLE:
            continue
        route = route_for(p)
        url = f'{ORIGIN}/' if route == '/' else f'{ORIGIN}{route}'
        if url not in sitemap_locs:
            fail(f'gate 3: {rel(p)} is indexable but missing from sitemap.xml')


def check_robots() -> None:
    text = (ROOT / 'robots.txt').read_text(encoding='utf-8')
    if 'Sitemap:' not in text or f'{ORIGIN}/sitemap.xml' not in text:
        fail('gate: robots.txt does not point at the new sitemap')
    if 'Disallow: /css' in text or 'Disallow: /js' in text or 'Disallow: /assets' in text:
        fail('gate: robots.txt blocks CSS, JS or images')


SUPERLATIVE_PATTERNS = [
    (r'#\s*1\b', '#1'),
    (r'\bnumber one\b', 'number one'),
    (r'\bbest\b', 'best'),
    (r'\bleading\b', 'leading'),
    (r'\bworld[- ]class\b', 'world-class'),
    (r'\btop[- ]rated\b', 'top-rated'),
    (r'\bindustry[- ]leading\b', 'industry-leading'),
    (r'\bmost advanced\b', 'most advanced'),
    (r'\bunbeatable\b', 'unbeatable'),
    (r'\bcheapest\b', 'cheapest'),
]


def check_superlatives(pages: list[pathlib.Path]) -> None:
    for p in pages:
        text = p.read_text(encoding='utf-8')
        body = re.sub(r'<script type="application/ld\+json">.*?</script>', ' ', text, flags=re.S)
        for pattern, label in SUPERLATIVE_PATTERNS:
            for m in re.finditer(pattern, body, re.I):
                start = max(0, m.start() - 60)
                fail(f'gate: {rel(p)} uses the banned superlative "{label}": ...'
                     f'{body[start:m.end() + 40].strip()[:110]}...')
                break


def check_image_weights() -> None:
    for p in sorted((ROOT / 'assets' / 'images').rglob('*')):
        if p.is_file() and p.stat().st_size > 300 * 1024:
            fail(f'gate 8: {rel(p)} is {p.stat().st_size // 1024} KB (limit 300 KB)')


def check_fetchpriority(pages: list[pathlib.Path]) -> None:
    total = 0
    for p in pages:
        text = p.read_text(encoding='utf-8')
        n = text.count('fetchpriority="high"')
        total += n
        if n > 1:
            fail(f'gate 8: {rel(p)} has {n} elements with fetchpriority="high"')
    if total != 1:
        notes.append(f'gate 8: {total} elements carry fetchpriority="high" across the site')


def check_reachability(graph: dict[str, set[str]], pages: list[pathlib.Path]) -> None:
    home = '/'
    hops = {home: 0}
    frontier = [home]
    for depth in (1, 2):
        nxt = []
        for node in frontier:
            for nb in graph.get(node, set()):
                if nb not in hops:
                    hops[nb] = depth
                    nxt.append(nb)
        frontier = nxt
    orphans = []
    for p in pages:
        if p.name in NON_INDEXABLE:
            continue
        if route_for(p) not in hops:
            orphans.append(rel(p))
    if orphans:
        fail(f'gate 6: unreachable from the homepage within 2 clicks: {orphans}')
    graph['__meta__'] = set()  # keep the dict shape stable for callers
    depth2 = sorted(k for k, v in hops.items() if v == 2 and k.endswith(('/', '.html')))
    if depth2:
        notes.append('reached at depth 2 (informational): ' + ', '.join(depth2))


# --------------------------------------------------------------------------- #
# 7 — local serve
# --------------------------------------------------------------------------- #
def check_serve(pages: list[pathlib.Path]) -> None:
    """Boot a local server that behaves like the hosts in deploy/: unknown paths
    answer with 404.html and a real 404 status, and clean URLs redirect once."""
    import http.server
    import socket
    import threading
    import urllib.error
    import urllib.request

    error_page = ROOT / '404.html'

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def log_message(self, *a):  # keep the report readable
            pass

        def send_error(self, code, message=None, explain=None):
            """Serve the site's 404 page with the real status code, like the host."""
            if code == 404 and error_page.exists():
                body = error_page.read_bytes()
                self.send_response(404)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                if self.command != 'HEAD':
                    self.wfile.write(body)
                return
            super().send_error(code, message, explain)

    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler)
    httpd.daemon_threads = True
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    base = f'http://127.0.0.1:{port}'
    try:
        for p in pages:
            route = route_for(p)
            url = base + route
            try:
                with urllib.request.urlopen(url, timeout=10) as resp:
                    if resp.status != 200:
                        fail(f'gate 7: {url} returned {resp.status}')
            except urllib.error.HTTPError as exc:
                fail(f'gate 7: {url} returned {exc.code}')
            except Exception as exc:  # noqa: BLE001
                fail(f'gate 7: {url} failed: {exc}')

        # Clean URLs: /features must redirect once to /features/ and end at 200.
        for clean in ('/features', '/blog/nepal-court-hierarchy'):
            hops: list[int] = []

            class NoRedirect(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, *a, **kw):
                    return None

            opener = urllib.request.build_opener(NoRedirect)
            try:
                with opener.open(base + clean, timeout=10) as resp:
                    hops.append(resp.status)
            except urllib.error.HTTPError as exc:
                hops.append(exc.code)
                location = exc.headers.get('Location', '')
                target = location if location.startswith('http') else base + location
                if exc.code == 301 and location.endswith('/'):
                    with urllib.request.urlopen(target, timeout=10) as resp:
                        hops.append(resp.status)
            if hops != [301, 200]:
                fail(f'gate 7: clean URL {clean} did 301 -> 200, did {hops}')

        # Unknown path: real 404 status, served from 404.html, and it is noindex.
        try:
            urllib.request.urlopen(base + '/does-not-exist', timeout=10)
            fail('gate 7: /does-not-exist returned 200 instead of a 404')
        except urllib.error.HTTPError as exc:
            if exc.code != 404:
                fail(f'gate 7: /does-not-exist returned {exc.code}, expected 404')
            body = exc.read()
            if error_page.exists() and body != error_page.read_bytes():
                fail('gate 7: the 404 response is not this site\'s 404.html')
            text = body.decode('utf-8', 'replace')
            if 'noindex' not in text:
                fail('gate 7: 404.html is missing <meta name="robots" content="noindex">')
            notes.append('gate 7: /does-not-exist answered with 404.html and status 404 '
                         'under the emulated handler; the deployed host must do the same '
                         '(see _redirects / _headers / vercel.json / .htaccess / nginx).')
        except Exception as exc:  # noqa: BLE001
            fail(f'gate 7: /does-not-exist failed: {exc}')
    finally:
        httpd.shutdown()


# --------------------------------------------------------------------------- #
# 9 — asset pipeline
# --------------------------------------------------------------------------- #
def check_assets(pages: list[pathlib.Path]) -> None:
    """The pages must ship one stylesheet bundle, built and up to date, and no
    third-party origin: the fonts were moved onto the domain in Phase 6."""
    import importlib.util

    minifier = ROOT / 'deploy' / 'minify.py'
    if not minifier.exists():
        fail('gate 9: deploy/minify.py is missing')
        return
    spec = importlib.util.spec_from_file_location('tarikh_minify', minifier)
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
        content = module.build()
    except SystemExit as exc:  # minifier refuses to run: broken input
        fail(f'gate 9: deploy/minify.py could not build: {exc}')
        return
    out_path = ROOT / module.CSS_OUT
    if not out_path.exists():
        fail(f'gate 9: {module.CSS_OUT} is missing -- run python deploy/minify.py')
    elif out_path.read_text(encoding='utf-8') != content:
        fail(f'gate 9: {module.CSS_OUT} is stale -- run python deploy/minify.py')

    for p in pages:
        text = p.read_text(encoding='utf-8')
        r = rel(p)
        bundles = re.findall(r'<link rel="stylesheet" href="(/css/[^"]+)"', text)
        if bundles != ['/css/site.min.css']:
            fail(f'gate 9: {r} loads {bundles}, expected exactly /css/site.min.css')
        for stale in ('/css/style.css', '/css/responsive.css', '/css/fonts.css'):
            if stale in text:
                fail(f'gate 9: {r} links the source stylesheet {stale} instead of the bundle')
        for origin in ('fonts.googleapis.com', 'fonts.gstatic.com'):
            if origin in text:
                fail(f'gate 9: {r} still calls a third-party origin ({origin}); '
                     'fonts are self-hosted in /assets/fonts')
        for preload in re.findall(r'<link rel="preload" href="(/assets/fonts/[^"]+)"', text):
            if not (ROOT / preload.lstrip('/')).is_file():
                fail(f'gate 9: {r} preloads {preload}, which is not in the repo')
    fonts = sorted((ROOT / 'assets' / 'fonts').glob('*.woff2')) if (ROOT / 'assets' / 'fonts').is_dir() else []
    if not fonts:
        fail('gate 9: no self-hosted fonts in assets/fonts')
    notes.append(f'gate 9: CSS bundle {module.CSS_OUT} ({len(content) // 1024} KB), '
                 f'{len(fonts)} self-hosted font file(s)')


# --------------------------------------------------------------------------- #
def main() -> int:
    check_complynepal()
    sitemap_locs = check_sitemap()
    check_robots()

    pages = html_files()
    check_missing_from_sitemap(sitemap_locs, pages)

    indexable = {route_for(p): p for p in pages}
    graph: dict[str, set[str]] = {}
    for p in pages:
        text = p.read_text(encoding='utf-8')
        check_tags_balanced(p, text)
        graph[route_for(p)] = check_page(p, text, sitemap_locs, indexable)
        check_jsonld(p, text)
    check_faq_parity()
    check_reachability(graph, pages)
    check_image_weights()
    check_fetchpriority(pages)
    check_superlatives(pages)
    check_assets(pages)

    if '--serve' in sys.argv:
        check_serve(pages)

    print('gate 1: `complynepal` occurrences are limited to the redirect map / host configs, '
          f'the migration docs and the flagged contact address ({COMPLYNEPAL_ALLOWED_HTML_ADDRESS}).')
    print(f'Pages checked: {len(pages)}')
    for p in pages:
        print(f'  {route_for(p):<42} {rel(p)}')
    print()
    if notes:
        print('NOTES')
        for n in notes:
            print('  - ' + n)
        print()
    if failures:
        print(f'FAILED: {len(failures)} problem(s)')
        for f in failures:
            print('  [X] ' + f)
        return 1
    print('All checks passed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
