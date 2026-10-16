#!/usr/bin/env python3
"""One-off migration generator for the tarikh.tech SEO pass.

Rebuilds the <head>, site header and site footer on every page, and rewrites
internal links to root-absolute clean URLs. Safe to re-run: it always starts
from the committed HTML and replaces whole blocks.
"""

import json
import pathlib
import re
from html import escape as html_escape

ROOT = pathlib.Path('.')
ORIGIN = 'https://www.tarikh.tech'
OG_IMAGE = f'{ORIGIN}/assets/images/og-cover.png'
ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

# --------------------------------------------------------------------------- #
# Page config
# --------------------------------------------------------------------------- #
PAGES = {
    'index.html': dict(
        route='/',
        title='Tarikh — Law ERP & Case Management Software for Nepal',
        desc="Tarikh is legal practice management software for Nepal's law firms: matters, court hearings, Peshi dates, clients, documents and NPR billing.",
        og_type='website',
        og_alt='Tarikh law ERP dashboard showing open matters, upcoming court hearings and billing in NPR',
        verification=True,
    ),
    'features/index.html': dict(
        route='/features',
        title='Features — Case, Hearing & Billing Management | Tarikh',
        desc="How Tarikh handles matter files, court hearing and Peshi tracking, client records, documents, NPR invoicing, roles and audit logs for Nepal's firms.",
        og_type='website',
        og_alt='Tarikh features for law firms in Nepal: matter management, court hearings, documents and billing',
    ),
    'pricing/index.html': dict(
        route='/pricing',
        title='Pricing | Tarikh Law Firm Software Nepal',
        desc='Tarikh pricing for Nepal law firms: every plan includes matters, court hearing tracking, documents, NPR billing and support. Contact us for a quote.',
        og_type='website',
        og_alt='Tarikh pricing page for legal practice management software in Nepal',
    ),
    'about/index.html': dict(
        route='/about',
        title='About Tarikh | Law ERP & Practice Management for Nepal',
        desc="Tarikh is law ERP and legal practice management software for Nepal's law firms, built by Comply Nepal in Kathmandu around Peshi dates and the BS calendar.",
        og_type='website',
        og_alt='About Tarikh, legal practice management software for law firms in Nepal',
    ),
    'contact/index.html': dict(
        route='/contact',
        title='Contact Tarikh | Book a Demo for Your Law Firm',
        desc='Book a demo of Tarikh, ask about pricing for your law firm, or send a support question. Reach the Tarikh team in Kathmandu by email or on Instagram.',
        og_type='website',
        og_alt='Contact the Tarikh team to book a demo of the law ERP platform',
    ),
    'privacy/index.html': dict(
        route='/privacy',
        title='Privacy Policy | Tarikh',
        desc='How Tarikh collects, uses, stores and shares information when your firm uses our legal practice management platform, including your rights and contacts.',
        og_type='website',
        og_alt='Tarikh privacy policy for the legal practice management platform',
    ),
    'terms/index.html': dict(
        route='/terms',
        title='Terms of Service | Tarikh',
        desc='The terms governing access to and use of Tarikh, the legal practice management and law ERP platform for law firms in Nepal, including accounts and billing.',
        og_type='website',
        og_alt='Tarikh terms of service for the legal practice management platform',
    ),
    '404.html': dict(
        route='/404.html',
        title='Page not found | Tarikh',
        desc='The page you asked for is not here. Tarikh has moved to www.tarikh.tech — head back to the home page or jump to features, pricing or the blog from here.',
        og_type='website',
        og_alt='Tarikh — page not found',
        robots='noindex, follow',
        no_canonical=True,
    ),
    'blog/index.html': dict(
        route='/blog/',
        title='Nepal Legal Tech & Law Firm Insights | Tarikh Blog',
        desc="Practical guides for Nepal's law firms on case management, Peshi and Tarikh dates, Bikram Samvat scheduling, NPR billing, documents and legal technology.",
        og_type='website',
        og_alt='Tarikh blog — Nepal legal tech and law firm insights',
    ),
    'blog/nepal-court-hierarchy/index.html': dict(
        route='/blog/nepal-court-hierarchy',
        title='Nepal Court Hierarchy Explained | Tarikh Blog',
        desc="A plain-English guide to Nepal's court hierarchy from the Tarikh blog: Supreme Court, High Courts, District Courts and what each level means.",
        og_type='article',
        og_alt='Nepal court hierarchy: Supreme Court, High Courts and District Courts',
        article=dict(published='2026-09-01', section='Nepal Court System'),
    ),
    'blog/peshi-tarikh-date-tracking/index.html': dict(
        route='/blog/peshi-tarikh-date-tracking',
        title='Tracking Peshi and Tarikh Dates | Tarikh Blog',
        desc='A practical process for tracking Peshi and Tarikh court dates in a Nepali law firm, with Bikram Samvat and AD date examples and a simple daily routine.',
        og_type='article',
        og_alt='Tracking Peshi and Tarikh court dates in a Nepal law firm',
        article=dict(published='2026-08-25', section='Peshi / Tarikh Dates'),
    ),
    'blog/case-management-software-nepal/index.html': dict(
        route='/blog/case-management-software-nepal',
        title='Case Management Software for Nepal | Tarikh',
        desc="What to look for when choosing case management software for a law firm in Nepal: court-aware dates, matter structure, NPR billing, access control and support.",
        og_type='article',
        og_alt='Choosing case management software for a law firm in Nepal',
        article=dict(published='2026-08-05', section='Case Management'),
    ),
    'blog/law-erp-vs-spreadsheets/index.html': dict(
        route='/blog/law-erp-vs-spreadsheets',
        title='Law ERP vs Spreadsheets for Nepali Firms | Tarikh',
        desc='Where spreadsheets break down for a Nepali law firm, what a law ERP does differently, and how to tell when your practice has outgrown its spreadsheets.',
        og_type='article',
        og_alt='Law ERP compared with spreadsheets for law firms in Nepal',
        article=dict(published='2026-07-25', section='Law ERP'),
    ),
    'blog/law-firm-billing-nepal/index.html': dict(
        route='/blog/law-firm-billing-nepal',
        title='Law Firm Billing in Nepal: NPR Invoicing | Tarikh',
        desc='Practical NPR invoicing habits for Nepali law firms from the Tarikh blog: recording time per matter, agreeing fees early and following up on balances.',
        og_type='article',
        og_alt='Law firm billing and NPR invoicing practices for Nepal',
        article=dict(published='2026-08-15', section='Billing & Invoicing'),
    ),
    'blog/document-management-law-firms-nepal/index.html': dict(
        route='/blog/document-management-law-firms-nepal',
        title='Document Management for Nepal Law Firms | Tarikh',
        desc='How to organise pleadings, court orders and correspondence so every file stays connected to its matter, with naming conventions and access rules that hold up.',
        og_type='article',
        og_alt='Document management for law firms in Nepal',
        article=dict(published='2026-07-15', section='Document Management'),
    ),
}

NS = 'https://www.tarikh.tech'

# --------------------------------------------------------------------------- #
# JSON-LD per page (Phase 2: cleaned-up, re-domained blocks)
# --------------------------------------------------------------------------- #
ORG = {
    '@type': 'Organization',
    'name': 'Tarikh',
    'url': f'{NS}/',
    'logo': {
        '@type': 'ImageObject',
        'url': f'{NS}/icon-512.png',
        'width': 512,
        'height': 512,
    },
    'sameAs': ['https://www.instagram.com/tarikh.np/'],
    'areaServed': {'@type': 'Country', 'name': 'Nepal'},
}

WEBPAGE = {
    '@type': 'WebPage',
    'name': 'Tarikh — Law ERP & Case Management Software for Nepal',
    'url': f'{NS}/',
    'isPartOf': {'@type': 'WebSite', 'name': 'Tarikh', 'url': f'{NS}/'},
    'about': {'@type': 'SoftwareApplication', 'name': 'Tarikh', 'url': f'{NS}/'},
    'inLanguage': 'en',
}

FAQ = [
    ("Who is Tarikh designed for?",
     "Tarikh is built for modern Nepalese law firms and legal teams — solo practitioners, small firms and growing practices that want matters, clients, court events, documents and billing managed in one place."),
    ("Can Tarikh manage multiple matters?",
     "Yes. Every client can have multiple matters, and every matter keeps its own parties, court details, documents, activity and billing history organized and connected."),
    ("Can I track court hearings and Tarikh/Peshi dates?",
     "Yes. Record hearings, Tarikh/Peshi dates, and court deadlines, attach them to matters, and keep upcoming dates visible across your Bikram Samvat calendar and firm dashboard."),
    ("Can I manage clients and parties?",
     "Yes. Keep client information, contacts and opposing parties connected to the right matters, with full history in one place."),
    ("Can different advocates and employees have different permissions?",
     "Yes. Tarikh includes role-based access with configurable permissions, so partners, senior advocates, associates, and administrative staff see only what fits their role."),
    ("Can I manage documents within matters?",
     "Yes. Legal documents can be attached to specific matters, organized, versioned, and access-controlled."),
    ("Does Tarikh include billing and invoices in NPR?",
     "Yes. Track unbilled time and expenses, generate professional invoices in Nepali Rupees (NPR), and monitor outstanding firm balances."),
    ("How do we get started or request a demo walkthrough?",
     "Click \"Book a Demo\" anywhere on the page, or contact our Kathmandu team directly via email or Instagram @tarikh.np to set up a walkthrough for your firm."),
]


def breadcrumb(items):
    return {
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u}
            for i, (n, u) in enumerate(items)
        ],
    }


SCHEMA = {
    'index.html': [
        ORG,
        {
            '@type': 'SoftwareApplication',
            'name': 'Tarikh — Law ERP & Case Management Software',
            'alternateName': ['Tarikh NP', 'Tarikh Nepal', 'तारिख'],
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Web',
            'description': "Tarikh is legal practice management and law ERP software built specifically for Nepali law firms. It manages matters, court hearings, Peshi/Tarikh dates, clients, documents, billing and firm operations in one secure platform.",
            'url': f'{NS}/',
            'provider': ORG,
            'featureList': [
                'Matter & Case Management',
                'Court Hearing Tracking & Calendar',
                'Peshi/Tarikh Date Management',
                'Client & Party Management',
                'Document Management',
                'Billing & Invoice Generation',
                'Bikram Samvat (BS) Calendar',
                'Role-Based Access Control',
                'Audit Trail & Activity Logs',
                'Firm Reporting',
            ],
            'inLanguage': 'en',
        },
        {'@type': 'WebSite', 'name': 'Tarikh', 'url': f'{NS}/', 'inLanguage': 'en',
         'publisher': {'@type': 'Organization', 'name': 'Tarikh', 'url': f'{NS}/'}},
        WEBPAGE,
        {'@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': q,
             'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in FAQ]},
    ],
    'features/index.html': [
        {'@type': 'WebPage', 'name': 'Tarikh Features', 'url': f'{NS}/features',
         'isPartOf': {'@type': 'WebSite', 'name': 'Tarikh', 'url': f'{NS}/'},
         'about': {'@type': 'SoftwareApplication', 'name': 'Tarikh', 'url': f'{NS}/'},
         'inLanguage': 'en'},
        breadcrumb([('Home', f'{NS}/'), ('Features', f'{NS}/features')]),
    ],
    'pricing/index.html': [
        {'@type': 'WebPage', 'name': 'Tarikh Pricing', 'url': f'{NS}/pricing',
         'isPartOf': {'@type': 'WebSite', 'name': 'Tarikh', 'url': f'{NS}/'},
         'about': {'@type': 'SoftwareApplication', 'name': 'Tarikh', 'url': f'{NS}/'},
         'inLanguage': 'en'},
        breadcrumb([('Home', f'{NS}/'), ('Pricing', f'{NS}/pricing')]),
    ],
    'about/index.html': [
        {'@type': 'WebPage', 'name': 'About Tarikh', 'url': f'{NS}/about',
         'isPartOf': {'@type': 'WebSite', 'name': 'Tarikh', 'url': f'{NS}/'},
         'about': {'@type': 'SoftwareApplication', 'name': 'Tarikh', 'url': f'{NS}/'},
         'inLanguage': 'en'},
        breadcrumb([('Home', f'{NS}/'), ('About', f'{NS}/about')]),
    ],
    'contact/index.html': [
        {'@type': 'WebPage', 'name': 'Contact Tarikh', 'url': f'{NS}/contact',
         'isPartOf': {'@type': 'WebSite', 'name': 'Tarikh', 'url': f'{NS}/'},
         'inLanguage': 'en'},
        breadcrumb([('Home', f'{NS}/'), ('Contact', f'{NS}/contact')]),
    ],
    'privacy/index.html': [
        {'@type': 'WebPage', 'name': 'Privacy Policy', 'url': f'{NS}/privacy',
         'isPartOf': {'@type': 'WebSite', 'name': 'Tarikh', 'url': f'{NS}/'},
         'inLanguage': 'en'},
        breadcrumb([('Home', f'{NS}/'), ('Privacy Policy', f'{NS}/privacy')]),
    ],
    'terms/index.html': [
        {'@type': 'WebPage', 'name': 'Terms of Service', 'url': f'{NS}/terms',
         'isPartOf': {'@type': 'WebSite', 'name': 'Tarikh', 'url': f'{NS}/'},
         'inLanguage': 'en'},
        breadcrumb([('Home', f'{NS}/'), ('Terms of Service', f'{NS}/terms')]),
    ],
    'blog/index.html': [
        {'@type': 'Blog', 'name': 'Tarikh Blog', 'url': f'{NS}/blog/',
         'description': "Insights for Nepal's law firms on case management, court hearing tracking, Peshi/Tarikh dates and legal technology.",
         'inLanguage': 'en',
         'publisher': {'@type': 'Organization', 'name': 'Tarikh', 'url': f'{NS}/',
                       'logo': {'@type': 'ImageObject', 'url': f'{NS}/icon-512.png', 'width': 512, 'height': 512}}},
        breadcrumb([('Home', f'{NS}/'), ('Blog', f'{NS}/blog/')]),
    ],
}

BLOG_POSTS = {
    'blog/nepal-court-hierarchy/index.html': dict(
        headline='Nepal court hierarchy explained: Supreme Court, High Courts and District Courts',
        slug='/blog/nepal-court-hierarchy',
        published='2026-09-01',
        modified='2026-10-16',
        image='assets/images/blog/nepal-court-hierarchy.webp',
    ),
    'blog/peshi-tarikh-date-tracking/index.html': dict(
        headline='How to track Peshi and Tarikh dates without the confusion',
        slug='/blog/peshi-tarikh-date-tracking',
        published='2026-08-25',
        modified='2026-10-16',
        image='assets/images/blog/peshi-tarikh-date-tracking.webp',
    ),
    'blog/case-management-software-nepal/index.html': dict(
        headline='Case management software for law firms in Nepal: what to look for',
        slug='/blog/case-management-software-nepal',
        published='2026-08-05',
        modified='2026-10-16',
        image='assets/images/blog/case-management-software-nepal.webp',
    ),
    'blog/law-erp-vs-spreadsheets/index.html': dict(
        headline='Law ERP vs spreadsheets for Nepali law firms',
        slug='/blog/law-erp-vs-spreadsheets',
        published='2026-07-25',
        modified='2026-10-16',
        image='assets/images/blog/law-erp-vs-spreadsheets.webp',
    ),
    'blog/law-firm-billing-nepal/index.html': dict(
        headline="Law firm billing in Nepal: getting paid without the awkwardness",
        slug='/blog/law-firm-billing-nepal',
        published='2026-08-15',
        modified='2026-10-16',
        image='assets/images/blog/law-firm-billing-nepal.webp',
    ),
    'blog/document-management-law-firms-nepal/index.html': dict(
        headline='Document management for law firms in Nepal',
        slug='/blog/document-management-law-firms-nepal',
        published='2026-07-15',
        modified='2026-10-16',
        image='assets/images/blog/document-management-law-firms-nepal.webp',
    ),
}

for path, cfg in BLOG_POSTS.items():
    SCHEMA[path] = [
        {
            '@type': 'BlogPosting',
            'headline': cfg['headline'],
            'url': f"{NS}{cfg['slug']}",
            'mainEntityOfPage': f"{NS}{cfg['slug']}",
            'datePublished': cfg['published'],
            'dateModified': cfg['modified'],
            'image': [f"{NS}/{cfg['image']}"],
            'author': {'@type': 'Organization', 'name': 'Tarikh', 'url': f'{NS}/about'},
            'publisher': {'@type': 'Organization', 'name': 'Tarikh', 'url': f'{NS}/',
                          'logo': {'@type': 'ImageObject', 'url': f'{NS}/icon-512.png', 'width': 512, 'height': 512}},
            'inLanguage': 'en',
        },
        breadcrumb([('Home', f'{NS}/'), ('Blog', f'{NS}/blog/'),
                    (cfg['headline'].split(':')[0], f"{NS}{cfg['slug']}")]),
    ]


# --------------------------------------------------------------------------- #
# Shared chrome
# --------------------------------------------------------------------------- #
NAV_LINKS = [('Product', '/#platform'), ('Features', '/features'),
             ('Pricing', '/pricing'), ('Blog', '/blog/'), ('About', '/about')]

FOOTER_ICON = ('<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
               '<path d="M12 2.16c-5.77 0-10.48 4.72-10.48 10.5 0 5.75 4.75 10.48 10.5 10.48 5.72 0 '
               '10.47-4.73 10.47-10.5 0-5.78-4.75-10.48-10.5-10.48zM12 0C5.37 0 0 5.37 0 12s5.37 12 12 '
               '12 12-5.37 12-12S18.63 0 12 0z"/>'
               '<path d="M10.81 12.18c-.03.16-.11.31-.24.4-.62.47-1.43.62-2.32.44-.87-.18-1.58-.83-1.76-1.68'
               '-.18-.87.03-1.74.59-2.28.56-.56 1.32-.78 2.1-.68.29.01.58.08.86.2v.36c-.27-.04-.55-.06-.84-.06'
               '-1.06 0-1.96.74-2.2 1.76-.18.74.04 1.54.65 1.96.67.45 1.58.52 2.42.32.72-.17 1.3-.64 1.66-1.27'
               '.32-.57.37-1.2.21-1.82-.15-.6-.49-1.15-.95-1.56-.48-.43-1.07-.69-1.74-.69z"/></svg>')


def nav_html(route):
    def cur(href):
        if route == href or (href != '/' and route.startswith(href)):
            return ' aria-current="page"'
        return ''

    top = '\n'.join(
        f'        <a href="{h}"{cur(h)}>{t}</a>' for t, h in NAV_LINKS)
    mobile = '\n'.join(
        f'        <a href="{h}"{cur(h)}>{t}</a>' for t, h in NAV_LINKS + [('Contact', '/contact')])

    return f'''  <header class="site-header" id="siteHeader">
    <div class="container container--wide header-inner">
      <a class="brand" href="/" aria-label="Tarikh — home">
        <img src="/assets/images/primary.png" alt="Tarikh" class="brand-logo" height="32" width="30">
        <span class="brand-name">Tarikh</span>
      </a>

      <nav class="nav-links" aria-label="Primary">
{top}
      </nav>

      <div class="header-actions">
        <a class="btn btn--primary btn--sm" href="/contact">Book a Demo</a>
      </div>

      <button class="menu-btn" id="menuBtn" aria-controls="mobileNav" aria-expanded="false" aria-label="Open menu">
        <svg class="icon icon--menu" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        <svg class="icon icon--close" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>

    <nav class="mobile-nav" id="mobileNav" aria-label="Mobile">
      <div class="container mobile-nav-inner">
{mobile}
        <div class="mobile-nav-cta">
          <a class="btn btn--primary" href="/contact">Book a Demo</a>
        </div>
      </div>
    </nav>
  </header>'''


FOOTER = f'''  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand brand--footer" href="/" aria-label="Tarikh — home">
            <img src="/assets/images/primary.png" alt="Tarikh" class="brand-logo brand-logo--footer" height="28" width="26">
            <span class="brand-name">Tarikh</span>
          </a>
          <p class="footer-desc">Law ERP and legal practice management software for law firms in Nepal.</p>
        </div>

        <nav class="footer-col" aria-label="Product">
          <p class="footer-heading">Product</p>
          <a href="/features#matter-management">Matter &amp; Case Management</a>
          <a href="/features#court-hearings">Court &amp; Hearing Tracking</a>
          <a href="/features#client-management">Client Management</a>
          <a href="/features#documents">Document Management</a>
          <a href="/features#billing">Billing &amp; NPR Invoices</a>
        </nav>

        <nav class="footer-col" aria-label="Solutions">
          <p class="footer-heading">Solutions</p>
          <a href="/features">Law Firm Software</a>
          <a href="/#nepal">Built for Nepal's Courts</a>
          <a href="/pricing">Pricing</a>
        </nav>

        <nav class="footer-col" aria-label="Resources">
          <p class="footer-heading">Resources</p>
          <a href="/blog/">Blog</a>
          <a href="/blog/nepal-court-hierarchy">Nepal Court Hierarchy Guide</a>
          <a href="/#faq">FAQs</a>
          <a href="https://www.instagram.com/tarikh.np/" target="_blank" rel="noopener noreferrer">Instagram @tarikh.np</a>
        </nav>

        <nav class="footer-col" aria-label="Company">
          <p class="footer-heading">Company</p>
          <a href="/about">About Tarikh</a>
          <a href="/contact">Contact</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </nav>
      </div>

      <div class="footer-bottom">
        <div class="footer-legal">
          <p>&copy; 2026 Tarikh — law ERP and legal practice management software for Nepal's law firms.</p>
          <p class="footer-note">Matters &middot; Clients &middot; Court events &middot; Documents &middot; NPR billing &middot; Peshi dates</p>
        </div>
        <div class="footer-social">
          <a href="https://www.instagram.com/tarikh.np/" target="_blank" rel="noopener noreferrer" aria-label="Tarikh on Instagram @tarikh.np">
            {FOOTER_ICON}
            <span class="footer-social-label">Instagram: @tarikh.np</span>
          </a>
        </div>
      </div>
    </div>
  </footer>'''


VERIFICATION = '''  <!-- Google Search Console verification.
       The token below belongs to the OLD subdomain property. Keep it until the new tarikh.tech
       Domain property is verified, then remove it. See SEO.md — "Launch day / first 30 days". -->
  <meta name="google-site-verification" content="c0OyIMPh_8EE2h9PaHRe_yGHgpPLijcnoJhUlXgazQU" />
  <!-- TODO(owner): paste the verification token for the new tarikh.tech property, then uncomment.
  <meta name="google-site-verification" content="REPLACE_WITH_TARIKH_TECH_VERIFICATION_TOKEN" />
  -->
  <!-- TODO(owner): paste the Bing Webmaster Tools token, then uncomment.
  <meta name="msvalidate.01" content="REPLACE_WITH_BING_VERIFICATION_TOKEN" />
  -->
'''


def head_html(path, cfg):
    route = cfg['route']
    canonical = f'{ORIGIN}{route}' if route != '/' else f'{ORIGIN}/'
    title = cfg['title'].replace('&', '&amp;')
    desc = cfg['desc'].replace('&', '&amp;')
    og_alt = html_escape(cfg['og_alt'], quote=True)

    out = ['<head>',
           '  <meta charset="utf-8">',
           '  <meta name="viewport" content="width=device-width, initial-scale=1">',
           '  <meta name="color-scheme" content="light">',
           '  <meta name="theme-color" content="#0056FF">']
    if cfg.get('verification'):
        out.append(VERIFICATION.rstrip('\n'))
    out += [
        '',
        f'  <title>{title}</title>',
        f'  <meta name="description" content="{desc}">',
        f'  <meta name="robots" content="{cfg.get("robots", ROBOTS)}">',
    ]
    if not cfg.get('no_canonical'):
        out.append(f'  <link rel="canonical" href="{canonical}">')
    out += [
        '',
        '  <!-- Open Graph -->',
        f'  <meta property="og:type" content="{cfg["og_type"]}">',
        '  <meta property="og:site_name" content="Tarikh">',
        f'  <meta property="og:title" content="{title}">',
        f'  <meta property="og:description" content="{desc}">',
        f'  <meta property="og:url" content="{canonical}">',
        f'  <meta property="og:image" content="{OG_IMAGE}">',
        '  <meta property="og:image:width" content="1200">',
        '  <meta property="og:image:height" content="630">',
        f'  <meta property="og:image:alt" content="{og_alt}">',
        '  <meta property="og:locale" content="en_NP">',
    ]
    if cfg.get('article'):
        out += [f'  <meta property="article:published_time" content="{cfg["article"]["published"]}">',
                f'  <meta property="article:section" content="{cfg["article"]["section"]}">']
    out += [
        '',
        '  <!-- Twitter / X -->',
        '  <meta name="twitter:card" content="summary_large_image">',
        f'  <meta name="twitter:title" content="{title}">',
        f'  <meta name="twitter:description" content="{desc}">',
        f'  <meta name="twitter:image" content="{OG_IMAGE}">',
        f'  <meta name="twitter:image:alt" content="{og_alt}">',
        '',
        '  <!-- Icons & PWA -->',
        '  <link rel="icon" href="/favicon.ico" sizes="any">',
        '  <link rel="icon" href="/favicon.svg" type="image/svg+xml">',
        '  <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48">',
        '  <link rel="apple-touch-icon" href="/apple-touch-icon.png">',
        '  <link rel="manifest" href="/manifest.webmanifest">',
        '  <meta name="apple-mobile-web-app-title" content="Tarikh">',
        '  <meta name="application-name" content="Tarikh">',
        '',
        '  <!-- Fonts -->',
        '  <link rel="preconnect" href="https://fonts.googleapis.com">',
        '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,500&display=swap" rel="stylesheet">',
        '',
        '  <!-- Styles -->',
        '  <link rel="stylesheet" href="/css/style.css">',
        '  <link rel="stylesheet" href="/css/responsive.css">',
        '',
        '''  <noscript>
    <style>
      [data-reveal] { opacity: 1 !important; transform: none !important; }
      #menuBtn { display: none; }
      #mobileNav { position: static; visibility: visible; opacity: 1; transform: none; pointer-events: auto; display: block; border-top: 1px solid var(--border); }
    </style>
  </noscript>''',
    ]

    for block in SCHEMA.get(path, []):
        payload = dict(block)
        payload = {'@context': 'https://schema.org', **payload}
        out += ['', '  <script type="application/ld+json">',
                '  ' + json.dumps(payload, ensure_ascii=False, indent=2).replace('\n', '\n  '),
                '  </script>']

    out.append('</head>')
    return '\n'.join(out)


# --------------------------------------------------------------------------- #
# Link rewriting
# --------------------------------------------------------------------------- #
LINK_MAP = [
    (r'href="\.\./assets/', 'href="/assets/'),
    (r'src="\.\./assets/', 'src="/assets/'),
    (r'srcset="\.\./assets/', 'srcset="/assets/'),
    (r'href="assets/', 'href="/assets/'),
    (r'src="assets/', 'src="/assets/'),
    (r'href="\.\./css/', 'href="/css/'),
    (r'href="css/', 'href="/css/'),
    (r'src="\.\./js/', 'src="/js/'),
    (r'src="js/', 'src="/js/'),
    (r'href="\.\./favicon', 'href="/favicon'),
    (r'href="favicon', 'href="/favicon'),
    (r'href="\.\./index\.html', 'href="/'),
    (r'href="index\.html', 'href="/'),
    (r'href="\.\./features\.html', 'href="/features'),
    (r'href="features\.html', 'href="/features'),
    (r'href="\.\./pricing\.html', 'href="/pricing'),
    (r'href="pricing\.html', 'href="/pricing'),
    (r'href="\.\./privacy\.html', 'href="/privacy'),
    (r'href="privacy\.html', 'href="/privacy'),
    (r'href="\.\./terms\.html', 'href="/terms'),
    (r'href="terms\.html', 'href="/terms'),
    (r'href="\.\./blog/', 'href="/blog/'),
    (r'href="blog/blog-post-nepal-court-hierarchy\.html', 'href="/blog/nepal-court-hierarchy'),
    (r'href="blog-post-nepal-court-hierarchy\.html', 'href="/blog/nepal-court-hierarchy'),
    (r'href="blog-post-peshi-date-tracking\.html', 'href="/blog/peshi-tarikh-date-tracking'),
    (r'href="blog-post-case-management-software\.html', 'href="/blog/case-management-software-nepal'),
    (r'href="blog-post-law-erp-vs-spreadsheets\.html', 'href="/blog/law-erp-vs-spreadsheets'),
    (r'href="blog-post-law-firm-billing\.html', 'href="/blog/law-firm-billing-nepal'),
    (r'href="blog-post-document-management\.html', 'href="/blog/document-management-law-firms-nepal'),
]


def rewrite_links(html):
    for pat, rep in LINK_MAP:
        html = re.sub(pat, rep, html)
    return html


def main():
    for path, cfg in PAGES.items():
        p = ROOT / path
        if not p.exists():
            print('skip (missing)', path)
            continue
        html = p.read_text(encoding='utf-8')

        # head
        html = re.sub(r'<head>.*?</head>', lambda m: head_html(path, cfg), html,
                      count=1, flags=re.S)
        # header / footer
        html = re.sub(r'<header class="site-header".*?</header>',
                      lambda m: nav_html(cfg['route']), html, count=1, flags=re.S)
        html = re.sub(r'<footer class="site-footer">.*?</footer>',
                      lambda m: FOOTER, html, count=1, flags=re.S)
        # links
        html = rewrite_links(html)

        p.write_text(html, encoding='utf-8', newline='')
        print('rebuilt', path)


if __name__ == '__main__':
    main()
