#!/usr/bin/env python3
"""Summarise Lighthouse JSON reports.

Usage: python deploy/lh-report.py <label> <dir-with-json>
"""
import glob
import json
import os
import sys


def main():
    label = sys.argv[1] if len(sys.argv) > 1 else 'report'
    directory = sys.argv[2] if len(sys.argv) > 2 else '.'
    files = sorted(glob.glob(os.path.join(directory, '*.json')))
    if not files:
        print(f'No Lighthouse JSON found in {directory}')
        return
    print(f'== Lighthouse (mobile) — {label} ==')
    for f in files:
        try:
            d = json.load(open(f, encoding='utf-8'))
        except Exception as exc:  # noqa: BLE001
            print(os.path.basename(f), 'unreadable:', exc)
            continue
        name = os.path.basename(f).replace('.json', '')
        cats = d.get('categories', {})
        perf = round((cats.get('performance', {}).get('score') or 0) * 100)
        a11y = round((cats.get('accessibility', {}).get('score') or 0) * 100)
        bp = round((cats.get('best-practices', {}).get('score') or 0) * 100)
        seo = round((cats.get('seo', {}).get('score') or 0) * 100)
        a = d.get('audits', {})

        def dv(k):
            return a.get(k, {}).get('displayValue', 'n/a')

        print(f'{name:<12} perf={perf:<4} a11y={a11y:<4} best-practices={bp:<4} seo={seo:<4} '
              f'FCP={dv("first-contentful-paint")} LCP={dv("largest-contentful-paint")} '
              f'TBT={dv("total-blocking-time")} CLS={dv("cumulative-layout-shift")} '
              f'SI={dv("speed-index")}')
        for k in ('total-byte-weight', 'unminified-css', 'unminified-javascript',
                  'uses-responsive-images', 'modern-image-formats', 'uses-text-compression',
                  'render-blocking-resources', 'uses-long-cache-ttl', 'font-display'):
            au = a.get(k)
            if au is None:
                continue
            score = au.get('score')
            if score is not None and score < 0.9:
                print(f'    ! {k}: {au.get("displayValue", "")}')


if __name__ == '__main__':
    main()
