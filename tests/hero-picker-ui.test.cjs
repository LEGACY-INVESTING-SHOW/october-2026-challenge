'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const pageSource = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const pickerScriptMatch = pageSource.match(
  /<script>\s*(\/\* Hero button A\/B test[\s\S]*?)<\/script>/
);

assert.ok(pickerScriptMatch, 'hero picker script is present in index.html');
const pickerScript = pickerScriptMatch[1];

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  contains(value) { return this.values.has(value); }
}

function createControl() {
  const listeners = {};
  return {
    listeners,
    classList: new FakeClassList(),
    innerHTML: '',
    attributes: {},
    addEventListener(type, callback) { listeners[type] = callback; },
    setAttribute(name, value) { this.attributes[name] = value; }
  };
}

function executePicker(options = {}) {
  const documentListeners = {};
  const windowListeners = {};
  const timers = new Map();
  let nextTimerId = 1;

  const picker = {
    classList: new FakeClassList(),
    hidden: true,
    offsetHeight: 0,
    getBoundingClientRect() { return { top: 200, bottom: 500 }; }
  };
  const heroButton = createControl();
  const stickyButton = createControl();
  const closeButton = createControl();
  const pickerBox = {
    offsetParent: {},
    querySelector(selector) {
      if (selector === '.js-hero-cta') return heroButton;
      return null;
    }
  };
  picker.parentElement = pickerBox;
  heroButton.parentElement = {
    querySelector(selector) { return selector === '.hero-picker' ? picker : null; }
  };
  closeButton.closest = (selector) => selector === '.hero-picker' ? picker : null;

  const document = {
    addEventListener(type, callback, capture) {
      documentListeners[type] = { callback, capture };
    },
    querySelectorAll(selector) {
      if (selector === '.hero-picker') return [picker];
      if (selector === '.js-hero-cta') return [heroButton];
      if (selector === '.js-sticky-cta') return [stickyButton];
      if (selector === '.pick-close') return [closeButton];
      return [];
    }
  };
  const window = {
    __challengeAnalytics: options.analytics,
    innerHeight: 800,
    pageYOffset: 0,
    addEventListener(type, callback) { windowListeners[type] = callback; },
    scrollTo() {}
  };
  const context = {
    WeakMap,
    clearTimeout(id) { timers.delete(id); },
    console,
    document,
    getComputedStyle() { return { display: 'block' }; },
    setTimeout(callback) {
      const id = nextTimerId++;
      timers.set(id, callback);
      return id;
    },
    window
  };

  vm.runInNewContext(pickerScript, context, { filename: 'hero-picker.js' });

  return {
    documentListeners,
    heroButton,
    picker,
    runAllTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach((callback) => callback());
    },
    window
  };
}

function click(control) {
  let prevented = false;
  control.listeners.click({ preventDefault() { prevented = true; } });
  return prevented;
}

test('a stale close timer cannot hide a picker reopened immediately', () => {
  const result = executePicker({ analytics: { heroVariant: 'picker' } });

  assert.equal(click(result.heroButton), true);
  assert.equal(result.picker.hidden, false);
  assert.equal(result.picker.classList.contains('is-open'), true);

  assert.equal(click(result.heroButton), true);
  assert.equal(result.picker.classList.contains('is-open'), false);

  assert.equal(click(result.heroButton), true);
  result.runAllTimers();

  assert.equal(result.picker.hidden, false);
  assert.equal(result.picker.classList.contains('is-open'), true);
  assert.equal(result.heroButton.attributes['aria-expanded'], 'true');
});

test('an early CTA click records the handshake without blocking navigation', () => {
  const result = executePicker({ analytics: { heroVariant: null } });
  const listener = result.documentListeners.click;
  let prevented = false;
  const target = {
    closest(selector) {
      return selector === '.js-hero-cta, .js-sticky-cta' ? result.heroButton : null;
    }
  };

  assert.ok(listener, 'capture click listener is registered');
  assert.equal(listener.capture, true);
  listener.callback({ target, preventDefault() { prevented = true; } });

  assert.equal(result.window.__challengeHeroInteractedBeforeVariant, true);
  assert.equal(prevented, false);
});

test('resolved variants do not set the early-interaction handshake', () => {
  for (const heroVariant of ['control', 'picker']) {
    const result = executePicker({ analytics: { heroVariant } });
    const target = { closest() { return result.heroButton; } };
    result.documentListeners.click.callback({ target });
    assert.equal(result.window.__challengeHeroInteractedBeforeVariant, undefined);
  }
});
