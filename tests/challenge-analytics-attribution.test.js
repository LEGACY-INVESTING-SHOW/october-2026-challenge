'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const trackerSource = fs.readFileSync(
  path.resolve(__dirname, '../assets/js/challenge-analytics.js'),
  'utf8'
);

class MemoryStorage {
  constructor(initial, shouldThrow) {
    this.values = new Map(Object.entries(initial || {}));
    this.shouldThrow = Boolean(shouldThrow);
  }

  getItem(key) {
    if (this.shouldThrow) throw new Error('storage disabled');
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    if (this.shouldThrow) throw new Error('storage disabled');
    this.values.set(key, String(value));
  }
}

function executeTracker(options) {
  const url = new URL(options.url || 'https://go.managemoney101.com/october');
  const DateImpl = typeof options.now === 'number'
    ? class extends Date { static now() { return options.now; } }
    : Date;
  const localStorage = options.localStorage || new MemoryStorage();
  const sessionStorage = options.sessionStorage || new MemoryStorage();
  const insertedScripts = [];
  const scriptAnchor = { parentNode: { insertBefore(node) { insertedScripts.push(node); } } };
  const document = {
    title: 'October Challenge',
    body: { scrollHeight: 2000 },
    documentElement: { scrollHeight: 2000 },
    createElement() { return {}; },
    getElementsByTagName() { return [scriptAnchor]; },
    addEventListener() {},
    querySelector() { return null; }
  };
  const window = {
    localStorage,
    sessionStorage,
    innerHeight: 800,
    scrollY: 0,
    addEventListener() {},
    dispatchEvent() {},
    requestAnimationFrame(callback) { callback(); },
    __CHALLENGE_ANALYTICS_TEST__: options.localTest === true,
    __CHALLENGE_POSTHOG_TOKEN__: options.tokenOverride
  };
  const context = {
    Array,
    CustomEvent: function CustomEvent(type) { this.type = type; },
    Date: DateImpl,
    JSON,
    Math,
    MutationObserver: function MutationObserver() {
      this.observe = function () {};
      this.disconnect = function () {};
    },
    Object,
    RegExp,
    String,
    URL,
    URLSearchParams,
    clearTimeout,
    console,
    document,
    location: {
      href: url.href,
      hostname: url.hostname,
      pathname: url.pathname,
      protocol: url.protocol,
      search: url.search
    },
    sessionStorage,
    setTimeout,
    window
  };
  window.document = document;
  window.location = context.location;
  vm.runInNewContext(trackerSource, context, { filename: 'challenge-analytics.js' });
  const init = window.posthog && window.posthog._i && window.posthog._i[0];
  return {
    analytics: window.__challengeAnalytics,
    attribution: window.__challengeAttribution,
    config: init && init[1],
    insertedScripts,
    localStorage,
    sessionStorage,
    token: init && init[0],
    window
  };
}

const audienceCampaigns = [
  ['bp4-suppgrouppxr-091326', 'cold'],
  ['bp4-static2connectyourincome-091326', 'cold'],
  ['bp4-static1paycheck401kwhiteboard-091326', 'cold'],
  ['bp4-static3keepmoreofwhatyouspenddecadesearning-091326', 'cold'],
  ['bp4-giftshoppxr-091326', 'cold'],
  ['warm-bp4-giftshoppxr-09132', 'warm'],
  ['warm-bp4-giftshoppxr-091326', 'warm'],
  ['warm-bp4-static3keepmoreofwhatyouspenddecadesearning-091326', 'warm'],
  ['warm-bp4-static1paycheck401kwhiteboard-091326', 'warm'],
  ['warm-bp4-static2connectyourincome-091326', 'warm'],
  ['warm-bp4-suppgrouppxr-091326', 'warm']
];

for (const [campaign, audience] of audienceCampaigns) {
  test(`maps ${campaign} to ${audience}`, () => {
    const result = executeTracker({
      url: `https://go.managemoney101.com/october?utm_source=meta&utm_campaign=${campaign}`
    });
    assert.equal(result.attribution.getAudience(), audience);
    assert.equal(result.attribution.getCampaign(), campaign);
    assert.deepEqual(
      { ...result.attribution.getUtmFields() },
      { utm_source: 'meta', utm_campaign: campaign }
    );
  });
}

test('does not infer warm from an unmapped warm-prefixed campaign', () => {
  const result = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=warm-new-unmapped-campaign'
  });
  assert.equal(result.attribution.getAudience(), 'unknown');
});

test('a new unknown tagged campaign replaces the current warm audience', () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=warm-bp4-suppgrouppxr-091326',
    localStorage,
    sessionStorage
  });
  const unknown = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=brand-new-campaign',
    localStorage,
    sessionStorage
  });
  assert.equal(unknown.attribution.getAudience(), 'unknown');
  assert.equal(unknown.attribution.getCampaign(), 'brand-new-campaign');
  assert.equal(unknown.attribution.getLastTouch().traffic_audience, 'unknown');
});

test('untagged checkout navigation retains the current session audience', () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  executeTracker({
    url: 'https://go.managemoney101.com/october?utm_source=meta&utm_campaign=bp4-giftshoppxr-091326',
    localStorage,
    sessionStorage
  });
  const checkout = executeTracker({
    url: 'https://go.managemoney101.com/regularticketoct',
    localStorage,
    sessionStorage
  });
  assert.equal(checkout.attribution.getAudience(), 'cold');
  assert.equal(checkout.attribution.getCampaign(), 'bp4-giftshoppxr-091326');
  assert.equal(checkout.attribution.getUtmFields().utm_source, 'meta');
});

test('current audience expires after 30 minutes of inactivity', () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const startedAt = 2_000_000_000_000;
  executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=bp4-giftshoppxr-091326',
    localStorage,
    sessionStorage,
    now: startedAt
  });
  const afterInactivity = executeTracker({
    url: 'https://go.managemoney101.com/regularticketoct',
    localStorage,
    sessionStorage,
    now: startedAt + (31 * 60 * 1000)
  });
  assert.equal(afterInactivity.attribution.getAudience(), 'unknown');
  assert.equal(afterInactivity.attribution.getCampaign(), '');
  assert.equal(afterInactivity.attribution.getFirstTouch().traffic_audience, 'cold');
  assert.equal(afterInactivity.attribution.getLastTouch().traffic_audience, 'cold');
});

test('keeps initial cold touch separate when a later visit is warm', () => {
  const localStorage = new MemoryStorage();
  const cold = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=bp4-giftshoppxr-091326',
    localStorage,
    sessionStorage: new MemoryStorage()
  });
  assert.equal(cold.attribution.getFirstTouch().traffic_audience, 'cold');

  const warm = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=warm-bp4-giftshoppxr-091326',
    localStorage,
    sessionStorage: new MemoryStorage()
  });
  assert.equal(warm.attribution.getAudience(), 'warm');
  assert.equal(warm.attribution.getFirstTouch().traffic_audience, 'cold');
  assert.equal(warm.attribution.getFirstTouch().traffic_campaign, 'bp4-giftshoppxr-091326');
  assert.equal(warm.attribution.getLastTouch().traffic_audience, 'warm');
  assert.equal(warm.attribution.getLastTouch().traffic_campaign, 'warm-bp4-giftshoppxr-091326');
});

test('storage failures do not stop attribution or SDK setup', () => {
  const result = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=bp4-suppgrouppxr-091326',
    localStorage: new MemoryStorage({}, true),
    sessionStorage: new MemoryStorage({}, true)
  });
  assert.equal(result.attribution.getAudience(), 'cold');
  assert.equal(result.config.api_host, '/tfc');
});

test('analytics_test is session scoped and marks every event as test', () => {
  const sessionStorage = new MemoryStorage();
  executeTracker({
    url: 'https://go.managemoney101.com/october?analytics_test=1',
    sessionStorage
  });
  const nextPage = executeTracker({
    url: 'https://go.managemoney101.com/regularticketoct',
    sessionStorage
  });
  assert.equal(nextPage.analytics.isTest, true);
  ['$pageview', '$autocapture', '$heatmap', '$web_vitals', '$snapshot'].forEach((eventName) => {
    assert.equal(
      nextPage.config.before_send({ event: eventName, properties: {} }).properties.is_test,
      true,
      eventName
    );
  });
});

test('local override enables marked test analytics and token override', () => {
  const result = executeTracker({
    url: 'http://localhost:4173/october?utm_campaign=bp4-suppgrouppxr-091326',
    localTest: true,
    tokenOverride: 'phc_local_test'
  });
  assert.equal(result.analytics.isTest, true);
  assert.equal(result.token, 'phc_local_test');
  assert.equal(result.attribution.getAudience(), 'cold');
});

test('preview hosts expose attribution but keep the SDK disabled', () => {
  const result = executeTracker({
    url: 'https://challenge-preview.vercel.app/october?utm_campaign=bp4-suppgrouppxr-091326'
  });
  assert.equal(result.attribution.getAudience(), 'cold');
  assert.equal(result.analytics.enabled, false);
  assert.equal(result.analytics.disabledReason, 'non_production_host');
  assert.equal(result.config, undefined);
});

test('before_send stamps attribution without modifying raw snapshot payload', () => {
  const result = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=bp4-suppgrouppxr-091326'
  });
  const rawSnapshot = [{ type: 2, data: { node: { id: 1, text: 'raw' } } }];
  const event = { event: '$snapshot', properties: { $snapshot_data: rawSnapshot } };
  const sent = result.config.before_send(event);
  assert.strictEqual(sent.properties.$snapshot_data, rawSnapshot);
  assert.equal(sent.properties.is_test, false);
  assert.equal(sent.properties.traffic_audience, 'cold');
  assert.equal(sent.properties.first_traffic_audience, 'cold');
  assert.equal(sent.properties.funnel, 'october_2026_challenge');
});

test('getter output redacts PII-like UTM text and remains synchronous', () => {
  const result = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=person%40example.com&utm_content=555-123-4567'
  });
  assert.equal(result.attribution.getCampaign(), '[redacted-email]');
  assert.equal(result.attribution.getUtmFields().utm_content, '[redacted-phone]');
  assert.equal(result.attribution.getAudience(), 'unknown');
});

test('anonymous checkout bridge reads only SDK identity before remote readiness', () => {
  const result = executeTracker({});
  const key='ph_'+result.token+'_posthog';
  result.localStorage.setItem(key,JSON.stringify({distinct_id:'019a1234-1234-7123-8123-123456789abc',email:'never-export@example.com'}));
  assert.equal(result.attribution.getAnonymousId(),'019a1234-1234-7123-8123-123456789abc');
  result.localStorage.setItem(key,JSON.stringify({distinct_id:'person@example.com'}));
  assert.equal(result.attribution.getAnonymousId(),null);
  result.localStorage.shouldThrow=true;
  assert.equal(result.attribution.getAnonymousId(),null);
});
