/* Legacy Investing Show — wealth tools. Shared runtime (no dependencies). */
(function () {
  'use strict';
  const LIS = (window.LIS = window.LIS || {});
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Formatters ---------- */
  const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const fmt = {
    money(v, d) {
      if (!isFinite(v)) return '—';
      return d === 2 ? usd2.format(v) : usd0.format(v);
    },
    compact(v) {
      if (!isFinite(v)) return '—';
      const a = Math.abs(v), s = v < 0 ? '-' : '';
      if (a >= 1e9) return s + '$' + (a / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
      if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
      if (a >= 1e3) return s + '$' + (a / 1e3).toFixed(0) + 'k';
      return s + '$' + a.toFixed(0);
    },
    pct(v, d = 1) { return isFinite(v) ? v.toFixed(d) + '%' : '—'; },
    num(v, d = 0) { return isFinite(v) ? (d ? v.toFixed(d) : num0.format(v)) : '—'; },
    mult(v) { return isFinite(v) ? v.toFixed(1) + '×' : '—'; },
    months(m) {
      if (!isFinite(m)) return '—';
      m = Math.round(m);
      const y = Math.floor(m / 12), r = m % 12;
      if (y === 0) return r + (r === 1 ? ' month' : ' months');
      if (r === 0) return y + (y === 1 ? ' year' : ' years');
      return y + (y === 1 ? ' yr ' : ' yrs ') + r + ' mo';
    },
    yearsWord(n) { return n + (n === 1 ? ' year' : ' years'); },
    ordinal(n) {
      n = Math.round(n);
      const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },
    monthYear(d) { return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); },
  };
  LIS.fmt = fmt;
  LIS.clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ---------- Field binding ----------
     Markup per field:
       <div class="field" data-key="income" data-min="0" data-max="50000" data-step="100" data-default="6000" data-fmt="money">
         <div class="field-row"><label for="f-income">Label</label><output class="field-out"></output></div>
         <div class="field-ctl"><input type="range"><div class="numwrap has-pre"><span class="affix pre">$</span><input type="number" id="f-income"></div></div>
       </div>
     Toggles: <label class="toggle" data-key="scorp"><span>Label</span><input type="checkbox"><span class="sw"></span></label>
     Segments: <div class="segment" data-key="delay"><button data-val="1">1 yr</button>...</div>
  */
  LIS.bind = function (root, onChange, opts) {
    opts = opts || {};
    const state = {};
    const fields = {};
    const params = new URLSearchParams(location.search);
    let raf = 0, urlTimer = 0;

    function fmtOut(f, v) {
      const kind = f.el.dataset.fmt || 'num';
      const d = +(f.el.dataset.dec || 0);
      if (kind === 'money') return fmt.money(v);
      if (kind === 'pct') return fmt.pct(v, d);
      if (kind === 'years') return fmt.yearsWord(v);
      if (kind === 'age') return 'Age ' + v;
      return fmt.num(v, d);
    }
    function paint(f) {
      const v = state[f.key];
      if (f.range) { f.range.value = v; const p = ((v - f.min) / (f.max - f.min)) * 100; f.range.style.setProperty('--p', LIS.clamp(p, 0, 100) + '%'); }
      if (f.num && document.activeElement !== f.num) f.num.value = v;
      if (f.out) f.out.textContent = fmtOut(f, v);
    }
    function emit() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { onChange(state); pushUrl(); });
    }
    function pushUrl() {
      if (opts.url === false) return;
      clearTimeout(urlTimer);
      urlTimer = setTimeout(() => {
        const p = new URLSearchParams();
        let changed = false;
        Object.keys(fields).forEach(k => { const f = fields[k]; if (state[k] !== f.def) { p.set(k, state[k]); changed = true; } });
        history.replaceState(null, '', (changed ? location.pathname + '?' + p.toString() : location.pathname) + location.hash);
      }, 250);
    }
    function set(key, v, silent) {
      const f = fields[key];
      if (!f) return;
      if (f.type === 'bool') state[key] = !!v;
      else if (f.type === 'seg') state[key] = v;
      else {
        v = +v;
        if (!isFinite(v)) v = f.def;
        state[key] = LIS.clamp(v, f.min, f.max);
      }
      paint(f);
      if (!silent) emit();
    }

    root.querySelectorAll('[data-key]').forEach(el => {
      const key = el.dataset.key;
      const f = { key, el };
      if (el.classList.contains('toggle')) {
        f.type = 'bool'; f.input = el.querySelector('input');
        f.def = f.input.checked;
        state[key] = params.has(key) ? params.get(key) === 'true' : f.def;
        f.input.checked = state[key];
        f.input.addEventListener('change', () => { state[key] = f.input.checked; emit(); });
        fields[key] = f;
        return;
      }
      if (el.classList.contains('segment')) {
        f.type = 'seg'; f.btns = [...el.querySelectorAll('button')];
        f.def = (el.dataset.default != null) ? el.dataset.default : f.btns[0].dataset.val;
        state[key] = params.has(key) ? params.get(key) : f.def;
        const paintSeg = () => f.btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === String(state[key]))));
        f.btns.forEach(b => b.addEventListener('click', () => { state[key] = b.dataset.val; paintSeg(); emit(); }));
        paintSeg();
        fields[key] = f;
        return;
      }
      f.type = 'num';
      f.min = +(el.dataset.min ?? 0); f.max = +(el.dataset.max ?? 1e9); f.step = +(el.dataset.step ?? 1); f.def = +(el.dataset.default ?? f.min);
      f.range = el.querySelector('input[type=range]'); f.num = el.querySelector('input[type=number]'); f.out = el.querySelector('.field-out');
      if (f.range) { f.range.min = f.min; f.range.max = f.max; f.range.step = f.step; }
      if (f.num) { f.num.min = f.min; f.num.max = f.max; f.num.step = f.step; f.num.inputMode = 'decimal'; }
      state[key] = params.has(key) && isFinite(+params.get(key)) ? LIS.clamp(+params.get(key), f.min, f.max) : f.def;
      fields[key] = f;
      paint(f);
      if (f.range) f.range.addEventListener('input', () => { state[key] = +f.range.value; paint(f); emit(); });
      if (f.num) {
        f.num.addEventListener('input', () => {
          const v = parseFloat(f.num.value);
          if (!isFinite(v)) return;
          state[key] = LIS.clamp(v, f.min, f.max);
          f.num.setAttribute('aria-invalid', String(v < f.min || v > f.max));
          if (f.range) { f.range.value = state[key]; f.range.style.setProperty('--p', ((state[key] - f.min) / (f.max - f.min)) * 100 + '%'); }
          if (f.out) f.out.textContent = fmtOut(f, state[key]);
          emit();
        });
        f.num.addEventListener('blur', () => { f.num.removeAttribute('aria-invalid'); paint(f); });
        f.num.addEventListener('keydown', e => { if (e.key === 'Enter') f.num.blur(); });
      }
    });

    // Dynamic min for one field based on another (e.g. retirement age >= current age)
    function setMin(key, min) { const f = fields[key]; if (!f) return; f.min = min; if (f.range) f.range.min = min; if (f.num) f.num.min = min; if (state[key] < min) { state[key] = min; } paint(f); }
    function setMax(key, max) { const f = fields[key]; if (!f) return; f.max = max; if (f.range) f.range.max = max; if (f.num) f.num.max = max; if (state[key] > max) { state[key] = max; } paint(f); }

    function reset() {
      Object.values(fields).forEach(f => {
        if (f.type === 'bool') { state[f.key] = f.def; f.input.checked = f.def; }
        else if (f.type === 'seg') { state[f.key] = f.def; f.btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.val === String(f.def)))); }
        else { state[f.key] = f.def; paint(f); }
      });
      emit();
    }
    root.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); reset(); }));

    const api = { state, set, setMin, setMax, reset, fields, run: () => onChange(state) };
    if (opts.run !== false) requestAnimationFrame(() => onChange(state));
    let rz = 0, lastW = window.innerWidth;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; onChange(state); } }, 200); });
    return api;
  };

  /* ---------- Count-up ---------- */
  const running = new WeakMap();
  LIS.count = function (el, target, format, ms) {
    if (!el) return;
    format = format || fmt.money;
    if (!isFinite(target)) { el.textContent = '—'; running.set(el, target); return; }
    const from = isFinite(running.get(el)) ? running.get(el) : 0;
    running.set(el, target);
    if (reduced || Math.abs(target - from) < 1e-9) { el.textContent = format(target); return; }
    ms = ms || 650;
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 4);
    function tick(now) {
      if (running.get(el) !== target) return;
      const t = Math.min(1, (now - t0) / ms);
      el.textContent = format(from + (target - from) * ease(t));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };
  LIS.text = function (el, s) { if (el && el.textContent !== s) el.textContent = s; };
  LIS.cls = function (el, base, extra) { if (el) el.className = base + (extra ? ' ' + extra : ''); };
  LIS.meter = function (el, pct, color) {
    if (!el) return;
    el.style.width = LIS.clamp(pct, 0, 100) + '%';
    el.className = 'meter-fill' + (color ? ' ' + color : '');
  };

  /* ---------- Tabs ---------- */
  LIS.tabs = function (root, onChange) {
    const tabs = [...root.querySelectorAll('[role=tab]')];
    const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
    function activate(i, focus) {
      tabs.forEach((t, j) => { const on = i === j; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panels[j].hidden = !on; });
      if (focus) tabs[i].focus();
      onChange && onChange(tabs[i].dataset.tab, i);
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => activate(i));
      t.addEventListener('keydown', e => {
        const k = e.key;
        if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); activate((i + (k === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true); }
        if (k === 'Home') { e.preventDefault(); activate(0, true); }
        if (k === 'End') { e.preventDefault(); activate(tabs.length - 1, true); }
      });
    });
    const hash = location.hash.replace('#', '');
    const start = Math.max(0, tabs.findIndex(t => t.dataset.tab === hash));
    activate(start);
    return { activate: name => activate(Math.max(0, tabs.findIndex(t => t.dataset.tab === name))) };
  };

  /* ---------- Share ---------- */
  LIS.share = function (btn) {
    if (!btn) return;
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(location.href); ok = true; } catch (e) { /* fall through */ }
      if (!ok) {
        try { const ta = document.createElement('textarea'); ta.value = location.href; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch (e) { ok = false; }
      }
      btn.textContent = ok ? 'Link copied' : 'Copy the address bar link';
      setTimeout(() => (btn.textContent = label), 1600);
    });
  };

  /* ---------- SVG charts ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function niceTicks(max, n) {
    if (!(max > 0)) return [0, 1];
    const raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    const out = [];
    for (let v = 0; v <= max + step * 0.001; v += step) out.push(v);
    if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
    return out;
  }
  const chart = (LIS.chart = {});

  /* Line/area chart. cfg: { x:[numbers], series:[{name, values, color, dash, area}], yFmt, xFmt, markers:[{x,label,color}], height, yMin } */
  chart.line = function (host, cfg) {
    host.innerHTML = '';
    host.classList.add('chart');
    const narrow = host.clientWidth && host.clientWidth < 520;
    const W = narrow ? 400 : 640, H = cfg.height || (narrow ? 260 : 300), ml = narrow ? 46 : 52, mr = 14, mt = 18, mb = 34;
    const iw = W - ml - mr, ih = H - mt - mb;
    const xs = cfg.x, n = xs.length;
    let ymax = 0; cfg.series.forEach(s => s.values.forEach(v => { if (isFinite(v) && v > ymax) ymax = v; }));
    const ticks = niceTicks(ymax || 1, 4); ymax = ticks[ticks.length - 1];
    const x0 = xs[0], x1 = xs[n - 1] === x0 ? x0 + 1 : xs[n - 1];
    const X = v => ml + ((v - x0) / (x1 - x0)) * iw, Y = v => mt + ih - (LIS.clamp(v, 0, ymax) / ymax) * ih;
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.label || 'Chart' }, host);
    const grid = svgEl('g', { class: 'grid' }, svg), axis = svgEl('g', { class: 'axis' }, svg);
    const yFmt = cfg.yFmt || fmt.compact, xFmt = cfg.xFmt || (v => v);
    ticks.forEach(t => { svgEl('line', { x1: ml, x2: W - mr, y1: Y(t), y2: Y(t) }, grid); const tx = svgEl('text', { x: ml - 8, y: Y(t) + 4, 'text-anchor': 'end' }, axis); tx.textContent = yFmt(t); });
    const xt = cfg.xTicks || (() => { const want = narrow ? 4 : 6, step = Math.max(1, Math.round((n - 1) / want)); const out = []; for (let i = 0; i < n; i += step) out.push(xs[i]); if (out[out.length - 1] !== xs[n - 1]) out.push(xs[n - 1]); return out; })();
    xt.forEach(v => { const tx = svgEl('text', { x: X(v), y: H - mb + 18, 'text-anchor': 'middle' }, axis); tx.textContent = xFmt(v); });
    svgEl('line', { x1: ml, x2: W - mr, y1: mt + ih, y2: mt + ih }, axis);
    // areas then lines
    cfg.series.forEach(s => {
      const pts = s.values.map((v, i) => [X(xs[i]), Y(isFinite(v) ? v : 0)]);
      if (s.area) {
        const d = 'M' + pts.map(p => p.join(',')).join('L') + `L${pts[pts.length - 1][0]},${mt + ih}L${pts[0][0]},${mt + ih}Z`;
        svgEl('path', { d, fill: s.color, opacity: s.areaOpacity || 0.12 }, svg);
      }
    });
    cfg.series.forEach(s => {
      const pts = s.values.map((v, i) => [X(xs[i]), Y(isFinite(v) ? v : 0)]);
      const d = 'M' + pts.map(p => p.join(',')).join('L');
      const p = svgEl('path', { d, fill: 'none', stroke: s.color, 'stroke-width': s.width || 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      if (s.dash) p.setAttribute('stroke-dasharray', '5 5');
      if (!reduced && !cfg.noAnim) { const len = p.getTotalLength ? p.getTotalLength() : 2000; p.style.strokeDasharray = s.dash ? '5 5' : len; p.style.strokeDashoffset = s.dash ? 0 : len; p.style.transition = 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)'; requestAnimationFrame(() => requestAnimationFrame(() => { p.style.strokeDashoffset = 0; })); }
    });
    (cfg.markers || []).forEach(m => {
      if (m.x < x0 || m.x > x1) return;
      svgEl('line', { x1: X(m.x), x2: X(m.x), y1: mt, y2: mt + ih, stroke: m.color || '#8D9BA6', 'stroke-dasharray': '3 4' }, svg);
      const t = svgEl('text', { x: X(m.x) + 5, y: mt + 10, class: 'lbl', fill: m.color || '' }, svg); t.textContent = m.label;
    });
    // legend
    const lg = document.createElement('div'); lg.className = 'chart-legend';
    cfg.series.forEach(s => { const sp = document.createElement('span'); sp.innerHTML = `<i class="${s.dash ? 'dash' : ''}" style="background:${s.dash ? '' : s.color};color:${s.color}"></i>${s.name}`; lg.appendChild(sp); });
    host.appendChild(lg);
    // hover
    const cross = svgEl('g', { class: 'cross', opacity: 0 }, svg);
    const cl = svgEl('line', { y1: mt, y2: mt + ih, stroke: '#1D2A22', 'stroke-width': 1, opacity: .5 }, cross);
    const dots = cfg.series.map(s => svgEl('circle', { r: 4, fill: s.color, stroke: '#FFFDF6', 'stroke-width': 2 }, cross));
    const tip = document.createElement('div'); tip.className = 'chart-tip'; host.appendChild(tip);
    function move(e) {
      const r = svg.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W;
      let best = 0, bd = Infinity; xs.forEach((v, i) => { const d = Math.abs(X(v) - px); if (d < bd) { bd = d; best = i; } });
      const cx = X(xs[best]);
      cross.setAttribute('opacity', 1); cl.setAttribute('x1', cx); cl.setAttribute('x2', cx);
      dots.forEach((d, j) => { const v = cfg.series[j].values[best]; d.setAttribute('cx', cx); d.setAttribute('cy', Y(isFinite(v) ? v : 0)); d.style.display = isFinite(v) ? '' : 'none'; });
      tip.innerHTML = `<b>${cfg.tipLabel ? cfg.tipLabel(xs[best]) : xFmt(xs[best])}</b>` + cfg.series.map((s, j) => `<div class="r"><span><i style="background:${s.color}"></i>${s.name}</span><span>${(cfg.tipFmt || fmt.money)(s.values[best])}</span></div>`).join('');
      tip.style.left = (cx / W) * r.width + 'px'; tip.style.top = (mt / H) * r.height + 'px'; tip.classList.add('on');
    }
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerleave', () => { cross.setAttribute('opacity', 0); tip.classList.remove('on'); });
    return svg;
  };

  /* Bars. cfg: { items:[{label, value, color, muted}], yFmt, height } */
  chart.bars = function (host, cfg) {
    host.innerHTML = ''; host.classList.add('chart');
    const narrow = host.clientWidth && host.clientWidth < 520;
    const W = narrow ? 400 : 640, H = cfg.height || (narrow ? 220 : 240), ml = narrow ? 46 : 52, mr = 10, mt = 14, mb = 30, iw = W - ml - mr, ih = H - mt - mb;
    const ticks = niceTicks(Math.max(...cfg.items.map(i => isFinite(i.value) ? i.value : 0), 1), 4); const ymax = ticks[ticks.length - 1];
    const Y = v => mt + ih - (LIS.clamp(v, 0, ymax) / ymax) * ih;
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.label || 'Bar chart' }, host);
    const grid = svgEl('g', { class: 'grid' }, svg), axis = svgEl('g', { class: 'axis' }, svg);
    ticks.forEach(t => { svgEl('line', { x1: ml, x2: W - mr, y1: Y(t), y2: Y(t) }, grid); const tx = svgEl('text', { x: ml - 8, y: Y(t) + 4, 'text-anchor': 'end' }, axis); tx.textContent = (cfg.yFmt || fmt.compact)(t); });
    const n = cfg.items.length, slot = iw / n, bw = Math.min(64, slot * .55);
    cfg.items.forEach((it, i) => {
      const cx = ml + slot * i + slot / 2, v = isFinite(it.value) ? Math.max(0, it.value) : 0;
      const r = svgEl('rect', { x: cx - bw / 2, y: Y(v), width: bw, height: mt + ih - Y(v), rx: 3, fill: it.color }, svg);
      if (!reduced && !cfg.noAnim) { r.style.transformOrigin = `${cx}px ${mt + ih}px`; r.style.transform = 'scaleY(0)'; r.style.transition = 'transform .7s cubic-bezier(.22,1,.36,1) ' + (i * 60) + 'ms'; requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transform = 'scaleY(1)'; })); }
      const t = svgEl('text', { x: cx, y: H - mb + 18, 'text-anchor': 'middle' }, axis); t.textContent = it.label;
      const vl = svgEl('text', { x: cx, y: Y(v) - 6, 'text-anchor': 'middle', class: 'lbl', 'font-weight': 600 }, svg); vl.textContent = (cfg.valFmt || fmt.compact)(it.value);
    });
    return svg;
  };

  /* Donut. cfg: { items:[{label,value,color}], big, small } */
  chart.donut = function (host, cfg) {
    host.innerHTML = ''; host.classList.add('chart');
    const S = 180, c = S / 2, r = 70, w = 18;
    const svg = svgEl('svg', { viewBox: `0 0 ${S} ${S}`, role: 'img', 'aria-label': cfg.label || 'Donut chart', style: 'max-width:200px;margin-inline:auto' }, host);
    const total = cfg.items.reduce((a, b) => a + (isFinite(b.value) ? Math.max(0, b.value) : 0), 0);
    svgEl('circle', { cx: c, cy: c, r, fill: 'none', stroke: '#EDE6D4', 'stroke-width': w }, svg);
    const circ = 2 * Math.PI * r; let off = 0;
    cfg.items.forEach(it => {
      const v = isFinite(it.value) ? Math.max(0, it.value) : 0; if (!total || !v) return;
      const len = (v / total) * circ;
      const el = svgEl('circle', { cx: c, cy: c, r, fill: 'none', stroke: it.color, 'stroke-width': w, 'stroke-dasharray': `${Math.max(0, len - 2)} ${circ}`, 'stroke-dashoffset': -off, transform: `rotate(-90 ${c} ${c})`, 'stroke-linecap': 'butt' }, svg);
      if (!reduced) { el.style.transition = 'stroke-dasharray .8s cubic-bezier(.22,1,.36,1)'; }
      off += len;
    });
    if (cfg.big) { const t = svgEl('text', { x: c, y: c + 2, 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 22, fill: '#16352A' }, svg); t.textContent = cfg.big; }
    if (cfg.small) { const t = svgEl('text', { x: c, y: c + 20, 'text-anchor': 'middle', 'font-size': 10, fill: '#74816F' }, svg); t.textContent = cfg.small; }
    return svg;
  };

  /* Horizontal comparison bars. cfg: { items:[{label,value,color,note}], max } */
  chart.hbars = function (host, cfg) {
    host.innerHTML = ''; host.classList.add('chart');
    const max = cfg.max || Math.max(...cfg.items.map(i => isFinite(i.value) ? i.value : 0), 1);
    cfg.items.forEach(it => {
      const row = document.createElement('div'); row.className = 'hbar';
      const v = isFinite(it.value) ? Math.max(0, it.value) : 0;
      row.innerHTML = `<div class="hbar-k"><span>${it.label}</span><span class="hbar-v">${(cfg.fmt || fmt.money)(it.value)}</span></div><div class="hbar-t"><div class="hbar-f" style="background:${it.color};width:0"></div></div>` + (it.note ? `<div class="hbar-n">${it.note}</div>` : '');
      host.appendChild(row);
      const f = row.querySelector('.hbar-f');
      requestAnimationFrame(() => requestAnimationFrame(() => { f.style.width = (v / max) * 100 + '%'; }));
    });
  };
  // inject hbar css
  const st = document.createElement('style');
  st.textContent = '.hbar{margin-top:.7rem}.hbar-k{display:flex;justify-content:space-between;font-size:.86rem;margin-bottom:.3rem}.hbar-v{font-variant-numeric:tabular-nums;font-weight:600}.hbar-t{height:8px;border-radius:4px;background:var(--line-soft);overflow:hidden}.hbar-f{height:100%;border-radius:4px;transition:width .8s cubic-bezier(.22,1,.36,1)}.hbar-n{font-size:.76rem;color:var(--ink-faint);margin-top:.25rem}';
  document.head.appendChild(st);

  /* ---------- Finance helpers ---------- */
  LIS.fin = {
    /* future value of monthly contributions (annuity due) plus lump sum, monthly compounding */
    fv(monthly, annualRate, months, lump) {
      const m = annualRate / 12; lump = lump || 0;
      if (months <= 0) return lump;
      if (m === 0) return lump + monthly * months;
      const g = Math.pow(1 + m, months);
      return lump * g + monthly * ((g - 1) / m) * (1 + m);
    },
    /* monthly payment needed to grow from `current` to `target` in `months` at annualRate */
    pmt(current, target, annualRate, months) {
      if (months <= 0) return Infinity;
      const m = annualRate / 12;
      if (m === 0) return (target - current) / months;
      const g = Math.pow(1 + m, months);
      return (target - current * g) / (((g - 1) / m) * (1 + m));
    },
    /* months until balance reaches target with monthly contributions (cap 1200) */
    monthsTo(current, target, monthly, annualRate) {
      if (current >= target) return 0;
      const m = annualRate / 12; let b = current, n = 0;
      while (b < target && n < 1200) { b = b * (1 + m) + monthly; n++; }
      return n >= 1200 ? Infinity : n;
    },
  };

  document.addEventListener('DOMContentLoaded', () => { LIS.share(document.querySelector('[data-share]')); });
})();
