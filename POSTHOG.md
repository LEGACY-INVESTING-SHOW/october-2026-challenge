# PostHog setup: October Challenge and Legacy Wealth Blueprint Webinar

Guide version: `2026-09-16.2`. Last checked: September 16, 2026.

This is the shared operating guide for both funnels. Read it before changing tracking, creating reports, or interpreting conversions. It records the installed setup and its limitations; it is not a guarantee that future deployments or account settings remain unchanged.

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
| Tracker version at verification | `2026-09-16.2` | `2026-09-16.3` |
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
| `/regularticketoct` | `regularticket26.html` | `checkout` / `regular_ticket` |
| `/vipticketoct` | `vipticket26.html` | `checkout` / `vip_ticket` |
| `/vipupgradeoct` | `upgradevip.html` | `upsell` / `vip_upgrade` |
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
| `purchase_confirmation_viewed` | Confirmation page viewed; not independently verified payment. Since `2026-09-18.1` it carries `offer=challenge` and no `ticket_type`, because regular and VIP buyers share one confirmation page |
| `hero_variant_shown` | Landing page only. Fired once per page load when the `hero-cta-variant` flag resolves; `variant` is `control` or `picker`, `experiment` is the flag key. Use it as the first funnel step when comparing variants |

Common properties include `funnel`, `funnel_step`, `offer`, `canonical_path`, and `analytics_version`. Click events include `cta_text`, `cta_location`, and `element_id` where available. The SDK captures campaign attribution; URL cleanup permits `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`. October now includes current, first, and last campaign/audience attribution and `scroll_milestone_reached` at 25/50/75/90/100 percent. It does not include webinar Vimeo progress, registration lifecycle, or section-view events.

The original four dashboard tiles are: funnel pageviews, key funnel actions, ad traffic by source/campaign, and Web Vitals P90. All four are scoped to `october_2026_challenge`. These are not a payment reconciliation system. Use successful Spiffy payments for authoritative sales/revenue; iframe activity and confirmation views are behavioral evidence only.

The site's checkout attribution is separate from PostHog's sanitized event data: the landing page forwards query parameters to ticket pages; Spiffy embeds can receive prefill fields and `fbclid`, including legacy values from `localStorage.lis_lead`. Upsell links also preserve attribution on allowed destinations. Do not remove those behaviors while cleaning analytics URLs, and do not send the lead/prefill object to PostHog. Browser analytics cannot inspect payment fields, order amount, or payment success inside the cross-origin Spiffy iframe.

## October cold and warm attribution (September 16, 2026)

Scope is October only. Existing landing and checkout URLs remain in use. Campaign classification is an exact allowlist, not a `warm-` prefix guess. All unmatched or missing campaigns are `unknown`.

Cold campaign values:

- `bp4-suppgrouppxr-091326`
- `bp4-static2connectyourincome-091326`
- `bp4-static1paycheck401kwhiteboard-091326`
- `bp4-static3keepmoreofwhatyouspenddecadesearning-091326`
- `bp4-giftshoppxr-091326`

Warm campaign values:

- `warm-bp4-giftshoppxr-09132` (supplied by media buyer)
- `warm-bp4-giftshoppxr-091326` (full-date alias independently observed in live traffic)
- `warm-bp4-static3keepmoreofwhatyouspenddecadesearning-091326`
- `warm-bp4-static1paycheck401kwhiteboard-091326`
- `warm-bp4-static2connectyourincome-091326`
- `warm-bp4-suppgrouppxr-091326`

`traffic_audience` describes the current tagged journey. `first_traffic_audience` and `last_traffic_audience` retain first and most recent tagged attribution. Current attribution uses `october_challenge_current_attribution_v1` in sessionStorage with a 30-minute inactivity expiry; activity refreshes at most once per minute. First/last attribution uses `october_challenge_attribution_v1` in localStorage, expiring 90 days after the last new tagged touch. A newly supplied unknown campaign clears current classification to `unknown`. Untagged navigation within an active journey retains its current UTMs. Sanitized UTM values preserve numeric ad IDs. These are campaign labels, not a claim that every visitor's actual relationship with the business is known.

The dashboard now has nine tiles. Three audience reports were verified: daily landing visitors by audience, an ordered landing-to-checkout funnel broken down by first-step audience (14-day conversion window), and exact-campaign historical landing/checkout reporting. Historical reports can use recorded UTMs, but do not invent missing audience events or paid conversions. Configuration evidence lives in `performance-reports/audience-tracking/posthog-reports.json`.

Two purchase reports are configured but pending receiver activation: [ordered landing → checkout → verified paid conversion](https://us.posthog.com/project/600066/insights/QKTphODw) requires `identity_linked=true` on the paid step, uses unique people and a 14-day window, and attributes audience to the first landing step. [Paid orders and linkage coverage](https://us.posthog.com/project/600066/insights/ILxmGtON) deduplicates `order_id` and separates linked/unlinked orders and revenue. Empty purchase results before activation are not evidence of no sales. Tracking begins at activation; there is no automatic historical backfill.

Separate saved replay views: [Cold](https://us.posthog.com/project/600066/replay/playlists/a4EFuOZl) and [Warm](https://us.posthog.com/project/600066/replay/playlists/vA53R0zd). They filter October events by exact campaign values and exclude test events. A person can appear in both after separate cold and warm visits.

### Segmented heatmaps

[Cold heatmap](https://us.posthog.com/project/600066/heatmaps/JJx9fRVE) and [Warm heatmap](https://us.posthog.com/project/600066/heatmaps/XxafWlyd) use the same `/october` page screenshot, with completed 390/1440 previews. No duplicate website page is needed.

Live testing found that event/cohort filters were ignored by this project's heatmap endpoint. The saved views therefore use `data_url` regular expressions matching the exact `utm_campaign` key and allowlisted values, including parameters before or after it. A nonmatching-control query returned zero; cold and warm returned distinct click datasets. Exact patterns and evidence are in `performance-reports/audience-tracking/heatmaps.json`. Do not replace this with an unverified property filter.

These heatmaps cover URL-tagged visits. Untagged returns whose audience exists only in browser storage are not included. The general heatmap remains available. Heatmap counts are interactions, not purchases or a conversion-rate denominator. Native test-account exclusion is enabled; arbitrary `is_test` event filtering was not proven effective for heatmaps.

### Hidden Reference ID field

On September 16, the existing `fbclid` / Reference ID field was hidden on both Spiffy checkouts at the user's request. Only scoped CSS was added: regular `.checkout #block-364953 { display: none !important; }`, VIP `.checkout #block-364954 { display: none !important; }`. The existing text CUSTOMER field and its `fbclid` mapping remain intact. Inputs `inputText-364953` and `inputText-364954` remain enabled and optional. Live hosted checkout verification confirmed exact synthetic `fbclid` prefill values, invisible wrappers, the PostHog fields still hidden, and unchanged $47/$147 totals. No form was submitted. This was published in Spiffy; no site code or checkout loading change was made for this visibility update.

### Checkout identity bridge and payment receiver

Both ticket embeds explicitly forward the five current UTMs and an anonymous `ph_distinct_id`. They wait up to 800 ms for analytics, then render anyway. SDK identity is read from the ready SDK or its existing localStorage entry; no email, phone, or lead object is used as identity. Spiffy script loading starts after DOMContentLoaded to avoid its body-not-ready error.

Spiffy account 3074 now has optional text ORDER field `PostHog Distinct ID`, URL key `ph_distinct_id`. It is published on regular checkout 40200 (`#block-367236`) and VIP checkout 40203 (`#block-367249`), with each field hidden by its unique wrapper. Existing `fbclid`, prefill, prices, and offers are retained. No purchase was submitted for verification.

The new Vercel receiver is `/api/spiffy-webhook`; Spiffy endpoint 210 subscribes to `order:success`. Authentication requires both a secret URL token and `spiffy-signature` HMAC-SHA256 over `${timestamp}.${rawBody}`, with a five-minute timestamp tolerance and account 3074. Environment secret names are `SPIFFY_WEBHOOK_VERIFY_TOKEN` and `SPIFFY_WEBHOOK_SIGNING_SECRET`. Never record their values in documentation. Real signed Spiffy `test` calls returned 200 without creating analytics events. Invalid signatures fail closed. Final production verification returned 200 for a signed non-ingesting test and 401 for an invalid signature. The receiver passed 19 focused tests, including nullable attribution, linked/unlinked orders, retry deduplication, ownership, and privacy.

**Purchase ingestion is pending a dedicated Spiffy API credential approval.** The production resolver code is deployed but dormant without `SPIFFY_API_KEY`. Spiffy endpoint 210 is currently **inactive** to prevent indefinite retries while approval is pending. After approval, store the dedicated key as a sensitive production environment variable, redeploy, verify a signed test, and reactivate endpoint 210. The receiver resolves canonical order fields, payments, checkout, and attribution; requires checkout account 3074 and IDs 40200/40203; sends only the earliest succeeded positive payment and allowlisted anonymous attribution; and uses a deterministic UUID for retries. Unlinked orders use a synthetic order identity and cannot complete a visitor funnel. The exact persisted custom-field metadata still needs verification on the next real order. First-time direct checkout visits whose SDK takes longer than 800 ms may remain unlinked because checkout renders without waiting further. It is not yet a complete purchase conversion system. Reconcile successful payments in Spiffy until activation and a real payment event are verified. Do not treat a confirmation-page view as payment.

Production release `dpl_CpeVeiFt5sMmE7EQjWNv4PPb16by` was Ready and aliased to `go.managemoney101.com`. Tracker version `2026-09-16.2` includes the anonymous identity fallback. Live PostHog QA confirmed cold visits followed by a warm return retained first=cold and last=warm; QA events had `is_test=true`. Both regular and VIP checkout hidden identity fields were confirmed populated and invisible on production. Local attribution checks cover campaign changes, expiry, storage failure, numeric UTMs, privacy, and checkout fail-open behavior.

## Hero button A/B test (September 18, 2026)

Feature flag [`hero-cta-variant`](https://us.posthog.com/project/600066/feature_flags/895912), multivariate, 100% rollout, `control` 50 / `picker` 50, client-side evaluation, bucketed by `distinct_id`.

- `control`: the hero "Grab Your Ticket Now" buttons and the sticky "Get Your Seat" button keep jumping to `#pricing`.
- `picker`: the hero button opens a two-ticket picker directly under itself (VIP $147 first, General Admission $47 second, "Not yet, keep reading" to close). The sticky button scrolls to the hero and opens the same picker. Picker links are real `/vipticketoct` and `/regularticketoct` links that use `trackTicketLeadAndGo`, so campaign parameter forwarding, the Meta Lead event, and `ticket_option_selected` work unchanged. Their `cta_location` is `hero_picker`; the hero section is `hero` and the bottom CTA section is `final_cta`.

Mechanics live in `assets/js/challenge-analytics.js` (`resolveHeroVariant`) and the inline hero script in `index.html`. The tracker evaluates the flag only on `landing_page` routes, after `loaded`, via `onFeatureFlags`. The page renders control until the flag resolves; the picker variant only changes click behavior, so there is no flicker. On resolution the tracker sets `window.__challengeAnalytics.heroVariant`, registers the super property `hero_cta_variant`, captures `hero_variant_shown`, and dispatches `challenge-hero-variant`. Unknown or missing flag values fall back to `control`. `$feature/hero-cta-variant` and `$feature_flag_called` are also recorded by the SDK.

Read the test with a funnel that starts at `hero_variant_shown` broken down by `variant` (first touch): `hero_variant_shown` → `ticket_option_selected` → `checkout_viewed` → `challenge_order_paid`, 14-day window, `funnel=october_2026_challenge`, `is_test != true`. Decide on paid orders per exposed visitor, not on clicks. Visitors whose flag request never completed are excluded from both arms because they have no exposure event. To end the test, set the winning variant to 100% in the flag (or remove the picker code and delete the flag); do not leave a 50/50 split running after a decision.

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
3. Run `node --check assets/js/challenge-analytics.js` or `node --check assets/js/webinar-analytics.js`, parse `vercel.json`, and run `git diff --check`. Use focused browser tests for the behavior changed.
4. Webinar QA uses `?analytics_test=1`; the flag persists in sessionStorage for that browser session. A fresh browser context is safest. Local-only testing can set `window.__LWB_ANALYTICS_TEST__=true` before the script; token override is `window.__LWB_POSTHOG_TOKEN__`. Prefer a mocked SDK/ingestion for local tests so synthetic events do not enter production. Mock `/api/register` responses; do not create fake Zapier leads.
5. October also supports `?analytics_test=1`, sticky in sessionStorage. Its local test flag is `window.__CHALLENGE_ANALYTICS_TEST__`; token override is `window.__CHALLENGE_POSTHOG_TOKEN__`. Dashboard filters exclude `is_test=true` while retaining historical events with a missing flag. Use mocked ingestion locally. Do not place real checkout orders for routine QA.
6. When deployment is authorized, use that repo's existing release process. Confirm the Vercel deployment is Ready and the production alias serves the intended tracker version and all changed pages. A local edit or pushed commit alone does not prove deployment. Webinar's verified Git deployment was commit `64921da`, Vercel project `lwb-tax-masterclass`, serving `join.managemoney101.com`.
7. In a real browser, inspect `window.__challengeAnalytics` or `window.__lwbWebinarAnalytics`, `posthog.get_property('funnel')`, SDK loading, and proxy request responses. Confirm heatmap/replay settings and masking. Check for redirect loops, HTTP 308 ingestion, duplicate snippets, or blocked SDK requests.
8. In PostHog, confirm fresh events from the expected host with the exact funnel label and correct path/campaign. For replay/heatmap changes, retrieve an actual recording or heatmap result. Preserve existing October and webinar dashboard tiles and their exact funnel/test filters. Do not interpret an empty date range as a broken installation without checking activity and ingestion.
9. Record what was actually checked, remaining limitations, and relevant deployment/version evidence in both copies of this guide. Stop task-created servers and browsers; preserve the user's existing processes. Keep `POSTHOG.md` and `AGENTS.md` excluded from the public static-site deployment.

September 16 production verification received webinar pageviews, form/CTA/engagement events, a non-test accepted registration, a playable QA recording, and heatmap click coordinates. All 13 dashboard tiles executed with their respective funnel filters. These are installation checks, not a campaign performance conclusion.

At the original guide audit, October's live tracker matched the local tracker byte-for-byte; its landing page, tracker, and proxied SDK returned HTTP 200, and the landing page included the tracker once. The local October checkout was at `50205d9` with unrelated working-tree changes, so future agents must inspect those before deploying. The subsequent September 16 audience rollout and its deployment are documented in the October section above.

## Analysis rules and references

For traffic reports, use an explicit date range/timezone and distinguish pageviews, sessions, people, form submissions, accepted registrations, and succeeded payments. Inspect event/property availability through PostHog's current tools before writing queries. Keep the funnel filter even when restricting by URL. Report missing attribution and tracking limits honestly; git update frequency cannot establish traffic or causality.

Official references: [dashboards](https://posthog.com/docs/product-analytics/dashboards), [funnels](https://posthog.com/docs/product-analytics/funnels), [heatmaps](https://posthog.com/docs/toolbar/heatmaps), [session replay privacy](https://posthog.com/docs/session-replay/privacy), and [replays from insights](https://posthog.com/tutorials/explore-insights-session-recordings). Use the connected PostHog plugin's current tools and documentation; recheck tool schemas rather than copying stale API commands from a previous chat.
