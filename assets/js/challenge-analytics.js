/* Tax-Free Income Challenge analytics. PostHog project 600066. */
(function () {
  'use strict';

  var ANALYTICS_VERSION = '2026-09-14.1';
  var POSTHOG_TOKEN = 'phc_rQffz3NncDqfmLpKUcrDvThjyT3brt4QRSxcPUT2pFsw';
  var POSTHOG_PROXY = '/tfc';
  var PRODUCTION_HOST = 'go.managemoney101.com';

  if (window.posthog || !/^https?:$/.test(location.protocol)) return;
  if (location.hostname !== PRODUCTION_HOST) return;

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

  window.__challengeAnalytics = {
    version: ANALYTICS_VERSION,
    loaded: false,
    route: route,
    step: routeInfo.step,
    offer: routeInfo.offer
  };

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],o='init capture register register_once unregister identify reset get_distinct_id get_session_id set_config startSessionRecording stopSessionRecording opt_in_capturing opt_out_capturing has_opted_out_capturing'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

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
      funnel: 'october_2026_challenge',
      funnel_step: routeInfo.step,
      offer: routeInfo.offer,
      analytics_version: ANALYTICS_VERSION,
      canonical_path: route
    };
    Object.keys(extra || {}).forEach(function (key) { props[key] = extra[key]; });
    return props;
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
      event.properties = sanitize(event.properties || {}, '', 0);
      return event;
    },
    loaded: function (ph) {
      ph.register(pageProperties());
      ph.capture('$pageview', pageProperties({ title: document.title }));
      trackClicks(ph);
      trackCheckout(ph);

      if (routeInfo.step === 'purchase_confirmation') {
        ph.capture('purchase_confirmation_viewed', pageProperties({ ticket_type: routeInfo.offer }));
      }

      window.__challengeAnalytics.loaded = true;
      window.dispatchEvent(new CustomEvent('challenge-analytics-ready'));
    }
  });
}());
