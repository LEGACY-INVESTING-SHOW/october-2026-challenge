/* Tax-Free Income Challenge analytics. PostHog project 600066. */
(function () {
  'use strict';

  var ANALYTICS_VERSION = '2026-09-17.1';
  var POSTHOG_TOKEN = 'phc_rQffz3NncDqfmLpKUcrDvThjyT3brt4QRSxcPUT2pFsw';
  var POSTHOG_PROXY = '/tfc';
  var PRODUCTION_HOST = 'go.managemoney101.com';
  var FUNNEL = 'october_2026_challenge';
  var ATTRIBUTION_KEY = 'october_challenge_attribution_v1';
  var ATTRIBUTION_SESSION_KEY = 'october_challenge_current_attribution_v1';
  var TEST_SESSION_KEY = 'october_challenge_analytics_test';
  var ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
  var CURRENT_SESSION_TTL_MS = 30 * 60 * 1000;
  var SESSION_REFRESH_INTERVAL_MS = 60 * 1000;
  var AUDIENCE_CAMPAIGNS = {
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
    // This full-date alias is already present in live traffic.
    'warm-bp4-giftshoppxr-091326': 'warm',
    'warm-bp4-static3keepmoreofwhatyouspenddecadesearning-091326': 'warm',
    'warm-bp4-static1paycheck401kwhiteboard-091326': 'warm',
    'warm-bp4-static2connectyourincome-091326': 'warm',
    'warm-bp4-suppgrouppxr-091326': 'warm'
  };

  if (window.__challengeAnalytics || window.posthog || !/^https?:$/.test(location.protocol)) return;

  var route = (location.pathname.replace(/\/+$/, '') || '/').toLowerCase();
  var routes = {
    '/': { step: 'landing_page', offer: 'challenge' },
    '/october': { step: 'landing_page', offer: 'challenge' },
    '/index': { step: 'landing_page', offer: 'challenge' },
    '/regularticketoct': { step: 'checkout', offer: 'regular_ticket' },
    '/regularticket26': { step: 'checkout', offer: 'regular_ticket' },
    '/vipticketoct': { step: 'checkout', offer: 'vip_ticket' },
    '/vipticket26': { step: 'checkout', offer: 'vip_ticket' },
    '/vipupgradeoct': { step: 'upsell', offer: 'vip_upgrade' },
    '/upgradevip': { step: 'upsell', offer: 'vip_upgrade' },
    '/prepkitoct': { step: 'upsell', offer: 'prep_kit' },
    '/prepkit': { step: 'upsell', offer: 'prep_kit' },
    '/prepkitvipoct': { step: 'upsell', offer: 'prep_kit_vip' },
    '/prepkitvip': { step: 'upsell', offer: 'prep_kit_vip' },
    '/taxreportoct': { step: 'upsell', offer: 'tax_report' },
    '/taxreport': { step: 'upsell', offer: 'tax_report' },
    '/taxreportvipoct': { step: 'upsell', offer: 'tax_report_vip' },
    '/taxreportvip': { step: 'upsell', offer: 'tax_report_vip' },
    '/octchallengeconfirmation': { step: 'purchase_confirmation', offer: 'regular_ticket' },
    '/octchallengeconfirmationvip': { step: 'purchase_confirmation', offer: 'vip_ticket' },
    '/octprechallengetraining': { step: 'fulfillment', offer: 'vip_training' },
    '/prechallengetraining123': { step: 'fulfillment', offer: 'vip_training' }
  };
  var routeInfo = routes[route] || { step: 'other', offer: 'challenge' };

  var localTestMode = location.hostname !== PRODUCTION_HOST && window.__CHALLENGE_ANALYTICS_TEST__ === true;
  var testMode = localTestMode;
  try {
    if (new URLSearchParams(location.search).get('analytics_test') === '1') {
      sessionStorage.setItem(TEST_SESSION_KEY, '1');
    }
    testMode = testMode || sessionStorage.getItem(TEST_SESSION_KEY) === '1';
  } catch (_) {
    testMode = testMode || /(?:^|[?&])analytics_test=1(?:&|$)/.test(location.search);
  }

  window.__challengeAnalytics = {
    version: ANALYTICS_VERSION,
    loaded: false,
    enabled: false,
    route: route,
    step: routeInfo.step,
    offer: routeInfo.offer,
    isTest: testMode
  };

  if (localTestMode && typeof window.__CHALLENGE_POSTHOG_TOKEN__ === 'string') {
    POSTHOG_TOKEN = window.__CHALLENGE_POSTHOG_TOKEN__;
  }

  function cleanUrl(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return value;
    try {
      var url = new URL(value);
      Array.from(url.searchParams.keys()).forEach(function (key) {
        if (!/^utm_(source|medium|campaign|content|term)$/i.test(key)) {
          url.searchParams.delete(key);
        }
      });
      url.hash = '';
      return url.href;
    } catch (_) {
      return value;
    }
  }

  function redactString(value) {
    return String(value)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
      .replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, '[redacted-phone]')
      .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[redacted-number]');
  }

  function safeTag(value) {
    var text = String(value || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240);
    return /^\d+$/.test(text) ? text : redactString(text);
  }

  function storage(name) {
    try { return window[name]; } catch (_) { return null; }
  }

  function readJson(store, key) {
    if (!store) return null;
    try { return JSON.parse(store.getItem(key) || 'null'); } catch (_) { return null; }
  }

  function writeJson(store, key, value) {
    if (!store) return;
    try { store.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function copy(value) {
    var output = {};
    Object.keys(value || {}).forEach(function (key) { output[key] = value[key]; });
    return output;
  }

  function campaignAudience(campaign) {
    return AUDIENCE_CAMPAIGNS[String(campaign || '').toLowerCase()] || 'unknown';
  }

  function normalizeTouch(value) {
    var touch = {};
    ['source', 'medium', 'campaign', 'content', 'term'].forEach(function (name) {
      var key = 'utm_' + name;
      if (value && Object.prototype.hasOwnProperty.call(value, key)) touch[key] = safeTag(value[key]);
    });
    touch.traffic_campaign = touch.utm_campaign || '';
    touch.traffic_audience = campaignAudience(touch.traffic_campaign);
    return touch;
  }

  function urlTouch() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (_) { params = null; }
    var touch = {};
    var hasUtm = false;
    ['source', 'medium', 'campaign', 'content', 'term'].forEach(function (name) {
      var key = 'utm_' + name;
      var present = params ? params.has(key) : new RegExp('(?:^|[?&])' + key + '=', 'i').test(location.search);
      if (!present) return;
      hasUtm = true;
      var value = params ? params.get(key) : '';
      touch[key] = safeTag(value);
    });
    return { hasUtm: hasUtm, touch: normalizeTouch(touch) };
  }

  function buildAttribution() {
    var now = Date.now();
    var localStore = storage('localStorage');
    var sessionStore = storage('sessionStorage');
    var persistent = readJson(localStore, ATTRIBUTION_KEY) || {};
    if (!persistent.expires_at || persistent.expires_at <= now) persistent = {};
    if (persistent.first) persistent.first = normalizeTouch(persistent.first);
    if (persistent.last) persistent.last = normalizeTouch(persistent.last);

    var incoming = urlTouch();
    var sessionRecord = readJson(sessionStore, ATTRIBUTION_SESSION_KEY);
    var current = sessionRecord && sessionRecord.expires_at > now ? sessionRecord.touch : null;
    if (!current || typeof current !== 'object') current = null;
    if (incoming.hasUtm || !current) current = incoming.touch;
    current = normalizeTouch(current || {});
    writeJson(sessionStore, ATTRIBUTION_SESSION_KEY, {
      touch: current,
      expires_at: now + CURRENT_SESSION_TTL_MS
    });

    // First touch stays fixed. Last touch changes only on a tagged arrival.
    // Both expire after 90 days without a new tagged touch.
    if (!persistent.first) persistent.first = copy(current);
    if (!persistent.last || incoming.hasUtm) persistent.last = copy(current);
    if (!persistent.expires_at || incoming.hasUtm) persistent.expires_at = now + ATTRIBUTION_TTL_MS;
    writeJson(localStore, ATTRIBUTION_KEY, persistent);

    var properties = copy(current);
    ['first', 'last'].forEach(function (position) {
      Object.keys(persistent[position] || {}).forEach(function (key) {
        properties[position + '_' + key] = persistent[position][key];
      });
    });
    return {
      current: copy(current),
      first: copy(persistent.first),
      last: copy(persistent.last),
      properties: properties
    };
  }

  var attribution = buildAttribution();
  var lastSessionRefresh = Date.now();

  function refreshAttributionSession() {
    var now = Date.now();
    if (now - lastSessionRefresh < SESSION_REFRESH_INTERVAL_MS) return;
    lastSessionRefresh = now;
    writeJson(storage('sessionStorage'), ATTRIBUTION_SESSION_KEY, {
      touch: attribution.current,
      expires_at: now + CURRENT_SESSION_TTL_MS
    });
  }

  window.__challengeAttribution = {
    version: 1,
    expiresAfterDays: 90,
    currentSessionInactivityMinutes: 30,
    getAudience: function () { return attribution.current.traffic_audience; },
    getCampaign: function () { return attribution.current.traffic_campaign; },
    getAnonymousId: function () {
      // Read only the existing anonymous SDK identity, never lead/contact data.
      // The storage key matches the live SDK's default localStorage persistence.
      var id;
      try {
        if (window.__challengeAnalytics.loaded && window.posthog) id = window.posthog.get_distinct_id();
        if (!id) {
          var keyToken = POSTHOG_TOKEN.replace(/\+/g, 'PL').replace(/\//g, 'SL').replace(/=/g, 'EQ');
          var persisted = readJson(storage('localStorage'), 'ph_' + keyToken + '_posthog');
          id = persisted && persisted.distinct_id;
        }
      } catch (_) {}
      return typeof id === 'string' && /^(?:\$device:)?[a-zA-Z0-9_-]{16,128}$/.test(id) ? id : null;
    },
    getUtmFields: function () {
      var fields = {};
      Object.keys(attribution.current).forEach(function (key) {
        if (/^utm_(source|medium|campaign|content|term)$/.test(key)) fields[key] = attribution.current[key];
      });
      return fields;
    },
    getFirstTouch: function () { return copy(attribution.first); },
    getLastTouch: function () { return copy(attribution.last); },
    getEventProperties: function () { return copy(attribution.properties); }
  };

  ['click', 'keydown', 'scroll', 'touchstart'].forEach(function (eventName) {
    document.addEventListener(eventName, refreshAttributionSession, { capture: true, passive: true });
  });

  if (location.hostname !== PRODUCTION_HOST && !localTestMode) {
    window.__challengeAnalytics.disabledReason = 'non_production_host';
    return;
  }

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],o='init capture register register_once unregister identify reset get_distinct_id get_session_id set_config startSessionRecording stopSessionRecording opt_in_capturing opt_out_capturing has_opted_out_capturing'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  function sanitize(value, key, depth) {
    if (depth > 8) return null;
    if (/^(email|phone|phone_number|name_first|name_last|address|card|password)$/i.test(key || '')) {
      return undefined;
    }
    if (typeof value === 'string') return cleanUrl(value);
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
      return value.map(function (item) { return sanitize(item, '', depth + 1); });
    }
    var output = {};
    Object.keys(value).forEach(function (childKey) {
      var child = sanitize(value[childKey], childKey, depth + 1);
      if (typeof child !== 'undefined') output[childKey] = child;
    });
    return output;
  }

  function pageProperties(extra) {
    var props = {
      funnel: FUNNEL,
      funnel_step: routeInfo.step,
      offer: routeInfo.offer,
      analytics_version: ANALYTICS_VERSION,
      canonical_path: route,
      is_test: testMode
    };
    Object.keys(attribution.properties).forEach(function (key) { props[key] = attribution.properties[key]; });
    Object.keys(extra || {}).forEach(function (key) { props[key] = extra[key]; });
    return props;
  }

  function stampEventProperties(properties) {
    properties.funnel = FUNNEL;
    properties.funnel_step = routeInfo.step;
    properties.offer = routeInfo.offer;
    properties.analytics_version = ANALYTICS_VERSION;
    properties.canonical_path = route;
    properties.is_test = testMode;
    Object.keys(attribution.properties).forEach(function (key) { properties[key] = attribution.properties[key]; });
    return properties;
  }

  function elementText(element) {
    var text = (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim();
    return text.slice(0, 120);
  }

  function sectionName(element) {
    var section = element.closest('section[id], header[id], footer[id], [data-analytics-location]');
    if (!section) return 'unknown';
    return section.getAttribute('data-analytics-location') || section.id || section.tagName.toLowerCase();
  }

  function offerFromHref(href) {
    if (/vipticketoct|tax-fre-income-challenge-vip/i.test(href)) return 'vip_ticket';
    if (/regularticketoct|tax-free-income-challenge-oct/i.test(href)) return 'regular_ticket';
    return routeInfo.offer;
  }

  function trackClicks(ph) {
    document.addEventListener('click', function (event) {
      var element = event.target.closest('a, button');
      if (!element) return;

      var href = element.getAttribute('href') || '';
      var properties = pageProperties({
        cta_text: elementText(element),
        cta_location: sectionName(element),
        element_id: element.id || null
      });

      if (/legacyinvestingshow\.spiffy\.co\/offer\//i.test(href)) {
        properties.action = /decline/i.test(element.id + ' ' + element.className) ? 'decline' : 'accept';
        properties.destination_host = 'legacyinvestingshow.spiffy.co';
        ph.capture('upsell_offer_clicked', properties);
        return;
      }

      if (/\/(regular|vip)ticketoct/i.test(href)) {
        properties.ticket_type = offerFromHref(href);
        ph.capture('ticket_option_selected', properties);
        return;
      }

      if (href === '#checkout') {
        ph.capture('checkout_cta_clicked', properties);
        return;
      }

      if (/^calendar-/.test(element.id)) {
        properties.calendar_type = element.id.replace('calendar-', '');
        ph.capture('calendar_link_clicked', properties);
        return;
      }

      if (element.classList.contains('btn')) {
        ph.capture('cta_clicked', properties);
      }
    }, { capture: true });
  }

  function trackCheckout(ph) {
    if (routeInfo.step !== 'checkout') return;
    ph.capture('checkout_viewed', pageProperties({ ticket_type: routeInfo.offer }));

    var mounted = false;
    var loaded = false;
    var observer = new MutationObserver(function () {
      var frame = document.querySelector('spiffy-element iframe');
      if (!frame) return;

      if (!mounted) {
        mounted = true;
        ph.capture('checkout_embed_mounted', pageProperties({ ticket_type: routeInfo.offer }));
      }

      if (!frame.__posthogLoadTracked) {
        frame.__posthogLoadTracked = true;
        frame.addEventListener('load', function () {
          if (loaded) return;
          loaded = true;
          ph.capture('checkout_embed_loaded', pageProperties({ ticket_type: routeInfo.offer }));
        }, { once: true });
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 20000);
  }

  function trackScroll(ph) {
    var milestones = [25, 50, 75, 90, 100];
    var seen = {};
    var ticking = false;
    function measure() {
      ticking = false;
      var documentHeight = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
      var available = Math.max(1, documentHeight - window.innerHeight);
      var percent = Math.min(100, Math.round((window.scrollY / available) * 100));
      milestones.forEach(function (milestone) {
        if (percent >= milestone && !seen[milestone]) {
          seen[milestone] = true;
          ph.capture('scroll_milestone_reached', pageProperties({ percent: milestone }));
        }
      });
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      (window.requestAnimationFrame || function (callback) { setTimeout(callback, 0); })(measure);
    }, { passive: true });
    measure();
  }

  window.posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_PROXY,
    ui_host: 'https://us.posthog.com',
    defaults: '2026-08-30',
    persistence: 'localStorage',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    capture_dead_clicks: true,
    capture_exceptions: true,
    capture_heatmaps: true,
    capture_performance: {
      web_vitals_allowed_metrics: ['LCP', 'CLS', 'FCP', 'INP']
    },
    session_recording: {
      maskAllInputs: true,
      blockSelector: 'iframe, spiffy-element, .checkout-mount',
      maskCapturedNetworkRequestFn: function (request) {
        request.name = cleanUrl(request.name);
        return request;
      }
    },
    before_send: function (event) {
      if (!event) return event;
      var properties = event.properties || {};
      if (event.event !== '$snapshot') properties = sanitize(properties, '', 0) || {};
      event.properties = stampEventProperties(properties);
      return event;
    },
    loaded: function (ph) {
      ph.register(pageProperties());
      ph.capture('$pageview', pageProperties({ title: document.title }));
      trackClicks(ph);
      trackCheckout(ph);
      trackScroll(ph);

      if (routeInfo.step === 'purchase_confirmation') {
        ph.capture('purchase_confirmation_viewed', pageProperties({ ticket_type: routeInfo.offer }));
      }

      window.__challengeAnalytics.loaded = true;
      window.__challengeAnalytics.enabled = true;
      window.dispatchEvent(new CustomEvent('challenge-analytics-ready'));
    }
  });
}());
