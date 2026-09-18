'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const pageSource = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const handlerMatch = pageSource.match(
  /function trackTicketLeadAndGo\(ticketType, ev\) \{[\s\S]*?\n  \}\n\n  \/\/ Preserve campaign attribution/
);
const attributionMatch = pageSource.match(
  /\(function \(\) \{\n    var params = new URLSearchParams\(window\.location\.search\);[\s\S]*?\n  \}\)\(\);/
);

assert.ok(handlerMatch, 'ticket lead click handler is present in index.html');
assert.ok(attributionMatch, 'ticket link attribution decorator is present in index.html');
const handlerScript = handlerMatch[0].replace(/\n\n  \/\/ Preserve campaign attribution[\s\S]*$/, '');
const attributionScript = attributionMatch[0];

test('ticket clicks always leave navigation to the anchor', () => {
  const leadEvents = [];
  const scheduledNavigations = [];
  let prevented = 0;
  const context = {
    REDIRECT_URLS: { ticket: '/regularticketoct', vip: '/vipticketoct' },
    URLSearchParams,
    fbq(...args) { leadEvents.push(args); },
    location: { search: '', href: 'https://go.managemoney101.com/' },
    setTimeout(callback) { scheduledNavigations.push(callback); },
    ticketLeadNavigationInProgress: false
  };
  vm.runInNewContext(handlerScript, context, { filename: 'ticket-navigation.js' });

  const click = (ticketType, modifiers = {}) => context.trackTicketLeadAndGo(ticketType, {
    ...modifiers,
    preventDefault() { prevented += 1; }
  });

  const firstResult = click('vip');
  const restoredPageResult = click('ticket');
  const modifiedClickResult = click('vip', { metaKey: true });
  context.fbq = () => { throw new Error('pixel unavailable'); };
  const failedPixelResult = click('ticket');

  assert.deepEqual(
    { firstResult, restoredPageResult, modifiedClickResult, failedPixelResult, prevented, scheduled: scheduledNavigations.length },
    { firstResult: true, restoredPageResult: true, modifiedClickResult: true, failedPixelResult: true, prevented: 0, scheduled: 0 }
  );
  assert.deepEqual(JSON.parse(JSON.stringify(leadEvents)), [
    ['track', 'Lead', { content_name: 'VIP Ticket' }],
    ['track', 'Lead', { content_name: 'Regular Ticket' }],
    ['track', 'Lead', { content_name: 'VIP Ticket' }]
  ]);
});

test('ticket hrefs retain current campaign parameters for native navigation', () => {
  const hrefs = ['/regularticketoct', '/vipticketoct'];
  const links = hrefs.map((href) => ({
    href,
    getAttribute(name) { return name === 'href' ? this.href : null; },
    setAttribute(name, value) { if (name === 'href') this.href = value; }
  }));
  const selector = 'a[href="/regularticketoct"], a[href="/vipticketoct"]';
  const context = {
    URL,
    URLSearchParams,
    document: {
      querySelectorAll(value) {
        assert.equal(value, selector);
        return links;
      }
    },
    window: {
      location: {
        origin: 'https://go.managemoney101.com',
        search: '?utm_source=meta&utm_campaign=warm-test&fbclid=abc123'
      }
    }
  };

  vm.runInNewContext(attributionScript, context, { filename: 'ticket-attribution.js' });

  assert.deepEqual(links.map((link) => link.href), [
    '/regularticketoct?utm_source=meta&utm_campaign=warm-test&fbclid=abc123',
    '/vipticketoct?utm_source=meta&utm_campaign=warm-test&fbclid=abc123'
  ]);
});
