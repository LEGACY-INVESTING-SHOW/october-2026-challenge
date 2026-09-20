'use strict';

const crypto = require('node:crypto');

const MAX_BODY_BYTES = 64 * 1024;
const MAX_KEY_DEPTH = 6;
const MAX_SIGNATURE_AGE_SECONDS = 5 * 60;
const SPIFFY_ACCOUNT_ID = '3074';
const TOKEN_QUERY_PARAM = 'token';
const REQUEST_TIMEOUT_MS = 10 * 1000;
const POSTHOG_CAPTURE_URL = 'https://us.i.posthog.com/i/v0/e/';
const POSTHOG_PUBLIC_TOKEN = 'phc_rQffz3NncDqfmLpKUcrDvThjyT3brt4QRSxcPUT2pFsw';
const EVENT_NAME = 'challenge_order_paid';
const UUID_NAMESPACE = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex');
const CHECKOUT_OFFERS = {
  40200: 'regular_ticket',
  40203: 'vip_ticket',
  40584: 'regular_ticket_lt',
  40585: 'vip_ticket_lt',
};
const AUDIENCE_CAMPAIGNS = {
  'bp4-suppgrouppxr-091326': 'cold',
  'bp4-static2connectyourincome-091326': 'cold',
  'bp4-static1paycheck401kwhiteboard-091326': 'cold',
  'bp4-static3keepmoreofwhatyouspenddecadesearning-091326': 'cold',
  'bp4-giftshoppxr-091326': 'cold',
  'tg-h4-ch-91626': 'cold',
  'tg-h3-ch-91626': 'cold',
  'topten-h1-ch-91626': 'cold',
  'tg-h1-ch-91626': 'cold',
  'tg-h2-ch-91626': 'cold',
  'topten-h4-ch-91626': 'cold',
  'topten-h3-ch-91626': 'cold',
  'raise-h1-ch-91626': 'cold',
  'tg-h5-ch-91626': 'cold',
  'topten-h2-ch-91626': 'cold',
  'raise-h4-ch-91626': 'cold',
  'raise-h3-ch-91626': 'cold',
  'topten-h5-ch-91626': 'cold',
  'raise-h2-ch-91626': 'cold',
  '401k-h3-ch-91626': 'cold',
  'trashcan-h4-ch-91626': 'cold',
  'sameret-h3-ch-91626': 'cold',
  'trashcan-h5-ch-91626': 'cold',
  'aprilmirror-h2-ch-91626': 'cold',
  'aprilmirror-h4-ch-91626': 'cold',
  '401k-h1-ch-91626': 'cold',
  'sameret-h5-ch-91626': 'cold',
  '401k-h4-ch-91626': 'cold',
  'trashcan-h3-ch-91626': 'cold',
  '401k-h5-ch-91626': 'cold',
  'trashcan-h1-ch-91626': 'cold',
  'sameret-h1-ch-91626': 'cold',
  '401k-h2-ch-91626': 'cold',
  'sameret-h4-ch-91626': 'cold',
  'aprilmirror-h3-ch-91626': 'cold',
  'aprilmirror-h5-ch-91626': 'cold',
  'sameret-h2-ch-91626': 'cold',
  'aprilmirror-h1-ch-91626': 'cold',
  'trashcan-h2-ch-91626': 'cold',
  'warm-bp4-giftshoppxr-09132': 'warm',
  'warm-bp4-giftshoppxr-091326': 'warm',
  'warm-bp4-static3keepmoreofwhatyouspenddecadesearning-091326': 'warm',
  'warm-bp4-static1paycheck401kwhiteboard-091326': 'warm',
  'warm-bp4-static2connectyourincome-091326': 'warm',
  'warm-bp4-suppgrouppxr-091326': 'warm',
  'warm-sameret-h5-ch-91626': 'warm',
  'warm-aprilmirror-h1-ch-91626': 'warm',
  'warm-tg-h1-ch-91626': 'warm',
  'warm-401k-h1-ch-91626': 'warm',
  'warm-trashcan-h1-ch-91626': 'warm',
};

class RequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function sendJson(res, statusCode, body, extraHeaders) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (extraHeaders) {
    for (const [name, value] of Object.entries(extraHeaders)) {
      res.setHeader(name, value);
    }
  }
  res.end(JSON.stringify(body));
}

function configuredToken() {
  const token = process.env.SPIFFY_WEBHOOK_VERIFY_TOKEN;
  return typeof token === 'string' && token.length >= 32 ? token : null;
}

function requestToken(req) {
  try {
    const params = new URL(req.url || '/', 'https://webhook.invalid').searchParams;
    const values = params.getAll(TOKEN_QUERY_PARAM);
    return values.length === 1 ? values[0] : null;
  } catch (_error) {
    return null;
  }
}

function timingSafeTokenMatch(expected, supplied) {
  if (typeof expected !== 'string' || typeof supplied !== 'string') return false;
  const expectedDigest = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const suppliedDigest = crypto.createHash('sha256').update(supplied, 'utf8').digest();
  return crypto.timingSafeEqual(expectedDigest, suppliedDigest);
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const declaredLength = Number(req.headers && req.headers['content-length']);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      reject(new RequestError(413, 'Request body too large'));
      return;
    }

    let settled = false;
    let size = 0;
    const chunks = [];

    function finish(error, body) {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(body);
    }

    req.on('data', (chunk) => {
      if (settled) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_BODY_BYTES) {
        finish(new RequestError(413, 'Request body too large'));
        if (typeof req.resume === 'function') req.resume();
        return;
      }
      chunks.push(buffer);
    });
    req.on('end', () => finish(null, Buffer.concat(chunks, size)));
    req.on('aborted', () => finish(new RequestError(400, 'Request aborted')));
    req.on('error', () => finish(new RequestError(400, 'Unable to read request')));
  });
}

function safeName(name, fallback) {
  return /^[A-Za-z_][A-Za-z0-9_.-]{0,63}$/.test(name) ? name : fallback;
}

function collectJsonKeyPaths(value) {
  const paths = new Set();

  function visit(node, prefix, depth) {
    if (depth >= MAX_KEY_DEPTH || node === null || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      const arrayPrefix = `${prefix}[]`;
      if (arrayPrefix) paths.add(arrayPrefix);
      for (const item of node) visit(item, arrayPrefix, depth + 1);
      return;
    }

    for (const rawKey of Object.keys(node)) {
      const key = safeName(rawKey, '[redacted-key]');
      const path = prefix ? `${prefix}.${key}` : key;
      paths.add(path);
      visit(node[rawKey], path, depth + 1);
    }
  }

  visit(value, '', 0);
  return Array.from(paths).sort();
}

function safeEventType(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const candidates = [
    payload.event_type,
    payload.eventType,
    payload.event_name,
    payload.eventName,
    payload.event,
    payload.type,
    payload.data && payload.data.event_type,
    payload.data && payload.data.event,
    payload.data && payload.data.type,
  ];
  const eventType = candidates.find((value) => typeof value === 'string');
  return eventType && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/.test(eventType)
    ? eventType
    : null;
}

function hasCustomPhDistinctId(payload) {
  let found = false;

  function nonEmpty(value) {
    return value !== null && value !== undefined && value !== '';
  }

  function visit(node, depth) {
    if (found || depth > MAX_KEY_DEPTH || node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(node, 'ph_distinct_id') && nonEmpty(node.ph_distinct_id)) {
      found = true;
      return;
    }

    const fieldName = node.name || node.key || node.slug || node.code;
    if (fieldName === 'ph_distinct_id' && (nonEmpty(node.value) || nonEmpty(node.field_value))) {
      found = true;
      return;
    }

    for (const key of Object.keys(node)) visit(node[key], depth + 1);
  }

  visit(payload, 0);
  return found;
}

function headerNames(headers) {
  return Array.from(new Set(Object.keys(headers || {}).map((name) =>
    safeName(name.toLowerCase(), '[redacted-header-name]')
  ))).sort();
}

function verifySpiffySignature(headers, rawBody, secret, nowMs = Date.now()) {
  const header = headers && headers['spiffy-signature'];
  if (typeof header !== 'string' || typeof secret !== 'string' || !secret) return false;

  const parts = header.split(',').map((part) => part.trim());
  if (parts.length !== 2) return false;

  const tokens = Object.create(null);
  for (const part of parts) {
    const match = part.match(/^([a-z0-9]+)=([^,]+)$/i);
    if (!match) return false;
    const name = match[1].toLowerCase();
    if ((name !== 't' && name !== 'v1') || tokens[name] !== undefined) return false;
    tokens[name] = match[2].trim();
  }

  if (!/^\d{1,12}$/.test(tokens.t || '') || !/^[A-Fa-f0-9]{64}$/.test(tokens.v1 || '')) {
    return false;
  }

  const timestamp = Number(tokens.t);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > MAX_SIGNATURE_AGE_SECONDS) {
    return false;
  }

  const signedBody = Buffer.concat([Buffer.from(`${tokens.t}.`, 'utf8'), rawBody]);
  const expected = crypto.createHmac('sha256', secret).update(signedBody).digest();
  const supplied = Buffer.from(tokens.v1, 'hex');
  return crypto.timingSafeEqual(expected, supplied);
}

function positiveInteger(value) {
  if (typeof value === 'string' && /^\d+$/.test(value)) value = Number(value);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function webhookOrderId(payload) {
  const objectId = positiveInteger(payload && payload.data && payload.data.object && payload.data.object.id);
  const flatId = positiveInteger(payload && payload.data && payload.data.order_id);
  if (objectId && flatId && objectId !== flatId) return null;
  return objectId || flatId;
}

function deterministicEventUuid(orderId) {
  const name = Buffer.from(`spiffy:${SPIFFY_ACCOUNT_ID}:order:${orderId}:${EVENT_NAME}`, 'utf8');
  const bytes = crypto.createHash('sha1').update(UUID_NAMESPACE).update(name).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function redactTag(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240);
  if (!text) return null;
  if (/^\d+$/.test(text)) return text;
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, '[redacted-phone]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[redacted-number]');
}

function campaignAudience(campaign) {
  return AUDIENCE_CAMPAIGNS[String(campaign || '').toLowerCase()] || 'unknown';
}

function isAttributionComputed(attribution) {
  return Boolean(
    attribution &&
    typeof attribution === 'object' &&
    !Array.isArray(attribution) &&
    typeof attribution.status === 'string' &&
    attribution.status.trim().toLowerCase() === 'computed'
  );
}

function attributionProperties(attribution) {
  const output = {};
  const last = attribution && attribution.last && typeof attribution.last === 'object' &&
    !Array.isArray(attribution.last) ? attribution.last : {};
  for (const name of ['source', 'medium', 'campaign', 'content', 'term']) {
    const key = `utm_${name}`;
    const value = redactTag(last[key]);
    if (value !== null) output[key] = value;
  }
  output.traffic_campaign = output.utm_campaign || '';
  output.traffic_audience = campaignAudience(output.traffic_campaign);

  const first = attribution && attribution.first && typeof attribution.first === 'object' &&
    !Array.isArray(attribution.first) ? attribution.first : {};
  const firstCampaign = redactTag(first.utm_campaign);
  if (firstCampaign !== null) {
    output.first_utm_campaign = firstCampaign;
    output.first_traffic_campaign = firstCampaign;
    output.first_traffic_audience = campaignAudience(firstCampaign);
  }
  return output;
}

function resolvePurchaseAttribution(order) {
  if (isAttributionComputed(order.attribution)) {
    return {attribution: order.attribution, source: 'computed'};
  }

  const checkoutview = order.checkoutview;
  if (!checkoutview || typeof checkoutview !== 'object' || Array.isArray(checkoutview) ||
      redactTag(checkoutview.utm_campaign) === null) {
    return null;
  }

  const last = {};
  for (const name of ['source', 'medium', 'campaign', 'content', 'term']) {
    const key = `utm_${name}`;
    last[key] = checkoutview[key];
  }
  return {attribution: {first: null, last}, source: 'checkoutview'};
}

function linkedDistinctId(fields) {
  if (!Array.isArray(fields)) return null;
  const uuidPattern = /^(?:\$device:)?[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue;
    if (field.field_name !== 'ph_distinct_id' && field.field_id !== 'ph_distinct_id') continue;
    if (typeof field.value === 'string' && uuidPattern.test(field.value)) return field.value;
  }
  return null;
}

function isExplicitTestOrder(order) {
  return order.is_test === true || order.test === true || order.is_sandbox === true ||
    order.sandbox === true || order.test_mode === true || order.livemode === false ||
    order.mode === 'test' || order.environment === 'sandbox';
}

function safePaymentId(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value)) return value;
  return null;
}

function firstSuccessfulPayment(payments) {
  if (!Array.isArray(payments)) return null;
  return payments
    .map((payment) => {
      if (!payment || typeof payment !== 'object' || String(payment.status).toLowerCase() !== 'succeeded') {
        return null;
      }
      const amount = positiveInteger(payment.amount_paid);
      const paymentId = safePaymentId(payment.id);
      const createdMs = Date.parse(payment.created_at);
      const currency = typeof payment.currency === 'string' && /^[A-Za-z]{3}$/.test(payment.currency)
        ? payment.currency.toUpperCase()
        : null;
      if (!amount || paymentId === null || !Number.isFinite(createdMs) || !currency) return null;
      return {
        amount_minor: amount,
        created_at: new Date(createdMs).toISOString(),
        created_ms: createdMs,
        currency,
        id: paymentId,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.created_ms - right.created_ms)[0] || null;
}

function timeoutFetch(url, options, fetchImpl = global.fetch) {
  if (typeof fetchImpl !== 'function') return Promise.reject(new Error('Fetch unavailable'));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetchImpl(url, {...options, signal: controller.signal})
    .finally(() => clearTimeout(timeout));
}

async function fetchSpiffyOrder(orderId, apiKey, fetchImpl = global.fetch) {
  const response = await timeoutFetch(
    `https://api.spiffy.co/v2/orders/${orderId}?include=fields,payments,checkout,attribution,checkoutview`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      redirect: 'error',
    },
    fetchImpl
  );
  if (!response.ok) throw new Error('Spiffy order lookup failed');
  const payload = await response.json();
  const order = payload && payload.data && typeof payload.data === 'object' ? payload.data : payload;
  if (!order || typeof order !== 'object' || Array.isArray(order)) throw new Error('Invalid Spiffy order');
  return order;
}

function buildPurchaseEvent(order, expectedOrderId, posthogToken) {
  const orderId = positiveInteger(order.id);
  if (!orderId || orderId !== expectedOrderId) {
    return {kind: 'retry'};
  }
  if (isExplicitTestOrder(order) || order.is_rollback === true) return {kind: 'ignored'};
  if (order.is_rollback !== false) return {kind: 'retry'};

  const checkoutId = positiveInteger(order.checkout && order.checkout.id);
  const checkoutAccountId = order.checkout && order.checkout.account_id;
  const hasOrderAccountId = Object.prototype.hasOwnProperty.call(order, 'account_id');
  if (String(checkoutAccountId) !== SPIFFY_ACCOUNT_ID ||
      (hasOrderAccountId && String(order.account_id) !== SPIFFY_ACCOUNT_ID)) {
    return {kind: 'retry'};
  }
  const offer = CHECKOUT_OFFERS[checkoutId];
  if (!offer) return {kind: 'ignored'};

  const payment = firstSuccessfulPayment(order.payments);
  if (!payment) return {kind: 'retry'};
  const resolvedAttribution = resolvePurchaseAttribution(order);
  if (!resolvedAttribution) return {kind: 'retry'};

  const linkedId = linkedDistinctId(order.fields);
  const distinctId = linkedId || `spiffy-order-${orderId}`;
  const uuid = deterministicEventUuid(orderId);
  const properties = {
    $insert_id: uuid,
    $process_person_profile: false,
    amount: payment.amount_minor / 100,
    amount_minor: payment.amount_minor,
    currency: payment.currency,
    funnel: 'october_2026_challenge',
    identity_linked: Boolean(linkedId),
    is_test: false,
    offer,
    order_id: orderId,
    payment_id: payment.id,
    payment_status: 'succeeded',
    attribution_source: resolvedAttribution.source,
    tracking_source: 'spiffy_webhook',
    ...attributionProperties(resolvedAttribution.attribution),
  };
  return {
    kind: 'event',
    payload: {
      api_key: posthogToken,
      distinct_id: distinctId,
      event: EVENT_NAME,
      properties,
      timestamp: payment.created_at,
      uuid,
    },
  };
}

async function capturePosthogEvent(payload, fetchImpl = global.fetch) {
  const response = await timeoutFetch(POSTHOG_CAPTURE_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
    redirect: 'error',
  }, fetchImpl);
  if (!response.ok) throw new Error('PostHog capture failed');
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, {error: 'Method not allowed'}, {Allow: 'POST'});
    return;
  }

  const expectedToken = configuredToken();
  if (!expectedToken) {
    sendJson(res, 503, {error: 'Webhook receiver is not configured'});
    return;
  }

  const suppliedToken = requestToken(req);
  if (!timingSafeTokenMatch(expectedToken, suppliedToken)) {
    sendJson(res, 401, {error: 'Unauthorized'});
    return;
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    const statusCode = error && error.statusCode === 413 ? 413 : 400;
    sendJson(res, statusCode, {error: error.message || 'Invalid request'});
    return;
  }

  const signingSecret = process.env.SPIFFY_WEBHOOK_SIGNING_SECRET;
  if (typeof signingSecret !== 'string' || !signingSecret) {
    sendJson(res, 503, {error: 'Webhook receiver is not configured'});
    return;
  }
  if (!verifySpiffySignature(req.headers, rawBody, signingSecret)) {
    sendJson(res, 401, {error: 'Unauthorized'});
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (_error) {
    sendJson(res, 400, {error: 'Invalid JSON'});
    return;
  }

  if (!payload || Array.isArray(payload) || String(payload.account_id) !== SPIFFY_ACCOUNT_ID) {
    sendJson(res, 403, {error: 'Forbidden'});
    return;
  }

  if (process.env.SPIFFY_WEBHOOK_DIAGNOSTIC === 'true') {
    console.log(JSON.stringify({
      event_type: safeEventType(payload),
      has_custom_ph_distinct_id: hasCustomPhDistinctId(payload),
      header_names: headerNames(req.headers),
      json_key_paths: collectJsonKeyPaths(payload),
    }));
  }

  if (payload.type === 'test') {
    sendJson(res, 200, {ok: true, diagnostic: true});
    return;
  }

  if (payload.type !== 'order:success') {
    sendJson(res, 200, {ok: true, ignored: true});
    return;
  }

  const orderId = webhookOrderId(payload);
  if (!orderId) {
    sendJson(res, 503, {error: 'Order is not available'});
    return;
  }

  const spiffyApiKey = process.env.SPIFFY_API_KEY;
  if (typeof spiffyApiKey !== 'string' || !spiffyApiKey) {
    sendJson(res, 503, {error: 'Webhook receiver is not configured'});
    return;
  }

  try {
    const order = await fetchSpiffyOrder(orderId, spiffyApiKey);
    const posthogToken = process.env.POSTHOG_PROJECT_TOKEN || POSTHOG_PUBLIC_TOKEN;
    const purchase = buildPurchaseEvent(order, orderId, posthogToken);
    if (purchase.kind === 'ignored') {
      sendJson(res, 200, {ok: true, ignored: true});
      return;
    }
    if (purchase.kind !== 'event') {
      sendJson(res, 503, {error: 'Order is not ready'});
      return;
    }
    await capturePosthogEvent(purchase.payload);
    sendJson(res, 200, {ok: true});
  } catch (_error) {
    sendJson(res, 503, {error: 'Temporary processing failure'});
  }
}

module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
module.exports._test = {
  MAX_BODY_BYTES,
  MAX_SIGNATURE_AGE_SECONDS,
  attributionProperties,
  buildPurchaseEvent,
  deterministicEventUuid,
  collectJsonKeyPaths,
  fetchSpiffyOrder,
  firstSuccessfulPayment,
  hasCustomPhDistinctId,
  linkedDistinctId,
  safeEventType,
  timingSafeTokenMatch,
  verifySpiffySignature,
  webhookOrderId,
};
