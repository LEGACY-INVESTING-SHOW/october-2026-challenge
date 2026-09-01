# Abandoned Cart Sequence

Reader: clicked a ticket button on the sales page, filled name, email and phone in the opt-in popup, never completed checkout. Tagged in Kit.

| Email | Send | Job |
|---|---|---|
| 1 | 1 hour after opt-in | Get them back to a prefilled checkout |
| 2 | 24 hours after opt-in | Give the one real reason to come |
| 3 | 72 hours after opt-in | Guarantee, then ask for a decision either way |

Link per branch. Use the order page the subscriber clicked:

- General Admission tag: `https://october-2026-challenge.vercel.app/regularticketoct?name_first={{ subscriber.first_name }}&email={{ subscriber.email_address }}`
- VIP tag: `https://october-2026-challenge.vercel.app/vipticketoct?name_first={{ subscriber.first_name }}&email={{ subscriber.email_address }}`

Both order pages read `name_first` and `email` from the URL and prefill the checkout. The GA link is written into the emails below. Swap the path to `/vipticketoct` for the VIP branch and change the two price mentions in Email 2 and Email 3 from $47 to $147.

---

## Email 1 (1 hour)

### Subject lines

1. Checkout stopped halfway
2. {{ subscriber.first_name }}, did the page break on you?
3. Your name is in, your seat is not

### Body

You put your name and email on the ticket page about an hour ago, and the checkout never finished.

That happens for all kinds of reasons. A card gets declined, a tab closes, someone walks into the room.

Only one thing matters out of all that. The form saved your details. The checkout saves your seat. Right now only the first one is done.

Here is the same checkout with your details already in it:

[Finish checking out](https://october-2026-challenge.vercel.app/regularticketoct?name_first={{ subscriber.first_name }}&email={{ subscriber.email_address }})

It takes about a minute.

If the page itself gave you trouble, email support@legacyinvestingshow.com and tell us what you saw. We will sort it out.

Preston

---

## Email 2 (24 hours)

### Subject lines

1. A form she filled out in 2019 costs her $1,237 a month
2. The leak we found before we got to the fun part
3. $14,840 a year, parked with the IRS

### Body

Lauren makes $125,000 a year. When we built her wealth plan, the first leak we found was her W-4.

She filled it out in 2019, at a different job, at a different salary. Nobody told her to look at it again.

So her withholding kept running on a life she no longer had. It was pulling **$1,237** a month more out of her paycheck than her actual tax bill needed, which is **$14,840 a year** sitting with the IRS until she filed.

Some of that comes back at tax time, so call it a loan she never agreed to make. It was still $1,237 a month she could not put against debt, savings, or a property while she waited on the refund.

Fixing it took one form and one afternoon.

That W-4 was one leak. Her plan found five more strategies she already qualified for and was not using, and the year-one value came out between $61,000 and $109,000 depending on how much of it she actually implements.

That is what the three days are for. You go through your own setup, session by session, and find where the money is already going before you try to make more of it.

The ticket is **$47**. Lauren's one bad form was costing her more than that every two days.

Your number will not be her number. It depends on your income, your filing status, and what you already have in place. But you cannot plug a leak you have never measured.

[Grab your seat](https://october-2026-challenge.vercel.app/regularticketoct?name_first={{ subscriber.first_name }}&email={{ subscriber.email_address }})

Preston

---

## Email 3 (72 hours)

### Subject lines

1. Say no if the answer is no
2. Seven days to change your mind
3. Last note from me on this

### Body

October 16 to 18, Friday through Sunday, 10 AM to 4 PM Eastern each day. Twelve sessions with me and my team. You spend those three days working through your own numbers, and you walk out with a written 12-month plan instead of a folder of ideas you meant to get to.

The ticket is **$47**.

If you sit through it and do not leave with total clarity on what to do next, email us within **7 days** and we refund you. That is the whole guarantee, and it means the most this can cost you is a weekend.

So the real question is the calendar.

If that weekend is already spoken for, this is an easy no, and I would rather you decided that now. **4,400 people** have been through this challenge, and the ones who got the most out of it blocked all three days the way they would block a work trip.

If the weekend is open, your checkout is still filled in:

[Take your seat](https://october-2026-challenge.vercel.app/regularticketoct?name_first={{ subscriber.first_name }}&email={{ subscriber.email_address }})

Either answer works. The only one that costs you anything is leaving it open.

Preston
