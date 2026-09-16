const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {Readable} = require('node:stream');
const test = require('node:test');

const handler = require('../api/spiffy-webhook.js');

const VALID_TOKEN = 'test-token-with-at-least-32-characters-long';
const SIGNING_SECRET = 'spiffy-test-signing-secret-never-log-this';
const SPIFFY_API_KEY = 'spiffy-server-key-never-log-this';
const POSTHOG_TOKEN = 'phc_test_project_token';
const ORIGINAL_FETCH = global.fetch;

function request({
  method = 'POST',
  token = VALID_TOKEN,
  body = '',
  headers = {},
  signature = 'valid',
  timestamp = Math.floor(Date.now() / 1000),
} = {}) {
  const rawBody = body === null ? Buffer.alloc(0) : Buffer.from(body);
  const requestHeaders = {...headers};
  if (signature === 'valid') {
    const digest = crypto.createHmac('sha256', SIGNING_SECRET)
      .update(Buffer.concat([Buffer.from(`${timestamp}.`), rawBody]))
      .digest('hex');
    requestHeaders['spiffy-signature'] = `t=${timestamp},v1=${digest}`;
  } else if (typeof signature === 'string') {
    requestHeaders['spiffy-signature'] = signature;
  }

  const req = Readable.from(body === null ? [] : [rawBody]);
  req.method = method;
  req.url = token === null ? '/api/spiffy-webhook' : `/api/spiffy-webhook?token=${encodeURIComponent(token)}`;
  req.headers = requestHeaders;
  return req;
}

function response() {
  let resolveFinished;
  const finished = new Promise((resolve) => { resolveFinished = resolve; });
  return {
    statusCode: 200,
    headers: {},
    body: '',
    finished,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value = '') {
      this.body += value;
      resolveFinished();
    },
  };
}

async function invoke(options) {
  const req = request(options);
  const res = response();
  await handler(req, res);
  await res.finished;
  return res;
}

test.beforeEach(() => {
  process.env.SPIFFY_WEBHOOK_VERIFY_TOKEN = VALID_TOKEN;
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'true';
  process.env.SPIFFY_WEBHOOK_SIGNING_SECRET = SIGNING_SECRET;
  process.env.SPIFFY_API_KEY = SPIFFY_API_KEY;
  process.env.POSTHOG_PROJECT_TOKEN = POSTHOG_TOKEN;
  global.fetch = ORIGINAL_FETCH;
});

test.afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
});

test.after(() => {
  delete process.env.SPIFFY_WEBHOOK_VERIFY_TOKEN;
  delete process.env.SPIFFY_WEBHOOK_DIAGNOSTIC;
  delete process.env.SPIFFY_WEBHOOK_SIGNING_SECRET;
  delete process.env.SPIFFY_API_KEY;
  delete process.env.POSTHOG_PROJECT_TOKEN;
});

function webhookPayload(orderId, flat = false) {
  return {
    account_id: 3074,
    type: 'order:success',
    data: flat ? {order_id: orderId} : {object: {id: orderId}},
  };
}

function validOrder(overrides = {}) {
  return {
    id: 12345,
    is_rollback: false,
    checkout: {id: 40200, account_id: 3074},
    fields: [{field_name: 'ph_distinct_id', value: '$device:0199aabb-1234-7abc-8def-0123456789ab'}],
    payments: [{
      id: 70001,
      status: 'succeeded',
      amount_paid: 9900,
      currency: 'usd',
      created_at: '2026-09-16T12:34:56.000Z',
    }],
    attribution: {
      status: 'computed',
      first: {utm_campaign: 'bp4-giftshoppxr-091326'},
      last: {
        utm_source: 'facebook',
        utm_medium: 'paid-social',
        utm_campaign: 'bp4-giftshoppxr-091326',
        utm_content: '120123456789012',
        utm_term: 'retirement',
      },
    },
    ...overrides,
  };
}

function installFetchMock({order = validOrder(), spiffyOk = true, posthogOk = true} = {}) {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({url: String(url), options});
    if (String(url).startsWith('https://api.spiffy.co/')) {
      return {
        ok: spiffyOk,
        status: spiffyOk ? 200 : 500,
        json: async () => ({data: order}),
      };
    }
    if (String(url) === 'https://us.i.posthog.com/i/v0/e/') {
      return {
        ok: posthogOk,
        status: posthogOk ? 200 : 500,
        json: async () => ({status: posthogOk ? 'Ok' : 'Error'}),
      };
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
  return calls;
}

test('rejects non-POST requests and advertises POST', async () => {
  const res = await invoke({method: 'GET', token: null});
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
});

test('fails closed when either receiver secret is not configured', async () => {
  delete process.env.SPIFFY_WEBHOOK_VERIFY_TOKEN;
  assert.equal((await invoke()).statusCode, 503);

  process.env.SPIFFY_WEBHOOK_VERIFY_TOKEN = 'too-short';
  assert.equal((await invoke()).statusCode, 503);

  process.env.SPIFFY_WEBHOOK_VERIFY_TOKEN = VALID_TOKEN;
  delete process.env.SPIFFY_WEBHOOK_SIGNING_SECRET;
  assert.equal((await invoke()).statusCode, 503);
});

test('rejects a missing, wrong, or duplicated query token before reading JSON', async () => {
  assert.equal((await invoke({token: null, body: '{'})).statusCode, 401);
  assert.equal((await invoke({token: 'wrong', body: '{'})).statusCode, 401);

  const req = request({body: '{}'});
  req.url += `&token=${encodeURIComponent(VALID_TOKEN)}`;
  const res = response();
  await handler(req, res);
  assert.equal(res.statusCode, 401);
});

test('returns 400 for malformed JSON without logging the body', async () => {
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => logs.push(args.join(' '));
  try {
    const res = await invoke({body: '{"email":"person@example.com"'});
    assert.equal(res.statusCode, 400);
    assert.deepEqual(logs, []);
  } finally {
    console.log = originalLog;
  }
});

test('returns 413 when content-length or streamed bytes exceed 64 KiB', async () => {
  const declared = await invoke({body: '{}', headers: {'content-length': String(64 * 1024 + 1)}});
  assert.equal(declared.statusCode, 413);

  const streamed = await invoke({body: 'x'.repeat(64 * 1024 + 1)});
  assert.equal(streamed.statusCode, 413);
});

test('diagnostic logging exposes structure without values and does not acknowledge a real event', async () => {
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => logs.push(args.join(' '));
  try {
    const payload = {
      account_id: 3074,
      type: 'order:success',
      event_type: 'order.completed',
      email: 'person@example.com',
      customer: {
        name: 'Private Person',
        custom_fields: [{name: 'ph_distinct_id', value: 'secret-distinct-id'}],
        nested: {one: {two: {three: {four: {five: {secret: 'too-deep'}}}}}},
      },
      'person@example.com': 'dynamic-key-is-also-private',
    };
    const res = await invoke({
      body: JSON.stringify(payload),
      headers: {'content-type': 'application/json', authorization: 'Bearer private-value'},
    });

    assert.equal(res.statusCode, 503);
    assert.equal(logs.length, 1);
    const diagnostic = JSON.parse(logs[0]);
    assert.equal(diagnostic.event_type, 'order.completed');
    assert.equal(diagnostic.has_custom_ph_distinct_id, true);
    assert.deepEqual(diagnostic.header_names, ['authorization', 'content-type', 'spiffy-signature']);
    assert.ok(diagnostic.json_key_paths.includes('customer.custom_fields[].name'));
    assert.ok(diagnostic.json_key_paths.includes('[redacted-key]'));
    assert.ok(!diagnostic.json_key_paths.some((path) => path.includes('secret')));

    const serializedLog = logs[0];
    for (const sensitiveValue of [
      'person@example.com',
      'Private Person',
      'secret-distinct-id',
      'Bearer private-value',
      VALID_TOKEN,
      SIGNING_SECRET,
      '/api/spiffy-webhook',
    ]) {
      assert.ok(!serializedLog.includes(sensitiveValue), `logged sensitive value: ${sensitiveValue}`);
    }
  } finally {
    console.log = originalLog;
  }
});

test('accepts a current t/v1 signature over timestamp dot raw body', async () => {
  const body = JSON.stringify({account_id: 3074, type: 'test', data: {object: {message: 'Private message'}}});
  const timestamp = Math.floor(Date.now() / 1000);
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => logs.push(args.join(' '));
  try {
    const res = await invoke({body, timestamp});
    assert.equal(res.statusCode, 200);
    const diagnostic = JSON.parse(logs[0]);
    assert.equal(diagnostic.event_type, 'test');
    assert.ok(!logs[0].includes(String(timestamp)));
    assert.ok(!logs[0].includes(SIGNING_SECRET));
    assert.ok(!logs[0].includes('Private message'));
  } finally {
    console.log = originalLog;
  }
});

test('rejects missing, malformed, invalid, and stale signatures before logging', async () => {
  const body = JSON.stringify({account_id: 3074, type: 'test'});
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => logs.push(args.join(' '));
  try {
    assert.equal((await invoke({body, signature: null})).statusCode, 401);
    assert.equal((await invoke({body, signature: 'sha256=not-accepted'})).statusCode, 401);
    assert.equal((await invoke({body, signature: `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}`})).statusCode, 401);
    assert.equal((await invoke({body, timestamp: Math.floor(Date.now() / 1000) - 301})).statusCode, 401);
    assert.deepEqual(logs, []);
  } finally {
    console.log = originalLog;
  }
});

test('rejects a signed payload from an account other than 3074 before logging', async () => {
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => logs.push(args.join(' '));
  try {
    const res = await invoke({body: JSON.stringify({account_id: 9999, type: 'test'})});
    assert.equal(res.statusCode, 403);
    assert.deepEqual(logs, []);
  } finally {
    console.log = originalLog;
  }
});

test('normal mode acknowledges signed tests but keeps signed orders retryable without logging', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => logs.push(args.join(' '));
  try {
    const testResponse = await invoke({body: JSON.stringify({account_id: 3074, type: 'test'})});
    assert.equal(testResponse.statusCode, 200);

    const orderResponse = await invoke({body: JSON.stringify({account_id: 3074, type: 'order:success'})});
    assert.equal(orderResponse.statusCode, 503);
    assert.deepEqual(logs, []);
  } finally {
    console.log = originalLog;
  }
});

test('resolves a signed order and sends one linked purchase using the earliest successful payment', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  const laterPayment = {
    id: 70002,
    status: 'succeeded',
    amount_paid: 24900,
    currency: 'usd',
    created_at: '2026-09-16T12:35:56.000Z',
  };
  const order = validOrder({payments: [laterPayment, validOrder().payments[0]]});
  const calls = installFetchMock({order});

  const res = await invoke({body: JSON.stringify(webhookPayload(order.id))});
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers.Authorization, `Bearer ${SPIFFY_API_KEY}`);
  assert.match(calls[0].url, /\/v2\/orders\/12345\?include=fields,payments,checkout,attribution,checkoutview$/);

  const event = JSON.parse(calls[1].options.body);
  assert.equal(event.api_key, POSTHOG_TOKEN);
  assert.equal(event.event, 'challenge_order_paid');
  assert.equal(event.distinct_id, '$device:0199aabb-1234-7abc-8def-0123456789ab');
  assert.equal(event.timestamp, '2026-09-16T12:34:56.000Z');
  assert.equal(event.uuid, event.properties.$insert_id);
  assert.equal(event.properties.amount_minor, 9900);
  assert.equal(event.properties.amount, 99);
  assert.equal(event.properties.currency, 'USD');
  assert.equal(event.properties.offer, 'regular_ticket');
  assert.equal(event.properties.identity_linked, true);
  assert.equal(event.properties.attribution_source, 'computed');
  assert.equal(event.properties.traffic_audience, 'cold');
  assert.equal(event.properties.first_utm_campaign, 'bp4-giftshoppxr-091326');
  assert.equal(event.properties.first_traffic_audience, 'cold');
  assert.equal(event.properties.utm_content, '120123456789012');
});

test('uses a stable unlinked order identity while preserving verified warm attribution', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  const order = validOrder({
    fields: [],
    checkout: {id: 40203, account_id: 3074},
    attribution: {
      status: 'computed',
      first: {utm_campaign: 'warm-bp4-giftshoppxr-09132'},
      last: {utm_campaign: 'warm-bp4-static1paycheck401kwhiteboard-091326'},
    },
  });
  const calls = installFetchMock({order});

  const res = await invoke({body: JSON.stringify(webhookPayload(order.id, true))});
  assert.equal(res.statusCode, 200);
  const event = JSON.parse(calls[1].options.body);
  assert.equal(event.distinct_id, 'spiffy-order-12345');
  assert.equal(event.properties.identity_linked, false);
  assert.equal(event.properties.offer, 'vip_ticket');
  assert.equal(event.properties.traffic_audience, 'warm');
  assert.equal(event.properties.utm_campaign, 'warm-bp4-static1paycheck401kwhiteboard-091326');
});

test('accepts computed direct attribution with null touches as a legitimate unknown audience', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  assert.deepEqual(handler._test.attributionProperties({first: null, last: null}), {
    traffic_campaign: '',
    traffic_audience: 'unknown',
  });
  assert.deepEqual(handler._test.attributionProperties({
    first: null,
    last: {utm_campaign: 'bp4-giftshoppxr-091326'},
  }), {
    utm_campaign: 'bp4-giftshoppxr-091326',
    traffic_campaign: 'bp4-giftshoppxr-091326',
    traffic_audience: 'cold',
  });

  const order = validOrder({
    attribution: {status: 'computed', first: null, last: null},
    checkoutview: {utm_campaign: 'warm-bp4-suppgrouppxr-091326'},
  });
  const calls = installFetchMock({order});
  const res = await invoke({body: JSON.stringify(webhookPayload(order.id))});
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 2);
  const event = JSON.parse(calls[1].options.body);
  assert.equal(event.properties.attribution_source, 'computed');
  assert.equal(event.properties.traffic_audience, 'unknown');
});

test('uses tagged checkout-view attribution while canonical attribution is still pending', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  const cases = [
    {
      campaign: 'warm-bp4-suppgrouppxr-091326',
      expectedAudience: 'warm',
      status: 'pending',
    },
    {
      campaign: 'bp4-giftshoppxr-091326',
      expectedAudience: 'cold',
      status: 'processing',
    },
  ];

  for (const {campaign, expectedAudience, status} of cases) {
    const order = validOrder({
      attribution: {status, first: null, last: null},
      checkoutview: {
        utm_source: 'facebook',
        utm_medium: 'paid-social',
        utm_campaign: campaign,
        utm_content: '120123456789012',
        utm_term: 'retirement',
      },
    });
    const calls = installFetchMock({order});
    const res = await invoke({body: JSON.stringify(webhookPayload(order.id))});

    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 2);
    const event = JSON.parse(calls[1].options.body);
    assert.equal(event.properties.attribution_source, 'checkoutview');
    assert.equal(event.properties.utm_campaign, campaign);
    assert.equal(event.properties.traffic_audience, expectedAudience);
    assert.equal(event.properties.utm_source, 'facebook');
    assert.equal(event.properties.utm_content, '120123456789012');
    assert.equal(Object.hasOwn(event.properties, 'first_utm_campaign'), false);
  }
});

test('keeps delivery retryable when neither computed attribution nor a tagged checkout view is available', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';

  for (const {attribution, checkoutview} of [
    {attribution: {status: 'pending', first: null, last: null}, checkoutview: {}},
    {
      attribution: {status: 'processing', first: null, last: null},
      checkoutview: {utm_source: 'facebook'},
    },
    {attribution: {first: null, last: null}, checkoutview: null},
    {attribution: null, checkoutview: null},
  ]) {
    const order = validOrder({attribution, checkoutview});
    const calls = installFetchMock({order});
    const res = await invoke({body: JSON.stringify(webhookPayload(order.id))});

    assert.equal(res.statusCode, 503);
    assert.deepEqual(JSON.parse(res.body), {error: 'Order is not ready'});
    assert.equal(calls.length, 1);
  }
});

test('retries use the same event uuid and insert id for PostHog deduplication', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  const order = validOrder();
  const calls = installFetchMock({order});
  const body = JSON.stringify(webhookPayload(order.id));

  assert.equal((await invoke({body})).statusCode, 200);
  assert.equal((await invoke({body})).statusCode, 200);
  const captures = calls.filter((call) => call.url === 'https://us.i.posthog.com/i/v0/e/')
    .map((call) => JSON.parse(call.options.body));
  assert.equal(captures.length, 2);
  assert.equal(captures[0].uuid, captures[1].uuid);
  assert.equal(captures[0].properties.$insert_id, captures[1].properties.$insert_id);
  assert.match(captures[0].uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('acknowledges an unrelated checkout without sending a PostHog event', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  const order = validOrder({checkout: {id: 99999, account_id: 3074}});
  const calls = installFetchMock({order});

  const res = await invoke({body: JSON.stringify(webhookPayload(order.id))});
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).ignored, true);
  assert.equal(calls.length, 1);
});

test('keeps mismatched checkout or optional order account ownership retryable', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  let calls = installFetchMock({order: validOrder({checkout: {id: 40200, account_id: 9999}})});
  assert.equal((await invoke({body: JSON.stringify(webhookPayload(12345))})).statusCode, 503);
  assert.equal(calls.length, 1);

  calls = installFetchMock({order: validOrder({account_id: 9999})});
  assert.equal((await invoke({body: JSON.stringify(webhookPayload(12345))})).statusCode, 503);
  assert.equal(calls.length, 1);
});

test('keeps an order retryable when no successful positive payment is available', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  const order = validOrder({
    payments: [{
      id: 70001,
      status: 'failed',
      amount_paid: 9900,
      currency: 'usd',
      created_at: '2026-09-16T12:34:56.000Z',
    }],
  });
  const calls = installFetchMock({order});

  const res = await invoke({body: JSON.stringify(webhookPayload(order.id))});
  assert.equal(res.statusCode, 503);
  assert.equal(calls.length, 1);
});

test('keeps delivery retryable when Spiffy lookup or PostHog ingestion fails', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  let calls = installFetchMock({spiffyOk: false});
  assert.equal((await invoke({body: JSON.stringify(webhookPayload(12345))})).statusCode, 503);
  assert.equal(calls.length, 1);

  calls = installFetchMock({posthogOk: false});
  assert.equal((await invoke({body: JSON.stringify(webhookPayload(12345))})).statusCode, 503);
  assert.equal(calls.length, 2);
});

test('does not send customer, contact, field, or raw URL data to PostHog', async () => {
  process.env.SPIFFY_WEBHOOK_DIAGNOSTIC = 'false';
  const privateValues = [
    'buyer@example.com',
    '+1 (212) 555-7890',
    'Private Buyer',
    'https://checkout.example/private?email=buyer@example.com',
    'secret-field-value',
  ];
  const order = validOrder({
    customer: {email: privateValues[0], phone: privateValues[1], name: privateValues[2]},
    checkout_url: privateValues[3],
    fields: [
      validOrder().fields[0],
      {field_name: 'contact_notes', value: privateValues[4]},
    ],
    attribution: {
      status: 'computed',
      first: {utm_campaign: 'bp4-giftshoppxr-091326'},
      last: {utm_campaign: 'bp4-giftshoppxr-091326', utm_term: privateValues[0]},
    },
  });
  const calls = installFetchMock({order});

  const res = await invoke({body: JSON.stringify(webhookPayload(order.id))});
  assert.equal(res.statusCode, 200);
  const captureBody = calls[1].options.body;
  for (const value of privateValues) assert.ok(!captureBody.includes(value), `sent private value: ${value}`);
  assert.ok(captureBody.includes('[redacted-email]'));
});
