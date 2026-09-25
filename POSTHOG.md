# PostHog setup: October Challenge and Legacy Wealth Blueprint Webinar

Guide version: `2026-09-26.1`. Updated September 26, 2026: all four initial ticket checkouts now receive Meta's browser-generated `_fbc` value in an optional hidden Spiffy customer field. Previous update (September 22): the hero button test ended and the ticket picker is now the only landing-page behavior. Release verification is recorded below.

This is the shared operating guide for both funnels. Read it before changing tracking, creating reports, or interpreting conversions. It records the installed setup and its limitations; it is not a guarantee that future deployments or account settings remain unchanged.

## Current October status

- **Live:** cold/warm/unknown campaign attribution, first/current/last touch tracking, page and checkout events, scroll milestones, separate audience reports, campaign-filtered heatmaps, and recording lists. The existing pages are shared by both audiences.
- **Live:** optional hidden `ph_distinct_id` order fields and the existing hidden `fbclid` / Reference ID customer fields on regular and VIP checkouts. Campaign forwarding and the checkout's bounded analytics wait are preserved.
- **Live:** the initial regular and VIP checkouts, including their LT variants, forward the browser's existing Meta `_fbc` cookie to a separate hidden, optional Spiffy customer field. The raw `fbclid` customer field remains available for attribution reporting.
- **Live:** the LT cold-traffic routes use separate page and offer labels, the $17 regular/$67 VIP/$50 VIP-upgrade pricing, the same privacy-preserving checkout identity bridge, and hidden Spiffy metadata fields.
- **Released:** PR #7 performance changes are merged and live, with the newer tracker and checkout behavior retained. See the production release evidence at the end of this guide.
- **Active:** the production purchase receiver has its dedicated Spiffy API key and endpoint 210 is active for `order:success`. Signed delivery and a read-only canonical payment lookup passed. Two real paid orders have now been verified end to end with saved anonymous IDs, saved customer FBCLIDs, matching browser journeys, and warm attribution. See the September 17 audit below. Browser checkout/confirmation events must not be reported as paid conversions.
- **Scope:** these cold/warm changes apply to the October Challenge only. Webinar reporting remains separate in the same PostHog project.

## Where to find and maintain this guide

Identical copies live at:

- `/Users/deveshdhardubey/Downloads/Legacy Investing Show/October 2026 3 day challenge/POSTHOG.md`
- `/Users/deveshdhardubey/Downloads/Legacy Investing Show/lwb-tax-masterclass/POSTHOG.md`

Each folder's `AGENTS.md` points here. An agent in another project or chat with access to this Mac can open either absolute path. A remote agent needs a repository checkout or an attached copy; local files are not automatically available in every chat.

When the setup changes, update the date/version and both copies together. Compare them before editing if their contents differ. The checked-in tracker and `vercel.json`, deployed site, and current PostHog settings are the evidence to reconcile. The webinar's `ANALYTICS.md` retains its original page audit and implementation evidence; this file is the cross-funnel guide. Do not store credentials in these documents or depend on a plugin cache to preserve project instructions.

## One project, two separately filtered funnels

Organization: **LIS**, ID `01a08243-6149-0000-a65b-4104883747bd`.

PostHog: **US cloud**, project **600066**, currently named **Default project**. Both trackers intentionally use the same public project ingestion token. Read `POSTHOG_TOKEN` in the relevant tracker when verifying it; it is not an administrative API credential.

| Setting | October 2026 Challenge | Legacy Wealth Blueprint Webinar |
| --- | --- | --- |
| Production host | `go.managemoney101.com` | `join.managemoney101.com` |
| Required event property `funnel` | `october_2026_challenge` | `legacy_wealth_blueprint_webinar` |
| Tracker | `assets/js/challenge-analytics.js` | `assets/js/webinar-analytics.js` |
| Tracker version at verification | `2026-09-22.1` | `2026-09-16.3` |
| First-party ingestion proxy | `/tfc` | `/lwb-events` |
| Browser persistence | SDK default name, localStorage on October origin | `lwb_webinar_analytics`, localStorage on webinar origin; cross-subdomain cookies disabled |
| Dashboard | [October 2026 Challenge Funnel](https://us.posthog.com/project/600066/dashboard/2094096) | [Legacy Wealth Blueprint Webinar](https://us.posthog.com/project/600066/dashboard/2103328) |
| Saved replay view | [October recordings](https://us.posthog.com/project/600066/replay/playlists/2xIdzhrt) | [Webinar recordings](https://us.posthog.com/project/600066/replay/playlists/jsDHTRKP) |

This is reporting separation within one project, not separate permissions or separate billing allowances. Unfiltered project-wide screens can show both funnels. A shared event name such as `cta_clicked` or `checkout_viewed` does not identify the funnel. Always apply the exact `funnel` filter, and use the production hostname as an additional sanity check. Do not combine the two funnels' conversion denominators.

Both trackers register page properties and enforce their funnel labels in `before_send`, including built-in events. Host-specific localStorage means this setup does not establish one joined visitor identity across both subdomains.

## Billing constraint

The user chose one project specifically to avoid paying or adding billing details. The September 16 account check returned `billing_plan=free`, `subscription_level=free`, `has_active_subscription=false`, and `customer_id=null`. No card, paid subscription, or second project was added.

Both funnels share the free monthly allowance of **1 million product analytics events and 5,000 web session recordings**. This is not an unlimited-usage promise. Recheck [pricing](https://posthog.com/pricing), current account usage, and [limits](https://posthog.com/docs/billing/limits-alerts) before recommending any expansion. Do not enable paid products, add billing details, create another project, or raise a paid limit as a routine tracking fix without a new user request authorizing that change.

## October page inventory and behavior

Source paths below are relative to the October folder. `vercel.json` uses `cleanUrls: true` and maps the campaign paths to these files.

| Public path | HTML source | `funnel_step` / `offer` |
| --- | --- | --- |
| `/october` (also `/`, `/index`) | `index.html` | `landing_page` / `challenge` |
| `/octoberlt` (also `/indexlt`) | `indexlt.html` | `landing_page` / `challenge_lt` |
| `/regularticketoct` | `regularticket26.html` | `checkout` / `regular_ticket` |
| `/regularticketlt` | `regularticketlt.html` | `checkout` / `regular_ticket_lt` |
| `/vipticketoct` | `vipticket26.html` | `checkout` / `vip_ticket` |
| `/vipticketlt` | `vipticketlt.html` | `checkout` / `vip_ticket_lt` |
| `/vipupgradeoct` | `upgradevip.html` | `upsell` / `vip_upgrade` |
| `/vipupgradelt` | `vipupgradelt.html` | `upsell` / `vip_upgrade_lt` |
| `/prepkitoct` | `prepkit.html` | `upsell` / `prep_kit` |
| `/prepkitvipoct` | `prepkitvip.html` | `upsell` / `prep_kit_vip` |
| `/taxreportoct` | `taxreport.html` | `upsell` / `tax_report` |
| `/taxreportvipoct` | `taxreportvip.html` | `upsell` / `tax_report_vip` |
| `/octchallengeconfirmation` | `octchallengeconfirmation.html` | `purchase_confirmation` / `challenge` (both tickets land here; the Spiffy VIP flow also redirects to this page) |
| `/octchallengeconfirmationvip` | `octchallengeconfirmationvip.html` | `purchase_confirmation` / `challenge` (legacy alias, not used by the live Spiffy flows) |
| `/octprechallengetraining` | `prechallengetraining123.html` | `fulfillment` / `vip_training` |

Clean source-path aliases are also classified in the tracker. October's `canonical_path` is the normalized served pathname; aliases are not collapsed into one marketing path. When reporting on a page, include its aliases deliberately.

October custom events:

| Event | What it establishes |
| --- | --- |
| `ticket_option_selected` | Click to a regular/VIP ticket route; includes `ticket_type` |
| `checkout_cta_clicked` | Click to `#checkout` |
| `cta_clicked` | Other tracked `.btn` click |
| `upsell_offer_clicked` | Spiffy offer link click, with `action=accept` or `decline`; not a completed transaction |
| `calendar_link_clicked` | Calendar link click, with `calendar_type` |
| `checkout_viewed` | Checkout page initialized |
| `checkout_embed_mounted`, `checkout_embed_loaded` | Spiffy iframe appeared or emitted load during the observation window |
| `purchase_confirmation_viewed` | Confirmation page viewed; not independently verified payment. Since `2026-09-18.2` it carries `offer=challenge` and no `ticket_type`, because regular and VIP buyers share one confirmation page |
| `hero_variant_shown` | Retired September 22, 2026 with tracker `2026-09-22.1`. It was fired once per landing page load during the hero button test (September 18–22) with `variant` = `control` or `picker`. Historical events remain; no new ones are sent |
| `scroll_milestone_reached` | 25/50/75/90/100 percent; once per threshold per page load |
| `challenge_order_paid` | Server-verified successful payment; receiver active; two real linked orders verified, with attribution timing corrected |

Common properties include `funnel`, `funnel_step`, `offer`, `canonical_path`, and `analytics_version`. Click events include `cta_text`, `cta_location`, and `element_id` where available. The SDK captures campaign attribution; URL cleanup permits `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`. October now includes current, first, and last campaign/audience attribution and `scroll_milestone_reached` at 25/50/75/90/100 percent. It does not include webinar Vimeo progress, registration lifecycle, or section-view events.

The original four dashboard tiles are: funnel pageviews, key funnel actions, ad traffic by source/campaign, and Web Vitals P90. All four are scoped to `october_2026_challenge`. These are not a payment reconciliation system. Use successful Spiffy payments for authoritative sales/revenue; iframe activity and confirmation views are behavioral evidence only.

The site's checkout attribution is separate from PostHog's sanitized event data: the landing page forwards query parameters to ticket pages; Spiffy embeds can receive prefill fields and `fbclid`, including legacy values from `localStorage.lis_lead`. Upsell links also preserve attribution on allowed destinations. Do not remove those behaviors while cleaning analytics URLs, and do not send the lead/prefill object to PostHog. Browser analytics cannot inspect payment fields, order amount, or payment success inside the cross-origin Spiffy iframe.

## October cold and warm attribution (September 16, 2026)

Scope is October only. Existing landing and checkout URLs remain in use. Campaign classification is an exact allowlist, not a `warm-` prefix guess. All unmatched or missing campaigns are `unknown`.

Cold campaign values (39 total):

- `bp4-suppgrouppxr-091326`
- `bp4-static2connectyourincome-091326`
- `bp4-static1paycheck401kwhiteboard-091326`
- `bp4-static3keepmoreofwhatyouspenddecadesearning-091326`
- `bp4-giftshoppxr-091326`
- `tg-h4-ch-91626`
- `tg-h3-ch-91626`
- `topten-h1-ch-91626`
- `tg-h1-ch-91626`
- `tg-h2-ch-91626`
- `topten-h4-ch-91626`
- `topten-h3-ch-91626`
- `raise-h1-ch-91626`
- `tg-h5-ch-91626`
- `topten-h2-ch-91626`
- `raise-h4-ch-91626`
- `raise-h3-ch-91626`
- `topten-h5-ch-91626`
- `raise-h2-ch-91626`
- `401k-h3-ch-91626`
- `trashcan-h4-ch-91626`
- `sameret-h3-ch-91626`
- `trashcan-h5-ch-91626`
- `aprilmirror-h2-ch-91626`
- `aprilmirror-h4-ch-91626`
- `401k-h1-ch-91626`
- `sameret-h5-ch-91626`
- `401k-h4-ch-91626`
- `trashcan-h3-ch-91626`
- `401k-h5-ch-91626`
- `trashcan-h1-ch-91626`
- `sameret-h1-ch-91626`
- `401k-h2-ch-91626`
- `sameret-h4-ch-91626`
- `aprilmirror-h3-ch-91626`
- `aprilmirror-h5-ch-91626`
- `sameret-h2-ch-91626`
- `aprilmirror-h1-ch-91626`
- `trashcan-h2-ch-91626`

Warm campaign values (11 total):

- `warm-bp4-giftshoppxr-09132` (supplied by media buyer)
- `warm-bp4-giftshoppxr-091326` (full-date alias independently observed in live traffic)
- `warm-bp4-static3keepmoreofwhatyouspenddecadesearning-091326`
- `warm-bp4-static1paycheck401kwhiteboard-091326`
- `warm-bp4-static2connectyourincome-091326`
- `warm-bp4-suppgrouppxr-091326`
- `warm-sameret-h5-ch-91626`
- `warm-aprilmirror-h1-ch-91626`
- `warm-tg-h1-ch-91626`
- `warm-401k-h1-ch-91626`
- `warm-trashcan-h1-ch-91626`

`traffic_audience` describes the current tagged journey. `first_traffic_audience` and `last_traffic_audience` retain first and most recent tagged attribution. Current attribution uses `october_challenge_current_attribution_v1` in sessionStorage with a 30-minute inactivity expiry; activity refreshes at most once per minute. First/last attribution uses `october_challenge_attribution_v1` in localStorage, expiring 90 days after the last new tagged touch. A newly supplied unknown campaign clears current classification to `unknown`. Untagged navigation within an active journey retains its current UTMs. Sanitized UTM values preserve numeric ad IDs. These are campaign labels, not a claim that every visitor's actual relationship with the business is known.

The dashboard has nine tiles as of this rollout. The three audience reports are [landing visitors by audience](https://us.posthog.com/project/600066/insights/jcAu7huO), [ordered landing-to-checkout conversion](https://us.posthog.com/project/600066/insights/iyYLJ2KX) broken down by first-step audience with a 14-day conversion window, and [exact-campaign historical landing/checkout reporting](https://us.posthog.com/project/600066/insights/156obOjN). Historical reports can use recorded UTMs, but do not invent missing audience events or paid conversions. Reports exclude QA using `coalesce(toString(properties.is_test), 'false') != 'true'`, which retains historical events without the property. Configuration evidence lives in `performance-reports/audience-tracking/posthog-reports.json`.

Two purchase reports are configured and the receiver is now active: [ordered landing → checkout → verified paid conversion](https://us.posthog.com/project/600066/insights/QKTphODw) requires `identity_linked=true` on the paid step, uses unique people and a 14-day window, and attributes audience to the first landing step. [Paid orders and linkage coverage](https://us.posthog.com/project/600066/insights/ILxmGtON) deduplicates `order_id` and separates linked/unlinked orders and revenue. Empty purchase results before activation are not evidence of no sales. Tracking begins at activation; there is no automatic historical backfill.

Separate saved replay views: [Cold](https://us.posthog.com/project/600066/replay/playlists/a4EFuOZl) and [Warm](https://us.posthog.com/project/600066/replay/playlists/vA53R0zd). They filter October events by exact campaign values and exclude test events. A person can appear in both after separate cold and warm visits.

### Segmented heatmaps

[Cold heatmap](https://us.posthog.com/project/600066/heatmaps/JJx9fRVE) and [Warm heatmap](https://us.posthog.com/project/600066/heatmaps/XxafWlyd) use the same `/october` page screenshot, with completed 390/1440 previews. No duplicate website page is needed.

Live testing found that event/cohort filters were ignored by this project's heatmap endpoint. The saved views therefore use `data_url` regular expressions matching the exact `utm_campaign` key and allowlisted values, including parameters before or after it. A nonmatching-control query returned zero; cold and warm returned distinct click datasets. Exact patterns and evidence are in `performance-reports/audience-tracking/heatmaps.json`. Do not replace this with an unverified property filter.

These heatmaps cover URL-tagged visits. Untagged returns whose audience exists only in browser storage are not included. The general heatmap remains available. Heatmap counts are interactions, not purchases or a conversion-rate denominator. Native test-account exclusion is enabled; arbitrary `is_test` event filtering was not proven effective for heatmaps.

### Hidden Reference ID field

On September 16, the existing `fbclid` / Reference ID field was hidden on both Spiffy checkouts at the user's request. Only scoped CSS was added: regular `.checkout #block-364953 { display: none !important; }`, VIP `.checkout #block-364954 { display: none !important; }`. The existing text CUSTOMER field and its `fbclid` mapping remain intact. Inputs `inputText-364953` and `inputText-364954` remain enabled and optional. Live hosted checkout verification confirmed exact synthetic `fbclid` prefill values, invisible wrappers, the PostHog fields still hidden, and unchanged $47/$147 totals. No form was submitted. This was published in Spiffy; no site code or checkout loading change was made for this visibility update.

The LT checkouts retain the same enabled, optional fields and mappings: regular checkout 40584 has Reference ID wrapper `#block-367795` and PostHog Distinct ID wrapper `#block-367796`; VIP checkout 40585 has wrappers `#block-367806` and `#block-367807`. On September 20, scoped CSS was published: `.checkout #block-367795, .checkout #block-367796 { display: none !important; }` on regular LT and `.checkout #block-367806, .checkout #block-367807 { display: none !important; }` on VIP LT. Synthetic `fbclid` and `ph_distinct_id` URL values were confirmed both populated and hidden on the live checkouts. Do not disable or remove the inputs.

### Hidden Meta FBC field

On September 26, each initial checkout received an optional Spiffy CUSTOMER field with URL key `fbc`. The four ticket-page embeds read the browser's existing `_fbc` cookie and pass its exact value as `fbc` alongside the existing raw `fbclid`, UTMs, and `ph_distinct_id`. They never synthesize an FBC value from `fbclid`; direct, blocked, or non-Meta visits therefore leave `fbc` empty, which is expected.

The `fbc` inputs remain enabled so Spiffy persists them for the purchase webhook, but scoped checkout CSS hides only their own wrappers: original regular checkout 40200 uses `#block-368893`, original VIP checkout 40203 uses `#block-368894`, LT regular checkout 40584 uses `#block-368895`, and LT VIP checkout 40585 uses `#block-368897`. Hosted-checkout verification used a synthetic FBC URL value and confirmed the field populated before its wrapper was hidden. No purchase was submitted. Do not replace the existing `fbclid` field or hide fields with broad selectors.

FBC is customer attribution data, not PostHog data: do not add it to browser events, session replay, server purchase events, or these notes. The external purchase automation may map Spiffy's persisted `Fbc` value directly to Meta Conversions API's `fbc` field; it must convert minor-unit order totals to major currency units independently.

### Checkout identity bridge and payment receiver

All four ticket embeds explicitly forward the five current UTMs and an anonymous `ph_distinct_id`. They wait up to 800 ms for analytics, then render anyway. SDK identity is read from the ready SDK or its existing localStorage entry; no email, phone, or lead object is used as identity. Spiffy script loading starts after DOMContentLoaded to avoid its body-not-ready error.

Spiffy account 3074 now has optional text ORDER field `PostHog Distinct ID`, URL key `ph_distinct_id`. It is published on original regular checkout 40200 (`#block-367236`) and VIP checkout 40203 (`#block-367249`), with each field hidden by its unique wrapper, and on LT regular checkout 40584 (`#block-367796`) and VIP checkout 40585 (`#block-367807`), also hidden by their respective scoped wrappers. Existing `fbclid`, prefill, prices, and offers are retained. No purchase was submitted for verification.

The new Vercel receiver is `/api/spiffy-webhook`; Spiffy endpoint 210 subscribes to `order:success`. Authentication requires both a secret URL token and `spiffy-signature` HMAC-SHA256 over `${timestamp}.${rawBody}`, with a five-minute timestamp tolerance and account 3074. Environment secret names are `SPIFFY_WEBHOOK_VERIFY_TOKEN` and `SPIFFY_WEBHOOK_SIGNING_SECRET`. Never record their values in documentation. Real signed Spiffy `test` calls returned 200 without creating analytics events. Invalid signatures fail closed. Final production verification returned 200 for a signed non-ingesting test and 401 for an invalid signature. The receiver passed 19 focused tests, including nullable attribution, linked/unlinked orders, retry deduplication, ownership, and privacy.

**The purchase connection was activated September 17, 2026 (Asia/Kolkata).** Following explicit user approval, a dedicated key named `October Challenge PostHog Purchase Tracker` was created and stored as sensitive production environment variable `SPIFFY_API_KEY` in the existing Vercel project. The temporary owner-only secret file was deleted after storage; no credential values belong in this guide. The existing merged production release was redeployed with the new environment, then Spiffy endpoint 210 was activated for `order:success`.

The receiver resolves canonical order fields, payments, checkout, and attribution; requires checkout account 3074 and IDs 40200/40203/40584/40585; sends only the earliest succeeded positive payment and allowlisted anonymous attribution; and uses a deterministic UUID for retries. LT ticket payments are labeled `regular_ticket_lt` or `vip_ticket_lt`. Unlinked orders use a synthetic order identity and cannot complete a visitor funnel. First-time direct checkout visits whose SDK takes longer than 800 ms may remain unlinked because checkout renders without waiting further.

Activation checks: all 19 receiver tests passed. A read-only API lookup using the new credential resolved existing paid order 2516863, verified account 3074 / checkout 40200, and produced the expected warm, unlinked purchase payload locally without sending it to PostHog. This older order predates the hidden identity field. Spiffy signed test `evt_test_d638ca82eec1cbcb40e05847` was delivered to the redeployed production receiver with HTTP 200 and no analytics event. Endpoint 210 was confirmed active. Production deployment `dpl_GB6qDPUsBKmjF8XciR13jxe1eEkB` (`october-2026-challenge-6og11fue3-legacy-investing-show.vercel.app`) was Ready and aliased to `go.managemoney101.com`. The landing page, both ticket pages, and browser tracker returned HTTP 200 with identical content hashes before and after deployment.

**At activation:** no new paid checkout was submitted or observed during activation. Verify the persisted `ph_distinct_id` metadata on the next real order, its received `challenge_order_paid` event, and linked funnel behavior. That verification was subsequently completed for two real orders in the audit below. Reconcile successful payments in Spiffy; do not treat confirmation-page views as payments. No historical purchase backfill was performed.

The configured paid-event properties are `funnel`, `offer`, `order_id`, `payment_id`, `payment_status`, `amount_minor`, `amount`, `currency`, `identity_linked`, `traffic_campaign`, `traffic_audience`, sanitized UTMs and available first-touch campaign/audience, `tracking_source=spiffy_webhook`, and `is_test=false`. The timestamp comes from the earliest successful positive payment. A deterministic event UUID and `$insert_id` keep retries consistent; reports also deduplicate order IDs. Names, emails, phone numbers, payment details, and raw order payloads are excluded.

This receiver measures the initial successful payment, including any amount in that payment. It does not reconcile later upsell payments, refunds, or full customer lifetime revenue. Unlinked payments are reported separately rather than being counted as matched landing-page conversions. The September 17 audit below verifies the persisted `ph_distinct_id` field, received paid events, and linked funnel behavior on two real orders.

The initial attribution release `dpl_CpeVeiFt5sMmE7EQjWNv4PPb16by` was Ready and aliased to `go.managemoney101.com`. Tracker version `2026-09-16.2` includes the anonymous identity fallback. Live PostHog QA confirmed cold visits followed by a warm return retained first=cold and last=warm; QA events had `is_test=true`. Both regular and VIP checkout hidden identity fields were confirmed populated and invisible on production. Local attribution checks cover campaign changes, expiry, storage failure, numeric UTMs, privacy, and checkout fail-open behavior.

## Hero button A/B test (September 18–22, 2026): ended, picker shipped

**Result.** The test ran from the September 18 deploy to September 22, 17:25 UTC. Real visitors only (Meta crawler cities excluded), exposed by `hero_variant_shown`:

| Arm | Exposed | Picked a ticket | Viewed checkout | Paid buyers | Revenue per exposed visitor |
| --- | --- | --- | --- | --- | --- |
| `control` (jump link to `#pricing`) | 677 | 21 | 26 | 4 (0.59%) | $0.92 |
| `picker` (ticket picker under the hero button) | 631 | 38 | 39 | 11 (1.74%) | $3.62 |

Fisher's exact test on buyers per exposed visitor: two-sided p ≈ 0.07. The planned read was about 1,500 visitors per arm. The user chose to call it early for the picker on September 22. Full write-up: `performance-reports/report-2026-09-22.html`.

**Rollout.** On September 22 at 17:25 UTC the flag [`hero-cta-variant`](https://us.posthog.com/project/600066/feature_flags/895912) was set to `picker` 100% / `control` 0% so all visitors got the picker before the code change deployed. Tracker `2026-09-22.1` no longer reads the flag. After that release is live, the flag can be disabled and archived.

**Current behavior.** The picker is plain page behavior in the inline "Hero ticket picker" script in `index.html`, set up on page load with no dependency on PostHog. The hero "Grab Your Ticket Now" button opens a two-ticket picker directly under itself (VIP $147 first, General Admission $47 second, "Not yet, keep reading" to close). The sticky "Get Your Seat" button scrolls to the hero and opens the same picker. The buttons keep `href="#pricing"` as the no-JavaScript fallback. Picker links are real `/vipticketoct` and `/regularticketoct` links that use `trackTicketLeadAndGo`, so campaign parameter forwarding, the Meta Lead event, and `ticket_option_selected` work unchanged. Their `cta_location` is `hero_picker`; the hero section is `hero` and the bottom CTA section is `final_cta`. The LT landing page (`indexlt.html`) never had the picker and is unchanged.

**Removed in `2026-09-22.1`.** `resolveHeroVariant`, the flag lookup, `window.__challengeAnalytics.heroVariant`, the `hero_cta_variant` super property, the `hero_variant_shown` event, the `challenge-hero-variant` browser event, and the early-click exclusion marker `__challengeHeroInteractedBeforeVariant`. The two readout insights ([table](https://us.posthog.com/project/600066/insights/jt1uKvE0), [funnel](https://us.posthog.com/project/600066/insights/7WES5HGo)) keep the test-period data but receive no new exposures. For landing-page conversion going forward, start funnels at the landing `$pageview` with `offer=challenge`.

## Webinar page inventory and behavior

Source paths below are relative to `lwb-tax-masterclass`.

| Public path | HTML source | Step / variant |
| --- | --- | --- |
| `/taxseasonisnow` (also `/`) | `index.html` | `registration_landing` / `tax_season` |
| `/future` | `future.html` | `registration_landing` / `family_wealth_future` |
| `/tax-strategies` | `tax-strategies.html` | `registration_landing` / `tax_strategies` |
| `/tax-strategies-yt` | `taxstrategiesyt.html` | `registration_landing` / `tax_strategies_youtube` |
| `/taxseasonconfirmation` | `confirmation.html` | `registration_confirmation` / `tax_season` |
| `/taxstrategiesconfirmationyt` | `taxstrategiesconfirmationyt.html` | `registration_confirmation` / `tax_strategies_youtube` |
| `/lwbfoundations` | `lwbfoundations.html` | `foundations_sales` / `course_and_ai` |

The first six routes had recurring date/calendar updates, with 24 webinar-date commits across the audited eight weeks. Foundations was last updated July 17. Maintenance suggests active operations but does not prove paid traffic or winning ads. Use actual pageviews and campaigns to identify current traffic. Tracking begins at installation; it does not backfill prior visits.

The first three landing variants submit to `/api/register`, then redirect to `/taxseasonconfirmation`; the YouTube variant redirects to `/taxstrategiesconfirmationyt`. Successful registration means the API accepted the submission and forwarded it to Zapier. It does not prove attendance, delivery of follow-up messages, or a purchase.

Webinar custom events:

| Events | Trigger / relevant properties |
| --- | --- |
| `registration_form_opened`, `registration_form_started` | Modal opened, then actual input/change; `form_id` |
| `registration_form_validation_failed` | Client-side invalid submission; field names only, never values |
| `registration_form_submitted`, `registration_succeeded`, `registration_failed` | Request lifecycle; success only after accepted API response; `failure_type` where applicable |
| `registration_confirmation_viewed` | Confirmation page viewed separately from API success |
| `cta_clicked`, `calendar_link_clicked`, `outbound_link_clicked` | `element_text`, `element_type`, `element_id`, `section`, destination host/path, and CTA action where applicable |
| `scroll_milestone_reached` | 25/50/75/90/100 percent; once per threshold per page load |
| `section_viewed` | Section intersects viewport; `section`, `section_index`; not a reading-time measurement |
| `video_started`, `video_progress`, `video_completed`, `video_error` | Confirmation Vimeo players; progress at 25/50/75/90 percent; provider, video ID, player instance |
| `checkout_viewed`, `checkout_embed_mounted`, `checkout_embed_loaded` | Foundations Whop checkout visibility/iframe availability; `checkout_provider=whop`, `offer=course_and_ai`; not a purchase |

The four forms dispatch `lwb:registration` events, which the tracker maps to the lifecycle above. Keep those hooks when replacing form code, and ensure analytics failure cannot block registration. Embedded purchases require provider-side integration for confirmation; none was added by this setup.

Webinar properties include `funnel`, `funnel_step`, `page_name`, `page_variant`, `canonical_path`, `served_path`, `analytics_version`, and `is_test`. Alias URLs collapse into `canonical_path`; `served_path` retains the actual path. The `lwb_webinar_attribution_v1` localStorage entry stores first/last landing path, referrer origin/path, and UTM source/medium/campaign/content/term/id. New sessions, external referrals, and changed campaigns can refresh the last touch; same-campaign confirmation redirects preserve the original landing. Version `2026-09-16.3` preserves numeric ad IDs that earlier text redaction mistakenly treated as phone numbers.

The webinar dashboard has **nine tiles**: ordered registration conversion; traffic by page, campaign, and source; registration actions and failures; video engagement; calendar/outbound clicks; and page engagement. Every tile uses `funnel=legacy_wealth_blueprint_webinar` and `is_test=false`. The ordered funnel is landing `$pageview` with `funnel_step=registration_landing` → form opened → form submitted → registration succeeded, broken down by first-touch `page_variant`. The local `analytics-posthog-setup.json` documents eight trend definitions and seven heatmaps; the additional ordered conversion tile exists in PostHog.

## Shared SDK, privacy, and proxy setup

Both trackers use a single manual `$pageview` after initialization, automatic pageleave, autocapture, dead-click capture, browser exceptions, heatmap collection, session replay, and Web Vitals LCP/CLS/FCP/INP. Use percentile aggregation for the October Web Vitals P90 tile; metric values can arrive in separate events. Capture depends on SDK loading, browser support, visitor activity, blockers, and account limits.

Each HTML page includes its tracker once. Both scripts stop if another `window.posthog` already exists. A second snippet can silently prevent the intended tracker from initializing. Production-host gates keep normal localhost and preview visits out of analytics.

Both mask inputs and block iframes in replay. October additionally blocks `spiffy-element` and `.checkout-mount`; its sanitizer removes selected sensitive property keys and non-UTM URL query values. Webinar additionally masks form text, blocks checkout/Whop elements and `[data-ph-no-capture]`, redacts sensitive text/properties, and strips captured network headers/bodies. Both trackers preserve raw `$snapshot` content before adding labels so replay payload structure is not recursively truncated. These implementations differ; do not assume October has every webinar privacy rule or test feature. Do not put personal information in campaign tags or add form values to events. No explicit cross-funnel identification is configured.

In each `vercel.json`, keep the proxy rules ahead of page routes:

| Source, with `{proxy}` replaced by `/tfc` or `/lwb-events` | Destination |
| --- | --- |
| `{proxy}/static/:path(.*)` | `https://us-assets.i.posthog.com/static/:path` |
| `{proxy}/array/:path(.*)` | `https://us-assets.i.posthog.com/array/:path` |
| `{proxy}/:path(.*)` | `https://us.i.posthog.com/:path` |

The `(.*)` syntax preserves trailing slashes needed by SDK ingestion. An earlier October proxy produced HTTP 308 responses; preserve the working rewrites and verify event requests, not just the HTML page. PostHog project replay/heatmap capture is enabled; configured app URLs include both production origins. A project-level change can affect both funnels.

## Heatmaps and recordings

Open [PostHog Heatmaps](https://us.posthog.com/project/600066/heatmaps). Saved views use the full production URL and viewport widths **390** and **1440**. Do not use a wildcard that mixes the two hosts. Query-string/alias variants may require adjusting the heatmap's URL match. Saved views do not imply historical data exists.

| Saved view | Short ID | Screenshot status checked September 16 |
| --- | --- | --- |
| October Challenge / Landing (`/october`) | `Od0AZlPl` | Completed |
| LWB Webinar / Tax Season | `zbvUs3YA` | Completed |
| LWB Webinar / Future | `hUtSgocd` | Completed |
| LWB Webinar / Tax Strategies | `ZtM5tpfM` | Completed |
| LWB Webinar / YouTube Tax Strategies | `nrpYWWYw` | Completed |
| LWB Webinar / Confirmation | `O1xCoWIt` | Failed: remote screenshot service HTTP 408 timeout |
| LWB Webinar / YouTube Confirmation | `GupVhbdx` | Failed: remote screenshot service HTTP 408 timeout |
| LWB Webinar / Foundations | `KGFNauTy` | Completed |

The two confirmation previews were initially processing and later timed out. This is a preview-rendering issue, not evidence that collection stopped. Collection was enabled and webinar click coordinates were received. Check the live status before claiming the previews are fixed; the toolbar is an alternative way to inspect page heatmaps. Other October pages are instrumented but do not yet have individually saved screenshot views in this inventory.

Both replay playlists use their exact funnel event-property filter, with a default last-seven-days window. Webinar additionally requires `is_test=false`. Adjust the date range when needed. Sessions must have recorded data and matching events to appear. Use masked recordings as evidence of observed behavior, not proof of why a visitor bought or left.

## Verification and safe maintenance

1. Read this guide, check the relevant repo's status and current branch, and inspect existing changes before editing. Select LIS / project 600066 in PostHog; verify the current account and schema before querying or mutating anything.
2. For a new page, add the route classification and exactly one tracker include. Retain the exact funnel label and relevant form/checkout hooks. Keep existing Meta, Kit, Clarity, calendar, Vimeo, Spiffy, and Whop behavior intact.
3. Run `node --check assets/js/challenge-analytics.js` or `node --check assets/js/webinar-analytics.js`, parse `vercel.json`, and run `git diff --check`. October PR #7 added durable checks: `node --test tests/*.test.js tests/*.test.cjs` (44 node:test cases plus 10 checkout scenarios). They cover attribution, the identity bridge, receiver validation/privacy, and font references. Earlier local copies remain under `performance-reports/`. Use focused browser checks for the behavior changed.
4. Webinar QA uses `?analytics_test=1`; the flag persists in sessionStorage for that browser session. A fresh browser context is safest. Local-only testing can set `window.__LWB_ANALYTICS_TEST__=true` before the script; token override is `window.__LWB_POSTHOG_TOKEN__`. Prefer a mocked SDK/ingestion for local tests so synthetic events do not enter production. Mock `/api/register` responses; do not create fake Zapier leads.
5. October also supports `?analytics_test=1`, sticky in sessionStorage. Its local test flag is `window.__CHALLENGE_ANALYTICS_TEST__`; token override is `window.__CHALLENGE_POSTHOG_TOKEN__`. Dashboard filters exclude `is_test=true` while retaining historical events with a missing flag. Use mocked ingestion locally. Do not place real checkout orders for routine QA.
6. When deployment is authorized, use that repo's existing release process. Confirm the Vercel deployment is Ready and the production alias serves the intended tracker version and all changed pages. A local edit or pushed commit alone does not prove deployment. Webinar's verified Git deployment was commit `64921da`, Vercel project `lwb-tax-masterclass`, serving `join.managemoney101.com`.
7. In a real browser, inspect `window.__challengeAnalytics` or `window.__lwbWebinarAnalytics`, `posthog.get_property('funnel')`, SDK loading, and proxy request responses. Confirm heatmap/replay settings and masking. Check for redirect loops, HTTP 308 ingestion, duplicate snippets, or blocked SDK requests.
8. In PostHog, confirm fresh events from the expected host with the exact funnel label and correct path/campaign. For replay/heatmap changes, retrieve an actual recording or heatmap result. Preserve existing October and webinar dashboard tiles and their exact funnel/test filters. Do not interpret an empty date range as a broken installation without checking activity and ingestion.
9. Record what was actually checked, remaining limitations, and relevant deployment/version evidence in both copies of this guide. Stop task-created servers and browsers; preserve the user's existing processes. Keep `POSTHOG.md` and `AGENTS.md` excluded from the public static-site deployment.

September 16 production verification received webinar pageviews, form/CTA/engagement events, a non-test accepted registration, a playable QA recording, and heatmap click coordinates. At that original verification, all 13 dashboard tiles executed with their respective funnel filters, before October expanded from four to nine tiles. These are installation checks, not a campaign performance conclusion.

At the original guide audit, October's live tracker matched the local tracker byte-for-byte; its landing page, tracker, and proxied SDK returned HTTP 200, and the landing page included the tracker once. The local October checkout was at `50205d9` with unrelated working-tree changes, so future agents must inspect those before deploying. The subsequent September 16 audience rollout and its deployment are documented in the October section above.

## Meta ad-review crawler traffic (September 18, 2026)

About 19% of October landing visitors between September 14 and 18 (299 people) geolocated to seven Meta data-center cities: Prineville OR, Forest City NC, Fort Worth TX, Altoona IA, Gallatin TN, Luleå (Sweden), and Clonee (Ireland). Each had exactly one session of about 31 seconds, zero bounces, arrived from facebook.com with `utm_campaign` but no `utm_source` (Meta's crawler does not fill URL placeholders), clicked ticket buttons, loaded checkouts, scrolled, and never bought. 58 of 59 rage-click people were this crawler. `$virt_is_bot` did not flag it. Each ad receives roughly eight such visits at launch, so a batch of 34 ads produced 262 crawler visitors.

Treat it as noise. The two hero-test insights exclude it with `coalesce(toString(properties.$geoip_city_name), '') NOT IN ('Prineville', 'Luleå', 'Forest City', 'Clonee', 'Fort Worth', 'Altoona', 'Gallatin')`. Apply the same exclusion to any landing, checkout, rage-click, or scroll report; the older dashboard tiles and the historical audience reports do not exclude it yet. Fort Worth can include real residents, so the filter slightly overcounts; the effect was under 1% of visitors. A missing `utm_source` on a facebook.com visit from one of these cities is the crawler, not a tagging error in Ads Manager. Do not add a client-side block for these visits without a user request; blocking by IP city is not available in the browser tracker.

## Analysis rules and references

For traffic reports, use an explicit date range/timezone and distinguish pageviews, sessions, people, form submissions, accepted registrations, and succeeded payments. Inspect event/property availability through PostHog's current tools before writing queries. Keep the funnel filter even when restricting by URL. Report missing attribution and tracking limits honestly; git update frequency cannot establish traffic or causality.

Official references: [dashboards](https://posthog.com/docs/product-analytics/dashboards), [funnels](https://posthog.com/docs/product-analytics/funnels), [heatmaps](https://posthog.com/docs/toolbar/heatmaps), [session replay privacy](https://posthog.com/docs/session-replay/privacy), and [replays from insights](https://posthog.com/tutorials/explore-insights-session-recordings). Use the connected PostHog plugin's current tools and documentation; recheck tool schemas rather than copying stale API commands from a previous chat.

## September 16 performance release

PR #7 was merged to `main` at `35ea74d905dd1a468d82979d42758e561ada3758` and automatically deployed to production by Vercel. Ready deployment: `october-2026-challenge-3bqzgb08l-legacy-investing-show.vercel.app`. The live `/october`, both ticket routes, tracker, and Vimeo facade script were confirmed byte-identical to merged main. Both payment forms loaded at $47/$147 with populated, hidden `fbclid` and anonymous ID fields. Fresh marked cold regular-checkout, warm VIP-checkout, and cold landing page events were received in PostHog after deployment. Desktop production hero playback was observed; mobile-width iframe mounting was confirmed, but physical-phone playback remains unverified. No payment was submitted. The purchase webhook remained inactive during that September 16 release; it was subsequently activated as recorded above.

This release preserves tracker `2026-09-16.2`, its checkout identity/UTM integration, and proxy paths. Mutable scripts/styles revalidate after deployments; only content-hashed fonts receive immutable caching. Four previously click-to-play Vimeo players now load after a play action; prep-kit autoplay stays eager. Vimeo player-load counts therefore begin on click rather than every page arrival, while PostHog pageviews retain their original traffic meaning.

## September 17 real-purchase audit and repair

Audit cutoff: **2026-09-16 20:22:40 UTC** (September 17 01:52:40 Asia/Kolkata). Spiffy orders created from 16:00 UTC through that cutoff yielded two new October orders after activation:

| Order | Offer | Initial succeeded payment | Campaign / audience | Hidden fields |
| --- | --- | --- | --- | --- |
| 2518635 | Regular | $47 USD | `warm-bp4-suppgrouppxr-091326` / warm | Saved anonymous order ID and nonempty customer FBCLID |
| 2518737 | VIP plus workbook | $184 USD | `warm-bp4-static3keepmoreofwhatyouspenddecadesearning-091326` / warm | Saved anonymous order ID and nonempty customer FBCLID |

Order 2518737 also collected a later $47 upsell by the cutoff. Thus Spiffy collected $278 across three succeeded payments, while this receiver correctly measures $231 across two initial payments. Do not present the initial-payment report as full funnel revenue. The persisted order field is `field_name=ph_distinct_id`, `field_id=account_3361`; the customer field is `field_name=fbclid`, `field_id=account_3350`. FBCLID values were nonempty (176/177 characters); their contents are not published here. Both purchase webhook deliveries were marked delivered, both paid events used the exact saved browser distinct ID, and both buyer sessions had replay records. This proves storage and PostHog linkage, not Meta Ads/CAPI matching quality.

**Issue found and fixed:** both original paid events had `traffic_audience=unknown` and no campaign, although the canonical orders later returned computed warm attribution. Receiver PR [#8](https://github.com/legacy-investing-show/october-2026-challenge/pull/8) now prefers completed canonical attribution. If it is unfinished, a tagged canonical `checkoutview` supplies only the five allowlisted UTMs. `attribution_source` records `computed` or `checkoutview`. The fallback does not invent first-touch attribution. If neither source is ready, the receiver returns 503; automatic provider retry timing for an untagged pending order has not been independently verified. Three older direct October orders were checked and had computed attribution with null campaigns, which still records legitimate unknown traffic.

The two paid events were refreshed using PostHog's documented upsert identity: identical UUID, event name, payment timestamp, and distinct ID, retaining the receiver payload and adding confirmed attribution. Two landing pageviews from the VIP buyer's cached tracker `2026-09-14.1` were also enriched with warm labels using their already-recorded exact campaign; original properties and identity were retained, excluding `$set`/`$set_once` during re-ingestion. PostHog merges duplicate copies asynchronously, so raw event queries may temporarily show both copies. The paid revenue report still groups by order ID and now prefers a tagged copy on timestamp ties. Verified report result: **2 linked warm orders, 0 unlinked orders, $231 initial-payment revenue**. The native ordered funnel shows both warm buyers completing landing → checkout → paid; older missing-label visits can remain in a separate breakdown, so do not sum breakdown groups as unique people. No synthetic purchases or new charges were created.

All nine October dashboard tiles ran successfully. Fresh cold/warm pageviews, checkout events, scroll milestones, autocapture and Web Vitals were present; campaign-filtered cold and warm heatmaps returned interactions. Both buyer recordings existed and reported zero console errors. One separate landing session recorded `Error invoking postMessage: Java object is gone`; no corresponding purchase/checkout failure was established.

Fresh browser checks on regular and VIP checkouts confirmed $47/$147 base prices. Reference-ID inputs `inputText-364953` / `inputText-364954` contained the exact supplied QA FBCLID; visitor-ID inputs `inputText-367236` / `inputText-367249` were populated. All four inputs were hidden, enabled, and optional. No form was submitted.

PR #8 merged as `e8aa1a971511167b7c7a320dd5ef111ccd6abf39`. Production deployment `dpl_2dy1bjbkDoYiN6f3FtoJ8iyyhxtD` (`october-2026-challenge-3u6o14mv4-legacy-investing-show.vercel.app`) was Ready and aliased to `go.managemoney101.com`. All 47 automated checks passed, including 21 receiver checks; independent review found no checkout changes, payment writes, added polling, or waits. A signed Spiffy test after deployment returned HTTP 200. The landing page, both checkout pages, and browser tracker were byte-identical to the unchanged release assets. Only server analytics logic and its tests changed. No new live post-fix purchase was required or submitted for QA.

Reference for the event repair: [PostHog event deduplication and updates](https://posthog.com/docs/data/events#event-deduplication).

## September 17: 34 additional cold campaigns

All 34 newly supplied `*-ch-91626` values listed above were added explicitly to the browser tracker and paid-order receiver. Totals are 39 cold and 6 unchanged warm values. No family/prefix rule was added; unmatched campaign values remain unknown. Existing stored first/current/last touches are reclassified from their saved UTMs when the new tracker reads them, including untagged navigation.

Existing landing-audience insight `jcAu7huO` and historical campaign insight `156obOjN` now recognize these values retrospectively from recorded UTMs. Cold heatmap `JJx9fRVE` and replay view `a4EFuOZl` include all 39 campaigns; their saved configuration was read back. Both SQL reports executed successfully, and the expanded heatmap returned captured click interactions. Historical raw events were not rewritten for this expansion. Native audience funnels and the paid report retain event-time labels for older events; updated browser and receiver events use the new allowlist.

Release: PR [#9](https://github.com/legacy-investing-show/october-2026-challenge/pull/9), merge `3e0a6c41f13de1aa00c36d50f3638fc67d270864`, production deployment `dpl_4kx22BAQKVsru3PX38SH5q361k6y`, Ready and aliased to `go.managemoney101.com`. Tracker version `2026-09-17.1`. All 86 tests passed, including every new campaign, browser/server parity, saved-touch reclassification, warm stability, and near-miss exclusion. Public tracker, landing HTML, and both checkout HTML files matched the reviewed source byte for byte. Production code changes contain only the two campaign maps and tracker version; no checkout, UI, payment, pricing, or loading behavior changed.

Fresh marked production QA for `trashcan-h2-ch-91626` confirmed campaign forwarding from the landing page into the regular checkout, a loaded $47 payment form, and received PostHog pageview, ticket selection, checkout viewed/mounted/loaded, and Web Vitals events with `traffic_audience=cold`, `analytics_version=2026-09-17.1`, and `is_test=true`. No purchase was submitted.

## September 18: hero button test and shared confirmation page

Tracker `2026-09-18.2`, PR [#11](https://github.com/LEGACY-INVESTING-SHOW/october-2026-challenge/pull/11). Added `resolveHeroVariant`, the `hero_variant_shown` event, the `hero_cta_variant` super property, and the picker markup, styles, and inline script in `index.html`. `/octchallengeconfirmation` now reports `offer=challenge`; `purchase_confirmation_viewed` no longer carries `ticket_type`. The VIP confirmation route stays classified as an alias but is not used by the live Spiffy flows. Four tests were added (variant resolution, control fallback, non-landing routes, shared confirmation); all 98 tests pass. Local browser checks confirmed the picker opens under the visible hero button at 375 px and 1280 px, the button label changes to "Choose your ticket below", the picker links carry `/vipticketoct` and `/regularticketoct`, and the sticky button scrolls to the hero and opens the picker. No checkout, payment, pricing, or upsell page changed. Production verification is pending the PR merge; record the deployment and a live `hero_variant_shown` event here after release.

## September 17: five additional warm campaigns

Added the five supplied warm campaigns above to both browser and paid-order receiver exact allowlists. Current totals: 39 cold and 11 warm. Tracker version: `2026-09-17.2`. Existing landing-audience and historical campaign reports, warm heatmap `XxafWlyd`, and warm replay view `vA53R0zd` were updated and read back. Reports executed successfully and historical recorded UTMs now classify the five campaigns as warm. The expanded warm heatmap returned captured interactions. Historical raw events were not rewritten; the older event-time audience limitations noted above still apply.

PR [#10](https://github.com/legacy-investing-show/october-2026-challenge/pull/10) merged as `3eb0193bb134c2de3753c7fb7bfb2b92932aecb8`. Production deployment `dpl_9ZJtwNYa7NuBSoSnzwCyZ8UMBDTB` was Ready and aliased to `go.managemoney101.com`. All 94 tests passed, including all five warm campaigns, near-miss exclusion, preserved cold classification, and browser/server parity. The live tracker, landing HTML, and both checkout HTML files matched the reviewed release. Production code changes are campaign map entries and tracker version only; no checkout, payment, UI, price, or loading behavior changes.

Production QA: the regular checkout loaded its $47 payment form for `warm-sameret-h5-ch-91626`. PostHog received marked `checkout_viewed` and Web Vitals events with warm audience, tracker `2026-09-17.2`, and `is_test=true`. No payment was submitted.

### PR #11 review fixes

Tracker `2026-09-18.2` excludes failed/missing evaluations and pre-assignment CTA use from experiment exposures. Fallback pricing navigation remains immediately usable; there is no added checkout wait. A valid response can still assign the variant after a transient failure when the CTA has not been used. The picker ignores stale close timers after reopening, and its inner spacing keeps the VIP badge clear of the animation clipping edge. Focused regression tests cover these cases. Production verification follows the merge.

### September 19: reliable ticket navigation

Landing ticket links use their attributed `href` for native browser navigation. The Meta Lead call remains best effort, but no JavaScript navigation lock or 200 ms redirect delay gates checkout. This avoids swallowing later clicks when the page is restored from browser history and preserves modified-click/new-tab behavior. Query parameters still pass through to both checkout URLs. Checkout identity bridging, the PostHog tracker version, and experiment assignment are unchanged.
