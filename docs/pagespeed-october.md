# October funnel performance review

Reviewed PR #7 on September 16, 2026 against the current production source, including the newer cold/warm analytics and checkout attribution integration.

## Final changes

- Self-host Instrument Sans and Newsreader. Font filenames contain SHA-256 content hashes and receive a one-year immutable cache. Mutable scripts, styles, images, and screenshots revalidate; the tracker cannot remain fresh in a visitor's browser for seven days after a fix. Vercel still caches static assets at the CDN: https://vercel.com/docs/caching/cdn-cache and https://vercel.com/docs/caching/cache-control-headers.
- Defer Vimeo on the four previously click-to-play pages: October landing, VIP upgrade, and both tax-report pages. Posters use the same video IDs; a click mounts the player with autoplay requested. A normal video link works if the enhancement script fails, and the no-JavaScript iframe is not covered by the poster. Prep-kit autoplay players remain eager.
- Keep the date-free challenge hero poster. The older unused local thumbnail contained January/February dates.
- Keep the compressed host photograph and smaller checkout testimonial images.
- Preserve the original about-section montage, captions, image caps, sales copy, and CTA destinations. Keep min-width fixes that prevent grid overflow. Remove the PR's unrelated five-card redesign.
- Preserve production tracker version `2026-09-16.2`, the current payment receiver, DOM-ready Spiffy loading, explicit UTM forwarding, anonymous visitor ID, and the 800 ms fail-open. Spiffy-hosted hidden fields remain unchanged.
- Keep Meta, Hyros, Spiffy, PostHog replay/autocapture/heatmaps, and the first-party PostHog proxy. No tracking delays or removals were introduced by this review.

Video provider impressions will begin when the deferred player loads, rather than automatically on every landing visit. This is an intentional consequence of the poster optimization; do not compare Vimeo player-load counts before and after as if their definition were unchanged. PostHog pageviews remain the landing-traffic denominator.

## Verification

- 23 attribution cases, 19 payment-receiver cases, 10 checkout integration scenarios, and 2 font/reference checks pass.
- All 56 inline JavaScript blocks parse.
- Extracted visible text and every existing non-video link match the main-branch pages across all ten changed funnel pages.
- The preview tracker matches the current production-source tracker byte-for-byte.
- Preview tracker response: HTTP 200 with `max-age=0, must-revalidate`; internal `POSTHOG.md` returns 404.
- Preview font response: HTTP 200 with `max-age=31536000, immutable` for a content-hashed URL.
- Preview: https://october-2026-challenge-pa0pl2tbz-legacy-investing-show.vercel.app (Vercel authentication required).
- Preview deployment: `dpl_4P2sVtUQ3tZTpemSJCyEd2y31nMe`, Ready. No production deployment or merge performed for this review.

## Performance evidence

One matched Lighthouse mobile simulation per version, served locally on the same machine. Current production-source files were the baseline; revised PR files were the candidate. This isolates code changes but is not a production benchmark: PostHog is intentionally disabled on non-production hosts, the HTTP Spiffy guard applies to both, and third-party/network timings vary.

| Metric | Baseline | Revised |
| --- | ---: | ---: |
| First contentful paint | 5.81 s | 1.66 s |
| Largest contentful paint | 7.89 s | 2.94 s |
| Total blocking time | 182 ms | 68.5 ms |
| Layout shift | 0 | 0.004 |
| Initial transfer | 1,022,569 bytes | 689,507 bytes |
| Requests | 34 | 26 |

Treat these as directional lab results, not a promised score, field Core Web Vitals, or conversion uplift. Recheck real production performance after an approved release. Raw reports were saved under `/tmp/october-pr7-evidence/` on the review machine.

Verified purchase ingestion remains pending the separate Spiffy API-key approval. This PR preserves the dormant receiver and does not activate it. No fake lead or payment was submitted.
