# Lead Capture Setup — October 2026 Challenge

The opt-in popup, the checkout prefill, and the evergreen timer are built and live in the pages. This document lists the last steps that need account access (Kit, Spiffy, Meta). Each step says where to paste what.

## What is already built

**Sales page (`index.html`)**

- Both ticket buttons ("Join the Challenge" and "Get VIP Access") open a popup with a Kit form styled to match the site: full name, email, phone.
- On submit the page validates the fields, saves the lead in the browser (`localStorage.lis_lead`), submits the Kit form in a hidden iframe, then redirects to the order page.
- The redirect keeps every tracking param already on the URL (UTMs, Hyros, fbclid) and adds `name_first`, `name_last`, `email`, `phone`, and Spiffy's phone prefill key `phone_number`.
- The redirect never waits more than 1.5 seconds for Kit. If Kit is slow or down, the buyer still reaches checkout.

**Order pages (`regularticket26.html`, `vipticket26.html`)**

- The Spiffy embed is created by a small script that appends the prefill params to the checkout URL. Spiffy reads `name_first`, `name_last`, and `email` by default and fills the contact block.
- If the params are missing (for example a buyer opened the order page from an email), the script falls back to the lead saved in `localStorage`.
- The checkout embed also passes `fbclid` into the Spiffy order field when the buyer arrived from a Meta ad click.
- The loading skeleton behind the checkout was removed.
- These two checkout landing pages fire the Meta `Lead` event because they are the first pages people land on after submitting the opt-in form.

**Timers (all three pages)**

- One shared function, `window.LIS_DEADLINE()`, returns the next midnight in America/New_York. Every countdown on the sales page and both order pages uses it. Inside the final 24 hours before Oct 16, 10 AM ET, it counts to the event start instead.

## Step 1 — Kit (ConvertKit)

1. The popup uses Kit form `9870586` (`https://app.kit.com/forms/9870586/subscriptions`) as the real form submission.
2. Turn off double opt-in on this form if buyers should enter the abandoned-cart automation immediately.
3. **Custom fields.** Kit → Subscribers → any subscriber → Add a new field. Confirm these keys exist: `last_name`, `phone`, `phone_number`, `ticket_type`, `source_url`. If a field does not exist, Kit drops that value silently.
4. **Tag.** Configure the Kit form or automation so every submission receives the tag `challenge-lead`.

## Step 2 — Spiffy

Both checkouts must accept the prefill params.

1. Open each checkout in Spiffy → Checkout Editor → hover the **Contact Info** block → Edit Block.
2. Expand **First Name**, **Last Name**, **Email**. The "Field URL Parameter" should be `name_first`, `name_last`, `email`. These are Spiffy defaults. Leave them.
3. Expand **Phone** and confirm its Field URL Parameter is `phone_number`. If the checkout has no phone field, add one in the contact block.
4. Checkouts to update:
   - `tax-free-income-challenge-oct-26` (General Admission)
   - `tax-fre-income-challenge-vip-oct-26` (VIP)

Reference: Spiffy University → "Populating Fields & Selecting Options via URL Parameters".

## Step 3 — Purchase tags back to Kit

The abandoned-cart automation needs to know who bought.

1. Spiffy → Integrations → connect Kit (ConvertKit).
2. On each product, add a purchase action that applies a tag:
   - General Admission → tag `challenge-buyer-ga`
   - VIP ticket → tag `challenge-buyer-vip`
   - $99 VIP upgrade → tag `challenge-buyer-vip`
3. If the Spiffy Kit integration cannot apply tags per product, use a Zapier zap: Spiffy "New Order" → filter by product → Kit "Add Tag to Subscriber".

## Step 4 — Abandoned-cart automation in Kit

Emails are written in `emails/abandoned-cart-sequence.md`.

Kit → Automate → Visual Automations → New:

1. **Trigger:** Tag added → `challenge-lead`.
2. **Wait** 1 hour.
3. **Condition:** Has tag `challenge-buyer-ga` OR `challenge-buyer-vip` → Yes branch ends. No branch continues.
4. **Email 1** (subject lines and body from the file).
5. **Wait** 23 hours → same **Condition** → **Email 2**.
6. **Wait** 48 hours → same **Condition** → **Email 3**.

Each email links to the order page with the prefill params using Kit liquid:

```
https://october-2026-challenge.vercel.app/regularticketoct?name_first={{ subscriber.first_name }}&email={{ subscriber.email_address }}
```

The `ticket_type` field holds `ticket` or `vip`. If you want VIP opt-ins to get the VIP link, use a Kit liquid condition on `{{ subscriber.ticket_type }}` inside the email, or duplicate the automation with a second trigger tag.

## Step 5 — GA-to-VIP upgrade emails

Emails are written in `emails/vip-upgrade-sequence.md`. Send as scheduled broadcasts on Oct 9, Oct 12, and Oct 15 to a segment:

- Has tag `challenge-buyer-ga`
- Does not have tag `challenge-buyer-vip`

## Step 6 — Setter list

Kit → Subscribers → Segments → New: has tag `challenge-lead`, does not have tag `challenge-buyer-ga`, does not have tag `challenge-buyer-vip`. Export CSV daily, or point the optional webhook at a Google Sheet.

## Step 7 — Meta pixel

The LWB Meta Pixel base code is installed on the active funnel pages with pixel ID `489941607383296`. The regular and VIP checkout landing pages fire `Lead` only because they are the first pages people land on after submitting the opt-in form; the rest of the funnel pages fire PageView only. No hard-coded InitiateCheckout or Purchase events fire from the pages right now. Add those later only if Meta should receive those specific events outside the Spiffy integration.

## Test checklist

1. Open `https://october-2026-challenge.vercel.app/october?utm_source=test`.
2. Click "Join the Challenge". Enter a name, a real test email, and a phone number. Submit.
3. The order page URL must contain `utm_source=test`, `fbclid` when present, `name_first`, `email`, `phone`, and `phone_number`.
4. The Spiffy form must show the name and email already filled (and phone once Step 2 is done).
5. In Kit, the test email must appear with tag `challenge-lead` and the custom fields filled.
6. Complete a $47 test order. The subscriber must receive tag `challenge-buyer-ga`, and the automation must skip the emails.
