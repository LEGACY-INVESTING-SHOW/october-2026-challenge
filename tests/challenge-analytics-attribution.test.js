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
  const documentListeners = {};
  const scriptAnchor = { parentNode: { insertBefore(node) { insertedScripts.push(node); } } };
  const document = {
    title: 'October Challenge',
    body: { scrollHeight: 2000 },
    documentElement: { scrollHeight: 2000 },
    createElement() { return {}; },
    getElementsByTagName() { return [scriptAnchor]; },
    addEventListener(name, callback) { (documentListeners[name] ||= []).push(callback); },
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
    click(target) { for (const fn of documentListeners.click || []) fn({target}); },
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

const newColdCampaigns = [
  'tg-h4-ch-91626',
  'tg-h3-ch-91626',
  'topten-h1-ch-91626',
  'tg-h1-ch-91626',
  'tg-h2-ch-91626',
  'topten-h4-ch-91626',
  'topten-h3-ch-91626',
  'raise-h1-ch-91626',
  'tg-h5-ch-91626',
  'topten-h2-ch-91626',
  'raise-h4-ch-91626',
  'raise-h3-ch-91626',
  'topten-h5-ch-91626',
  'raise-h2-ch-91626',
  '401k-h3-ch-91626',
  'trashcan-h4-ch-91626',
  'sameret-h3-ch-91626',
  'trashcan-h5-ch-91626',
  'aprilmirror-h2-ch-91626',
  'aprilmirror-h4-ch-91626',
  '401k-h1-ch-91626',
  'sameret-h5-ch-91626',
  '401k-h4-ch-91626',
  'trashcan-h3-ch-91626',
  '401k-h5-ch-91626',
  'trashcan-h1-ch-91626',
  'sameret-h1-ch-91626',
  '401k-h2-ch-91626',
  'sameret-h4-ch-91626',
  'aprilmirror-h3-ch-91626',
  'aprilmirror-h5-ch-91626',
  'sameret-h2-ch-91626',
  'aprilmirror-h1-ch-91626',
  'trashcan-h2-ch-91626'
];

const newWarmCampaigns = [
  'warm-sameret-h5-ch-91626',
  'warm-aprilmirror-h1-ch-91626',
  'warm-tg-h1-ch-91626',
  'warm-401k-h1-ch-91626',
  'warm-trashcan-h1-ch-91626'
];

const audienceCampaigns = [
  ['bp4-suppgrouppxr-091326', 'cold'],
  ['bp4-static2connectyourincome-091326', 'cold'],
  ['bp4-static1paycheck401kwhiteboard-091326', 'cold'],
  ['bp4-static3keepmoreofwhatyouspenddecadesearning-091326', 'cold'],
  ['bp4-giftshoppxr-091326', 'cold'],
  ...newColdCampaigns.map((campaign) => [campaign, 'cold']),
  ['warm-bp4-giftshoppxr-09132', 'warm'],
  ['warm-bp4-giftshoppxr-091326', 'warm'],
  ['warm-bp4-static3keepmoreofwhatyouspenddecadesearning-091326', 'warm'],
  ['warm-bp4-static1paycheck401kwhiteboard-091326', 'warm'],
  ['warm-bp4-static2connectyourincome-091326', 'warm'],
  ['warm-bp4-suppgrouppxr-091326', 'warm'],
  ...newWarmCampaigns.map((campaign) => [campaign, 'warm'])
];

test('covers all 34 newly supplied cold campaigns', () => {
  assert.equal(newColdCampaigns.length, 34);
});

test('covers all five newly supplied warm campaigns', () => {
  assert.equal(newWarmCampaigns.length, 5);
});

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

test('requires an exact match for the expanded cold campaign allowlist', () => {
  const result = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=tg-h4-ch-91626-extra'
  });
  assert.equal(result.attribution.getAudience(), 'unknown');
});

test('requires an exact match for the expanded warm campaign allowlist', () => {
  const result = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=warm-sameret-h5-ch-91626-extra'
  });
  assert.equal(result.attribution.getAudience(), 'unknown');
});

test('reclassifies persisted current, first, and last touches after an allowlist expansion', () => {
  const now = 2_000_000_000_000;
  const campaign = 'tg-h4-ch-91626';
  const savedTouch = {
    utm_source: 'meta',
    utm_campaign: campaign,
    traffic_campaign: campaign,
    traffic_audience: 'unknown'
  };
  const localStorage = new MemoryStorage({
    october_challenge_attribution_v1: JSON.stringify({
      first: savedTouch,
      last: savedTouch,
      expires_at: now + 60_000
    })
  });
  const sessionStorage = new MemoryStorage({
    october_challenge_current_attribution_v1: JSON.stringify({
      touch: savedTouch,
      expires_at: now + 60_000
    })
  });

  const result = executeTracker({
    url: 'https://go.managemoney101.com/regularticketoct',
    localStorage,
    sessionStorage,
    now
  });

  assert.equal(result.attribution.getCampaign(), campaign);
  assert.equal(result.attribution.getAudience(), 'cold');
  assert.equal(result.attribution.getFirstTouch().traffic_audience, 'cold');
  assert.equal(result.attribution.getLastTouch().traffic_audience, 'cold');
});

test('reports the current analytics version on tracker state and events', () => {
  const result = executeTracker({
    url: 'https://go.managemoney101.com/october?utm_campaign=tg-h4-ch-91626'
  });
  assert.equal(result.analytics.version, '2026-09-20.1');
  assert.equal(
    result.config.before_send({event: '$pageview', properties: {}}).properties.analytics_version,
    '2026-09-20.1'
  );
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

function mockPostHog(flagValue) {
  const captured = [];
  const registered = [];
  let flagCallback = null;
  return {
    captured,
    registered,
    setFlag(value) { flagValue = value; },
    fire(context) { if (flagCallback) flagCallback([], {}, context); },
    capture(event, properties) { captured.push({event, properties}); },
    register(properties) { registered.push(properties); },
    onFeatureFlags(callback) { flagCallback = callback; },
    getFeatureFlag(key) { return key === 'hero-cta-variant' ? flagValue : undefined; }
  };
}

test('landing page resolves the hero button variant once and reports it', () => {
  const result = executeTracker({ url: 'https://go.managemoney101.com/october?utm_campaign=warm-bp4-suppgrouppxr-091326' });
  const ph = mockPostHog('picker');
  const events = [];
  result.window.dispatchEvent = (event) => events.push(event);
  result.config.loaded(ph);
  assert.equal(result.analytics.heroVariant, null);
  ph.fire();
  ph.fire();
  assert.equal(result.analytics.heroVariant, 'picker');
  const shown = ph.captured.filter((entry) => entry.event === 'hero_variant_shown');
  assert.equal(shown.length, 1);
  assert.equal(shown[0].properties.variant, 'picker');
  assert.equal(shown[0].properties.experiment, 'hero-cta-variant');
  assert.equal(shown[0].properties.funnel_step, 'landing_page');
  assert.equal(shown[0].properties.traffic_audience, 'warm');
  const variantRegistrations = ph.registered.filter((entry) => entry.hero_cta_variant);
  assert.equal(variantRegistrations.length, 1);
  assert.equal(variantRegistrations[0].hero_cta_variant, 'picker');
  assert.equal(events.filter((event) => event.type === 'challenge-hero-variant').length, 1);
});

test('unknown or missing flag values keep fallback behavior without experiment exposure', () => {
  for (const value of [undefined, false, 'something-else', 'toString', '__proto__']) {
    const result = executeTracker({ url: 'https://go.managemoney101.com/october' });
    const ph = mockPostHog(value);
    result.config.loaded(ph);
    ph.fire();
    assert.equal(result.analytics.heroVariant, null);
    assert.equal(ph.captured.filter((entry) => entry.event === 'hero_variant_shown').length, 0);
  }
});

test('checkout pages do not evaluate the hero button flag', () => {
  const result = executeTracker({ url: 'https://go.managemoney101.com/vipticketoct' });
  const ph = mockPostHog('picker');
  result.config.loaded(ph);
  ph.fire();
  assert.equal(result.analytics.heroVariant, null);
  assert.equal(ph.captured.filter((entry) => entry.event === 'hero_variant_shown').length, 0);
});

test('LT funnel routes use their own analytics offers', () => {
  const expected = {
    '/octoberlt': ['landing_page', 'challenge_lt'],
    '/regularticketlt': ['checkout', 'regular_ticket_lt'],
    '/vipticketlt': ['checkout', 'vip_ticket_lt'],
    '/vipupgradelt': ['upsell', 'vip_upgrade_lt']
  };
  Object.entries(expected).forEach(([route, [step, offer]]) => {
    const result = executeTracker({ url: 'https://go.managemoney101.com' + route });
    assert.equal(result.analytics.step, step);
    assert.equal(result.analytics.offer, offer);
  });
});

test('the shared confirmation page reports the challenge offer for both tickets', () => {
  for (const route of ['/octchallengeconfirmation', '/octchallengeconfirmationvip']) {
    const result = executeTracker({ url: 'https://go.managemoney101.com' + route });
    assert.equal(result.analytics.step, 'purchase_confirmation');
    assert.equal(result.analytics.offer, 'challenge');
    const ph = mockPostHog(undefined);
    result.config.loaded(ph);
    const viewed = ph.captured.filter((entry) => entry.event === 'purchase_confirmation_viewed');
    assert.equal(viewed.length, 1);
    assert.equal(viewed[0].properties.offer, 'challenge');
    assert.equal('ticket_type' in viewed[0].properties, false);
  }
});


test('failed flag requests produce no exposure and allow successful retry', () => {
  const result = executeTracker({});
  const ph = mockPostHog('picker');
  result.config.loaded(ph);
  ph.fire({ errorsLoading: true });
  assert.equal(result.analytics.heroVariant, null);
  assert.equal(ph.captured.filter(x => x.event === 'hero_variant_shown').length, 0);
  ph.fire({ errorsLoading: false });
  assert.equal(result.analytics.heroVariant, 'picker');
  assert.equal(ph.captured.filter(x => x.event === 'hero_variant_shown').length, 1);
});

test('a missing assignment can resolve later without an early fallback exposure', () => {
  const result = executeTracker({});
  const ph = mockPostHog(undefined);
  result.config.loaded(ph);
  ph.fire();
  ph.setFlag('control');
  ph.fire();
  assert.equal(result.analytics.heroVariant, 'control');
  assert.equal(ph.captured.filter(x => x.event === 'hero_variant_shown').length, 1);
});

test('CTA use before the SDK loads excludes the page from late assignment', () => {
  const result = executeTracker({});
  result.click({ closest() { return {}; } });
  const ph = mockPostHog('picker');
  result.config.loaded(ph);
  ph.fire();
  assert.equal(result.window.__challengeHeroInteractedBeforeVariant, true);
  assert.equal(result.analytics.heroVariant, null);
  assert.equal(ph.captured.filter(x => x.event === 'hero_variant_shown').length, 0);
});

test('inline early interaction marker excludes a delayed tracker assignment', () => {
  const result = executeTracker({});
  result.window.__challengeHeroInteractedBeforeVariant = true;
  const ph = mockPostHog('control');
  result.config.loaded(ph);
  ph.fire();
  assert.equal(result.analytics.heroVariant, null);
  assert.equal(ph.captured.filter(x => x.event === 'hero_variant_shown').length, 0);
});

test('unrelated early clicks do not exclude the visitor from assignment', () => {
  const result = executeTracker({});
  result.click({ closest() { return null; } });
  const ph = mockPostHog('picker');
  result.config.loaded(ph);
  ph.fire();
  assert.equal(result.analytics.heroVariant, 'picker');
});
