# October funnel PageSpeed — what changed

Goal was conversion, not a 100 Lighthouse score. Tracking and layout stayed.

## What I changed (safe)

- **Cache headers** in `vercel.json`. Images/fonts/CSS/JS were `max-age=0`. Now fonts 1y, images 30d, CSS/JS 7d + SWR. HTML still no-cache.
- **Self-hosted fonts.** Dropped render-blocking Google Fonts. Instrument Sans + Newsreader variable woff2 from `/assets/fonts/`. Preload + tiny critical `@font-face`. Italic/serif CSS is non-blocking.
- **Vimeo click-to-play facade** on pages that already had `autoplay=0`:
  - `/october` → existing `hero-thumbnail.webp`
  - `/vipupgradeoct` → `vimeo-upgradevip.webp`
  - `/taxreportoct` + `/taxreportvipoct` → `vimeo-taxreport.webp`
  Same UX (user already had to click play). Player.js no longer loads on first paint. Play button is gold, branded.
  Tax-report poster has a baked-in YouTube play icon, so that gold button is sized to cover it (`22%` of the frame). Landing + VIP upgrade stay at a smaller 4.75rem button.
- **Compressed** `host-preston.webp` 166KB → 83KB (720×900).
- **ClickFunnels testimonial thumbs** `width=1000` → `640` on ticket pages.
- **`<main>` landmark** on landing/checkout/upsell pages (a11y).
- Hyros inject now sets `async` explicitly. Pixel / Hyros / Spiffy / PostHog snippets are still there, still in `<head>`.

Prep kit videos stay **eager + autoplay=1**. Last pass un-lazied those on purpose.

## Left alone (risk / little conversion value)

| Thing | Why I didn't touch it | Question |
| --- | --- | --- |
| Prep kit autoplay Vimeo | Conversion VSL, previously un-lazied | Facade there too? Drops TBT, kills autoplay. |
| PostHog (session replay, autocapture, heatmaps) | That's a lot of the unused JS / TBT | Delay until `load`/`idle`? Or turn off replay on `/october` only? |
| Spiffy SDK on landing + confirmation (`hideSidebar: false`) | No checkout embed on those pages, still loads `spiffy.js` | Is the sidebar/chat actually used? If not, don't load Spiffy until checkout. |
| Unused CSS ~22KB / huge DOM | Stripping rules/content = visual risk | Don't. |
| Contrast leftovers (footer muted on forest, gold on cream) | Visual change | Want a pass? |
| Third-party cookies / deprecated APIs | Facebook + Vimeo | Can't fix without dropping pixels. |
| Legacy/duplicated JS ~59KB + 8KB | Third-party, not ours | — |

## Expected impact on `/october` mobile

Biggest wins: no Google Fonts RTT, no Vimeo player.js before click, cache headers, poster as LCP instead of Vimeo iframe.

Will **not** hit 90. Meta + Hyros + Spiffy + PostHog still eat TBT. That's the conversion stack.

Re-run PageSpeed on prod after this ships.

## Visual QA notes

Local `http://` checkout shows "The payment form requires a secure HTTPS connection." That's the existing Spiffy guard (`if (location.protocol === "https:")`). Not a regression.
