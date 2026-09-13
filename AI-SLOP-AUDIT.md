# AI-slop / generated-UI audit (Impeccable pass)

Scope: every page in this repo, audited against the Impeccable skill (impeccable.style): its craft-floor bans, the `audit` and `critique` playbooks, and its 61-rule detector (built from source and run over all 17 HTML files, 3 stylesheets and `tools.js`). Each page was also read in full by hand.

Pages: `index.html`, `regularticket26.html`, `vipticket26.html`, `upgradevip.html`, `prepkit.html`, `prepkitvip.html`, `taxreport.html`, `taxreportvip.html`, `octchallengeconfirmation.html`, `octchallengeconfirmationvip.html`, `prechallengetraining123.html`, `tools/*.html`, `checkout.css`, `confirmation.css`, `tools/assets/tools.css`, `tools/assets/tools.js`.

Detector totals (primary findings, advisory excluded): low-contrast 167, cramped-padding 88 (mostly false positives on full-bleed `section` bands), undersized-ui-text 25, dark-glow 18, overused-font 16, cream-palette 10, gpt-thin-border-wide-shadow 9, all-caps-body 8, hero-eyebrow-chip 6, repeating-stripes 6 (false positive: chart legend dash), pulsing-dot 4, kicker-above-heading 4, layout-transition 4, skipped-heading 3, gradient-text 2, side-tab 1.

---

## Part 1. Sitewide patterns, ranked by impact

These recur on most pages. Fixing them at the token / shared-CSS level clears the majority of per-page findings.

### 1. Kickers, eyebrows and uppercase micro-labels above every heading (Impeccable's one outright ban)
- `index.html` has 11 `.kicker` labels with gold hairlines ("Success Stories", "The System", "Proof It Works", "The Math", "Got Questions?") plus "Day 1/2/3" and "Most Popular" kickers above h3s.
- `tools/*.html:31` "Tool N of 5" eyebrow with gold rule above every h1; `tools/index.html:30` "Free tools · no sign-up".
- `taxreport.html:1073` / `taxreportvip.html:1022` hairline-flanked "EVERY MONTH YOU WAIT COSTS $1,600–$8,000" above the final h2; `taxreportvip.html:730` "REAL ESTATE STRATEGY" pill kicker.
- `prepkit.html:357` / `prepkitvip.html:347` "THAT'S WHY I BUILT..." gold pill above the product h2 (VIP adds a pulsing dot).
- `upgradevip.html:250,383-397,512` "ORDER CONFIRMED", "ONE MOMENT", "OPENING IT NOW…", "PRIVATE OFFER UNLOCKED", "★ ONE-TIME OFFER".
- `octchallengeconfirmation*.html:85,96,107` "STEP ONE/TWO/THREE" pill chips above each h3.
- 51 `text-transform: uppercase` rules across the repo; `tools.css` uses tracked all-caps as its *only* sectioning device (`.section-title`, `.fieldset-title`, `.stamp`, `th`, `.next .k`), 37 instances on `wealth-trajectory.html`.

Fix: delete the kicker components; let headings carry their own weight. Keep uppercase only for table headers and at most one badge (VIP).

### 2. The typographic system is a no-op: `--serif` resolves to the sans
- `index.html:83` `--serif: var(--sans)`; 18 rules on that page (hero accent, quotes, prices, stats, section h3s) declare `font-family: var(--serif)` for nothing. Same on `taxreport.html:75` (14 rules) and `tools.css:28`.
- `assets/fonts/newsreader-latin-400.woff2` and `400i` ship in the repo and are never loaded; `inter-latin.woff2` likewise.
- Net effect: every heading, quote, price and stat renders in the same Instrument Sans weight. The detector flags a flat type hierarchy (`index.html`: body 16px, h4 16.8px, h3 20.8px) and 21–22 distinct rem sizes per page instead of a scale.
- The one page that does load a serif (`prechallengetraining123.html`, Crimson Pro) is the one off-system page.

Fix: either `@font-face` the local Newsreader and point `--serif` at it everywhere, or delete the token and the ~35 dead declarations. Then collapse the type ramp to 6–7 steps.

### 3. `--ink-faint #74816F` fails AA everywhere it is used as text
- 3.7:1 on ivory, 4.0:1 on paper, 3.4:1 on cream. The detector logged 120+ instances: `.faint`, `.t-role`, hero date, info-card copy, plan notes, takeaways, table headers, disclaimers (`index.html`); feature-card body, captions, trust chips (`taxreport*.html`); footer text (`confirmation.css:391`); the VIP decline link (`prepkitvip.html:198`); hints, fine print, tabs, axis labels (`tools.css`).
- Other repeat pairs: `--gold-ink` on `--gold-tint` 4.48:1 (every pill/chip), `--emerald` on `--emerald-tint` 4.28:1 (check glyphs), strikethrough `#9A947F` 3.0:1, `upgradevip.html` `.nx-kicker` `#8B8672` on `#EAE3D0` ≈ 2.9:1, chart marker `#8D9BA6` 2.55:1, `prechallengetraining123.html` footer `#71717a` on near-black 4.1:1.

Fix at the token level: `--ink-faint` → ~`#5F6C5B`, `--gold-ink` → ~`#7A5A0E`, use `--green-mid` for checks. One change clears most of the 167 contrast findings.

### 4. Emoji and Unicode glyphs standing in for an icon system
- `index.html` uses 💰 📊 📈 🏠 🏦 🧾 🧮 📅 📋 💸 📉 ⏳ ✅ in stat chips, avatars and cost cards, 👀 inside two h3s, text `✕/✓` in `.icon-x/.icon-check`, literal `→` in buttons, *and* an SVG sprite. Three-and-a-half icon vocabularies on one page.
- `taxreport*.html:493/471` "⚠️ STOP!" in an h2 above the h1; `taxreportvip.html:745` "⚠️ Common Mistake".
- `upgradevip.html:530` `🔒 Secure checkout · ⚡ Instant access · ✓ 7-day guarantee` next to an SVG sprite.
- `octchallengeconfirmation*.html`, `prepkit.html` use `&#10003;` in tinted circles while `prepkitvip.html:296` already has a `#check-icon` sprite.
- Sprites themselves drift: stroke-width 2 vs 2.5 vs 1.8 across pages, and different path data for the same symbol ids in `taxreport.html` vs `taxreportvip.html`.

Fix: one shared SVG sprite at stroke 2; stat chips need no icon at all.

### 5. Global `prefers-reduced-motion` kill that misses the actual animations
- `* { transition: none !important }` on `index.html:566`, `taxreport*.html`, `prepkit.html:239`, `regularticket26.html:298`, `vipticket26.html:294`, `upgradevip.html:207`; `.001ms` sledgehammer in `tools.css:296`.
- Meanwhile the pulsing dots, skeleton shimmer, button sheen (`upgradevip.html` `::after`, not matched by `*`), rolling countdown digits, count-ups, mobile before/after auto-flip (`index.html:2118`) and unguarded `scroll-behavior: smooth` keep running.

Fix: one intentional block per page listing the animated elements, and gate `scrollIntoView({behavior:'smooth'})` on the media query.

### 6. Pulsing "live" dots, count-ups, confetti, sheen, fake progress
- `index.html:160` and `prepkitvip.html:128` `.dot { animation: pulse 2s infinite }`; `checkout.css:11` `dl-pulse` on the deadline chip (both ticket pages).
- `upgradevip.html`: 24-node confetti (`:254,671`), infinite 3.4s sheen on the pay button (`:277`), radial-gradient glow behind an animated envelope (`:223`), gradient hero/voucher/button, and a three-bar "processing" meter on 1.4s timers under a headline that already says "Order confirmed".
- `index.html:1362-1374` price-anchor bars counting up from 0 to an arbitrary "$20,000+"; `tools.js:174` eased counters on every result; charts rebuilt and re-draw-animated on every slider tick (`tools.js:256-329`).

Fix: static dots or none; animate charts only on first paint; delete the processing theatre.

### 7. Evergreen countdowns and non-reconciling urgency math
- `index.html:44-60` deadline "resets at midnight America/New_York"; labels say "50% Off Ends At Midnight" (`:686,748,1401,1936`).
- `vipticket26.html:387` copies "50% off ends at midnight" onto a $197→$147 ticket (25%).
- `upgradevip.html:514,524` lists VIP at "$200" while `vipticket26.html:458` says $197; $47 + $99 ≠ $147.
- `index.html:1879-1917` cost-of-waiting cards ($1K–$8K/mo, $500–$2K/mo, $5K–$15K/mo, $100K+/yr) sum to nowhere near the "$85,871" total printed under them; "$85,871" is restated 10 times on the page.
- `taxreport*.html` hero-metric stack ($1,240,000 / 94% / $3,300; 73/81/89/67%) unsourced; testimonials "Saved: $X/year", "paid for itself 1,400x" with no disclosure.
- `tools/wealth-trajectory.html:269-274` round, uncited "peer percentile" net-worth table presented as "where you rank"; fine print references a control that does not exist.

Fix: tie any timer to a real price change or remove it; one VIP list price across the funnel; one sourced number per section; cite or label the peer table.

### 8. Templated card grids, nested cards, hero-metric tiles, numbered steps
- `index.html`: 12 sections of centered kicker → balanced h2 → equal-card grid (`tri-grid`, `info-grid`, `stat-grid` ×2, `shot-grid`, `cost-grid`); cards inside cards (`.stat-chip` in `.case-solo`, `.sess` in `.day-card`, `.strat` in `.plan-card`, `.verify-block` in `.verify-card`).
- `taxreport*.html`: 1/2/3 gold step chips on 3-col cards, six icon-tile + h3 + p feature cards, shield-in-circle guarantee, four identical testimonial cards.
- `upgradevip.html:484-502` icon-in-tinted-square benefit cards; `tools/index.html` roman-numeral `i. ii. iii.` list and tab numerals carrying no sequence.
- Radii over 16px (`1.1rem`, `1.25rem`, `1.4rem`, `1.8rem`) and pill-everything (7 pill components on `index.html`); ghost cards (1px border + 40–50px soft shadow) on 6 pages.

Fix: hairline rows instead of inner boxes; one card radius (12px) and one inner radius (8px); step numbers only where order matters (the 5-pillar list on `index.html` is the good example).

### 9. Copy cadence tells
- Aphoristic fragments: "Real People. Real Numbers.", "Same income. Leaking setup.", "CPAs file. They don't plan.", "Stop Overpaying. / Start Saving.", "You've got the seat. VIP is how you keep it.", "There is no catching up. The window is gone."
- "It's not X. It's Y." reversals on every tools page; rhetorical-question h1s; "Here's the thing/what…" h2s ×3 on `index.html`; ellipsis-as-drama in h1s (`prepkit*.html:330`, `taxreport*.html:504`); shouted words (KNOWING, IF, WHAT, WHEN, EXACT, BEFORE, INTENSE, PROACTIVE, NOW); "unlocked" ×3 on `upgradevip.html`.
- "DO NOT CLOSE THIS PAGE — YOUR ORDER IS STILL PROCESSING" in rose caps on five post-purchase pages where nothing is processing.
- Confirm-shaming decline links ("…enter the challenge without my baseline numbers").
- Em dashes: not a real problem here. The tools' 30+ `—` are empty-value placeholders, not prose.

Fix: one staccato beat per section, full sentences elsewhere; drop the processing strip; neutral decline copy.

### 10. Sibling pages have drifted into separate implementations
- `prepkit` vs `prepkitvip`, `regularticket26` vs `vipticket26`, `taxreport` vs `taxreportvip`: different class vocabularies for every component, different band colours for the same section, different font-loading strategies, different reduced-motion policies, different sprite paths, different FAQ wording, 7- vs 12-item agendas, different guarantee windows. Only the offer IDs, `<title>` and the word "VIP" *should* differ.
- Three to five copies of the same `:root` + reset + `.btn` + footer CSS; `checkout.css` re-declares ~15 selectors the ticket pages also declare inline (last-loaded wins).
- Each page then adds 6–10 untokenised hexes: `#E5D3A0` vs `#E5D5A8`, `#D6C69D`, on-forest text `#DCE4D6/#A9BCA9/#8FA78F/#B7C5BC/#7E967E/#7E9A89`. No `--on-forest` / `--on-gold` tokens exist.
- `prechallengetraining123.html` is a different site: Tailwind zinc hexes (`#09090b/#a1a1aa/#71717a`), Sora + Crimson Pro + JetBrains Mono, gradient text (`:139`), radial gold halos (`:53-56`), fixed `feTurbulence` grain (`:75-82`), monospace pill costume, no legal footer.

Fix: `base.css` (tokens incl. on-forest/on-gold, reset, buttons, footer) + `checkout.css` / `upsell.css` / `confirmation.css`; VIP files become copy-only deltas. Rebuild the training page on the site tokens.

### 11. Accessibility and structure
- Countdowns have no `role="timer"` / label; rolling digit strips read as digit soup (`index.html:686,748,1937`).
- Heading order: h2→h4 skips ×3 on `index.html`; `upgradevip.html` has four hidden h3s before the h1; `taxreportvip.html` FAQ has no headings at all; `taxreport.html` nests `<h3>` inside `<button>`.
- FAQ accordions without `aria-expanded` / `aria-controls` on `index.html`, `regularticket26.html`, `vipticket26.html`.
- Iframes without `title`: `index.html:731`, `prepkit.html:341`, `prepkitvip.html:329`, `upgradevip.html:422` (plus autoplay with sound on the prepkit pages).
- Mobile sticky CTA link stays focusable under `aria-hidden` (`regularticket26.html:636`, `vipticket26.html:647`); sticky top bar on `taxreport*.html` covers the content it promotes and has no `scroll-padding-top`.
- Calendar buttons are `href="#"` (`octchallengeconfirmation*.html:145-147`) and the ICS is one 54-hour event, not three sessions; label says EST while the offset is EDT.
- Tools: range `aria-label`s differ from visible labels (WCAG 2.5.3); `<output>` without `for`; results never announced; `.tip` inside `<label>` flips the toggle it explains (`tax-leak.html:84`); reset is `<a href="#">`; mobile nav simply disappears under 720px; Firefox range thumb has no focus style.
- No `:focus-visible` on `index.html`, both confirmation pages, both prepkit pages, `taxreportvip.html`; no `::selection` anywhere; `tabular-nums` missing on prices/stats on `index.html`, `taxreport*.html`, `prepkit*.html`, `upgradevip.html`.
- `html { font-size: 16px }` overrides user preference and `html, body { overflow-x: hidden }` masks layout bugs on most pages; Tailwind residue `class="scroll-smooth"` / `overflow-x-hidden` / `.hidden` / `.rotate` with no Tailwind loaded.

### 12. Performance / hygiene
- Spiffy loader included twice with contradictory `hideSidebar` on `prepkit*.html`, `taxreport*.html`, `upgradevip.html`; loaded on confirmation pages that have no checkout.
- ~3 MB of 24-bit PNG product shots (`tax-playbook.png`, `calculators.png`, `anti-inflation-pack.png`, ~1 MB each) on the prepkit pages; testimonial photos hotlinked from `images.clickfunnels.com` at 1000px for a 300px column.
- Dead CSS: ~250 lines of landing-page rules on each ticket page (`.kicker`, `.hero`, `.scarcity`, `.shot-grid`, `.guarantee-card`…), `.badge-vip` and `.vip-ribbon` defined for VIP and never used, `.countdown-card`/`.ba-grid` superseded on `index.html`, `.reveal`/`.flash`/`.hbar` in tools.
- Image/alt mismatches on `index.html`: `06-preston-basement.webp` is a slate-blue AI-rendered pyramid graphic; `23-abigail-case-study.webp` used with a Pace Morby/Dean Graziosi alt; six identical `alt="Testimonial"`.
- Tracking host inconsistency (`t.managemoney101.com` vs `212809.t.hyros.com`); footer Contact/Privacy on several pages point to `firstairbnb.com`.

---

## Part 2. Per-page highlights

### `index.html`
Stock generated-landing skeleton: kicker → balanced h2 → equal-card grid ×12, emoji icon tiles, pulsing header dot, evergreen midnight timer, "$85,871" ×10, cost-of-waiting cards that don't sum, gradient scroll-progress bar and anchor bars, 5 templated testimonials with five gold stars each, `--serif` dead, h2→h4 skips, countdown digit soup, FAQ without ARIA, Vimeo iframe untitled, `html{font-size:16px}`, ~70 lines dead CSS. Keep: token palette, 5-pillar hairline list, the Lauren/Chad/Michelle plan tables, the "Verify it yourself" section, lazy/sized images.

### `regularticket26.html` / `vipticket26.html` / `checkout.css`
Least generated pages in the repo (real order summary, tabular prices, skeleton + status, focus rings). Tells: evergreen "50% off" (false on VIP), pulsing dot, ~250 lines of template CSS for absent sections re-declared by `checkout.css`, focusable link under `aria-hidden`, testimonial slots holding slogans, `→` glyph with an unused arrow sprite, "256-bit secure payment", 7 vs 12 session items between siblings, unused `.badge-vip` so the VIP summary never says VIP, VIP slug `tax-fre-…` (verify).

### `upgradevip.html`
Reads generated in two seconds: animated envelope with radial glow, fake three-bar processing meter, confetti, sheen on a gradient pay button, emoji trust badges beside an SVG sprite, uppercase eyebrows over every headline, "unlocked" ×3, four hidden h3s before the h1, "$200" list price that contradicts the VIP page, `.nx-*` block in px/untokenised hex bolted onto a rem/token file, two headings back-to-back with no content between, iframe untitled, Spiffy loaded twice.

### `prepkit.html` / `prepkitvip.html`
Standard OTO template: rose "DO NOT CLOSE" strip, ellipsis h1 with alert icon, autoplay iframe with no title, uppercase "THAT'S WHY I BUILT..." pill (VIP adds a pulsing dot), `✓` glyphs vs sprite, confirm-shame decline, 3 MB PNGs, "Anti-Inflation Investing Pack" vs "Anti-Inflation Pack", Spiffy loaded twice, siblings with different class names, band colours and reduced-motion policies. Keep: honest value-stack math, careful query-param forwarding, VIP's `#check-icon` and `fetchpriority`.

### `taxreport.html` / `taxreportvip.html`
Same page with every class renamed. "⚠️ STOP!" h2 above the h1, hero-metric tiles with unsourced stats, 1/2/3 step chips, six icon-tile cards, four templated "$X saved" testimonials, hairline eyebrow before the final band, `border-left: 3px` quote stripe (VIP), pill kicker (VIP), `<h3>` inside `<button>` (regular) / no FAQ headings (VIP), table without `tabular-nums` and with icon-only cells, sticky top bar covering content, 22-size type ramp, ~15% dead CSS, sprite path drift. Keep: token set, sprite `<use>`, real avatar photos, honest decline link, no reveal animations.

### `octchallengeconfirmation.html` / `octchallengeconfirmationvip.html` / `confirmation.css`
Cleanest copy in the repo. Tells: STEP ONE/TWO/THREE pill chips, `✓` circles, uppercase tracked topstrip, paper cards on a paper band, dead `.kicker`/`.status-dot`/`.vip-ribbon`, footer contrast 3.7:1, calendar buttons `href="#"`, ICS is one 54-hour event, "EST" vs EDT, Spiffy SDK on a non-checkout page, VIP schedule rows that read "Details coming by email" on a paid upgrade receipt.

### `prechallengetraining123.html`
Off-system: dark zinc palette, Sora/Crimson Pro/JetBrains Mono, gold gradient text, radial halos, feTurbulence grain, mono uppercase pill, 28px-radius ghost card with 80px shadow, Tailwind classes with no Tailwind, `<footer>` inside `<main>`, no legal footer. Keep: the embed itself (title, allow list, aspect-ratio, preconnect) and the one-purpose structure.

### `tools/*` + `tools.css` + `tools.js`
Coherent ledger concept undermined by: eyebrow on every h1, all-caps micro-labels as the only sectioning device, roman numerals and "Tool N of 5" ordinals, accent `<em>` in every h1, verbatim trust-chip triplet ×5, hover-lifts, charts rebuilt and re-animated per tick, count-ups, `width` transitions, `.001ms` reduced-motion kill, `.tip` inside `<label>`, aria-label ≠ visible label, results never announced, `<a href="#">` reset, nav hidden on mobile, `#8D9BA6` markers at 2.55:1, uncited peer percentiles, 6× pasted inline grid style, hex colours in page JS, reversal/aphorism copy on every page. Keep: worksheet/statement layout, zero-dependency `tools.js` with URL state and keyboard tabs, 2026 limits in `tax-leak`, lever search in `wealth-trajectory`, fine print generated from live assumptions.

---

## Part 3. Suggested fix order

1. **Tokens** (one edit, many pages): darken `--ink-faint` and `--gold-ink`; add `--on-forest`, `--on-forest-muted`, `--on-gold`; decide `--serif` (load Newsreader or delete); one radius scale.
2. **Shared CSS**: extract `base.css`; make `checkout.css` the only checkout stylesheet; add `upsell.css` for taxreport/prepkit; add a 10-line browser-surfaces block (`:focus-visible`, `::selection`, `text-underline-offset`, `tabular-nums`).
3. **Delete the banned components**: `.kicker`/`.eyebrow`/step chips/pill kickers, pulsing dots, confetti, sheen, processing meters, gradient text, halos, grain, uppercase sectioning in tools.
4. **One icon sprite** at stroke 2; remove all emoji/glyph icons.
5. **Truth pass on numbers and urgency**: one VIP list price, one deadline mechanism or none, one "$85,871" with its source, source or label the tax stats and peer table, add earnings-claim disclosure.
6. **A11y pass**: timers, heading order, FAQ ARIA, iframe titles, sticky-bar focus, calendar links and ICS, tools label/output wiring and live region.
7. **De-duplicate siblings**: VIP pages become deltas; rebuild `prechallengetraining123.html` on site tokens.
8. **Assets**: WebP the three product PNGs; self-host the ClickFunnels testimonial images; remove the second Spiffy loader; fix the mislabelled `index.html` images.
