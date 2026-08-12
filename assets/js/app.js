/* =====================================================================
   app.js — Interaktion, 3D-Scroll-Choreografie und Rechenmodelle
   ===================================================================== */
(function () {
'use strict';

/* ------------------------------ Utils ------------------------------ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp  = (a, b, t) => a + (b - a) * t;
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut   = t => 1 - Math.pow(1 - t, 3);
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const nf = (v, d = 0) => v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

/* Keyframe-Interpolation entlang [[pos, wert], …] */
function seq(p, stops) {
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, v0] = stops[i], [p1, v1] = stops[i + 1];
    if (p <= p1) return lerp(v0, v1, easeInOut(clamp((p - p0) / (p1 - p0), 0, 1)));
  }
  return stops[stops.length - 1][1];
}

/* Stunden → „2 Std. 11 Min.“ */
function fmtHours(h) {
  if (!isFinite(h) || h <= 0) return '—';
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60), mm = total % 60;
  if (hh === 0) return mm + ' Min.';
  if (mm === 0) return hh + ' Std.';
  return hh + ' Std. ' + mm + ' Min.';
}
const fmtMinutes = h => isFinite(h) && h > 0 ? '≈ ' + nf(Math.round(h * 60)) + ' Minuten' : '—';

/* Zahl groß, Einheit klein — bleibt auch in schmalen Karten einzeilig */
function fmtHoursRich(h) {
  if (!isFinite(h) || h <= 0) return '—';
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60), mm = total % 60;
  const part = (v, u) => `<span class="hv">${v}</span><span class="hu">${u}</span>`;
  if (hh === 0) return part(mm, 'Min.');
  if (mm === 0) return part(hh, 'Std.');
  return part(hh, 'Std.') + part(mm, 'Min.');
}

/* Sekunden → „2:48 Min.“ bzw. „9,4 s“ */
function fmtSeconds(s) {
  if (s < 60) return nf(s, s % 1 ? 1 : 0) + ' s';
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  return m + ':' + String(r).padStart(2, '0') + ' Min.';
}

/* SVG-Helfer */
const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
/* Winkel ab 12 Uhr im Uhrzeigersinn */
function polar(cx, cy, r, deg) {
  const a = deg * Math.PI / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}
function arcPath(cx, cy, r, a0, a1) {
  if (Math.abs(a1 - a0) < 0.02) a1 = a0 + 0.02;
  const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${(a1 - a0) > 180 ? 1 : 0} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

/* =====================================================================
   Rad (Dial)
   ===================================================================== */
const A0 = -135, A1 = 135, SWEEP = A1 - A0, CX = 130, CY = 130, R = 100;

class Dial {
  constructor(host, o) {
    this.host = host;
    this.min = o.min; this.max = o.max; this.step = o.step;
    this.value = o.value;
    this.format = o.format;
    this.onChange = o.onChange || (() => {});
    this.accent = o.accent || host.dataset.accent || '#2997ff';
    this.label = o.label || '';
    this.small = !!o.small;
    this.build();
    this.render(true);
  }

  build() {
    const h = this.host;
    h.style.setProperty('--acc', this.accent);
    h.setAttribute('role', 'slider');
    h.setAttribute('tabindex', '0');
    h.setAttribute('aria-label', this.label);
    h.setAttribute('aria-valuemin', this.min);
    h.setAttribute('aria-valuemax', this.max);

    const svg = svgEl('svg', { viewBox: '0 0 260 260' });
    svg.appendChild(svgEl('circle', { class: 'dial__hit', cx: CX, cy: CY, r: 128 }));

    const ticks = svgEl('g', { class: 'dial__ticks' });
    this.ticks = [];
    const N = 29;
    for (let i = 0; i < N; i++) {
      const a = A0 + SWEEP * (i / (N - 1));
      const p1 = polar(CX, CY, 114, a), p2 = polar(CX, CY, 122, a);
      const t = svgEl('line', { class: 'dial__tick', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      ticks.appendChild(t); this.ticks.push(t);
    }
    svg.appendChild(ticks);

    svg.appendChild(svgEl('path', { class: 'dial__track', d: arcPath(CX, CY, R, A0, A1) }));
    this.prog = svgEl('path', { class: 'dial__prog', d: '' });
    svg.appendChild(this.prog);

    this.ring = svgEl('circle', { class: 'dial__knobring', cx: CX, cy: CY - R, r: 17 });
    this.knob = svgEl('circle', { class: 'dial__knob', cx: CX, cy: CY - R, r: 11 });
    svg.appendChild(this.ring); svg.appendChild(this.knob);

    this.tVal  = svgEl('text', { class: 'dial__val' + (this.small ? ' dial__val--sm' : ''), x: CX, y: this.small ? 130 : 136 });
    this.tUnit = svgEl('text', { class: 'dial__unit', x: CX, y: this.small ? 154 : 160 });
    this.tCap  = svgEl('text', { class: 'dial__cap',  x: CX, y: this.small ? 178 : 184 });
    svg.appendChild(this.tVal); svg.appendChild(this.tUnit); svg.appendChild(this.tCap);

    h.appendChild(svg);
    this.svg = svg;

    /* Zeiger */
    const move = e => { if (this.dragging) { e.preventDefault(); this.fromPointer(e); } };
    svg.addEventListener('pointerdown', e => {
      if (this.distFromCenter(e) < 58) return;   // Mitte bleibt lesbar, ohne den Wert zu verstellen
      this.dragging = true; h.classList.add('is-drag');
      svg.setPointerCapture(e.pointerId); this.fromPointer(e); h.focus();
    });
    svg.addEventListener('pointermove', move);
    const up = e => {
      if (!this.dragging) return;
      this.dragging = false; h.classList.remove('is-drag');
      try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);

    /* Mausrad nur bei Fokus — sonst scrollt die Seite normal weiter */
    h.addEventListener('wheel', e => {
      if (document.activeElement !== h) return;
      e.preventDefault();
      this.set(this.value - Math.sign(e.deltaY) * this.step);
    }, { passive: false });

    /* Tastatur */
    h.addEventListener('keydown', e => {
      const k = e.key;
      let v = null;
      if (k === 'ArrowRight' || k === 'ArrowUp')   v = this.value + this.step;
      if (k === 'ArrowLeft'  || k === 'ArrowDown') v = this.value - this.step;
      if (k === 'PageUp')   v = this.value + this.step * 5;
      if (k === 'PageDown') v = this.value - this.step * 5;
      if (k === 'Home') v = this.min;
      if (k === 'End')  v = this.max;
      if (v !== null) { e.preventDefault(); this.set(v); }
    });
  }

  center() {
    const r = this.svg.getBoundingClientRect();
    return { x: r.left + r.width * (CX / 260), y: r.top + r.height * (CY / 260), s: r.width / 260 };
  }

  distFromCenter(e) {
    const c = this.center();
    return Math.hypot(e.clientX - c.x, e.clientY - c.y) / (c.s || 1);
  }

  fromPointer(e) {
    const c = this.center();
    const cx = c.x, cy = c.y;
    let a = Math.atan2(e.clientX - cx, cy - e.clientY) * 180 / Math.PI;
    if (a < A0 - 22 || a > 180) a = A0;            // toter Winkel unten links
    else if (a > A1 + 22 && a <= 180) a = A1;
    a = clamp(a, A0, A1);
    this.set(this.min + (a - A0) / SWEEP * (this.max - this.min));
  }

  set(v, silent) {
    v = clamp(Math.round(v / this.step) * this.step, this.min, this.max);
    v = Math.round(v * 1000) / 1000;
    if (v === this.value) { this.render(); return; }
    this.value = v;
    this.render();
    if (!silent) this.onChange(v);
  }

  render(init) {
    const t = (this.value - this.min) / (this.max - this.min);
    const a = A0 + SWEEP * t;
    this.prog.setAttribute('d', arcPath(CX, CY, R, A0, a));
    const k = polar(CX, CY, R, a);
    this.knob.setAttribute('cx', k.x); this.knob.setAttribute('cy', k.y);
    this.ring.setAttribute('cx', k.x); this.ring.setAttribute('cy', k.y);
    this.ticks.forEach((el, i) => el.classList.toggle('is-on', i / (this.ticks.length - 1) <= t + 0.001));

    const f = this.format(this.value);
    this.tVal.textContent  = f.big;
    this.tUnit.textContent = f.unit || '';
    this.tCap.textContent  = f.cap || '';
    this.host.setAttribute('aria-valuenow', this.value);
    this.host.setAttribute('aria-valuetext', f.aria || (f.big + ' ' + (f.unit || '')));
    if (init) this.host.dataset.ready = '1';
  }
}

/* =====================================================================
   KAPITEL 02 — Performance
   ===================================================================== */
const perfState = { i: 1 };

function perfValue(load, dev) {
  const v = load[dev];
  return load.fmt === 'time' ? fmtSeconds(v) : nf(v);
}

function renderPerf() {
  const L = PERF_LOADS[perfState.i];
  $('#wlName').textContent = L.label;
  $('#wlNote').textContent = L.note;

  /* Balkenlänge bildet immer den echten Messwert ab — bei Zeiten heißt
     „länger“ deshalb „langsamer“. Die Skalenzeile darüber sagt, was gilt. */
  const mx = Math.max(L.air, L.pro);
  $('.bar__fill--air').style.width = (26 + 74 * (L.air / mx)) + '%';
  $('.bar__fill--pro').style.width = (26 + 74 * (L.pro / mx)) + '%';
  $('#perfScale').textContent = L.dir === 'up'
    ? `Gemessen in ${L.unit} — mehr ist besser.`
    : `Gemessen als benötigte Zeit — weniger ist besser.`;

  const airWin = L.dir === 'up' ? L.air > L.pro : L.air < L.pro;
  $('#perfAirVal').textContent = perfValue(L, 'air');
  $('#perfProVal').textContent = perfValue(L, 'pro');
  $('#perfAirVal').classList.toggle('is-win', airWin);
  $('#perfProVal').classList.toggle('is-win', !airWin);

  const faster = L.dir === 'up' ? L.pro / L.air : L.air / L.pro;
  const pct = Math.round((faster - 1) * 100);
  const winner = pct >= 0 ? 'iPad Pro' : 'iPad Air';
  const abs = Math.abs(pct);
  $('#perfVerdict').innerHTML =
    `<b>${winner} 11″</b> liegt hier <span class="up">${abs} %</span> vorn` +
    (L.dir === 'down' ? ` und ist nach <b>${perfValue(L, pct >= 0 ? 'pro' : 'air')}</b> fertig.` : '.') +
    ` ${L.real}`;

  $$('#wlChips .chip').forEach((c, i) => {
    c.classList.toggle('is-on', i === perfState.i);
    c.setAttribute('aria-selected', i === perfState.i);
  });
}

function initPerf() {
  const chips = $('#wlChips');
  PERF_LOADS.forEach((L, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = L.label;
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => { perfState.i = i; dialW.set(i, true); renderPerf(); });
    chips.appendChild(b);
  });

  const dialW = new Dial($('#dialWorkload'), {
    min: 0, max: PERF_LOADS.length - 1, step: 1, value: perfState.i,
    label: 'Aufgabe für den Leistungsvergleich', accent: '#2997ff',
    format: v => ({
      big: String(v + 1).padStart(2, '0'),
      unit: 'Aufgabe',
      cap: 'von ' + String(PERF_LOADS.length).padStart(2, '0'),
      aria: PERF_LOADS[v].label
    }),
    onChange: v => { perfState.i = v; renderPerf(); }
  });

  renderPerf();
  drawSustain();
}

/* Dauerleistungs-Diagramm */
function drawSustain() {
  const svg = $('#sustainChart');
  if (!svg) return;
  svg.textContent = '';
  const W = 640, H = 260, L = 46, Rp = 14, T = 14, B = 34;
  const x = m => L + (m / 20) * (W - L - Rp);
  const y = v => T + (1 - (v - 60) / 40) * (H - T - B);

  [60, 70, 80, 90, 100].forEach(v => {
    svg.appendChild(svgEl('line', { class: 'ch-grid', x1: L, y1: y(v), x2: W - Rp, y2: y(v) }));
    const t = svgEl('text', { class: 'ch-axis', x: L - 8, y: y(v) + 4, 'text-anchor': 'end' });
    t.textContent = v + '%'; svg.appendChild(t);
  });
  [0, 5, 10, 15, 20].forEach(m => {
    const t = svgEl('text', { class: 'ch-axis', x: x(m), y: H - 10, 'text-anchor': 'middle' });
    t.textContent = m + ' Min.'; svg.appendChild(t);
  });

  ['air', 'pro'].forEach(k => {
    const s = DEV[k].perf.sustain * 100;
    let d = '';
    for (let m = 0; m <= 20; m += 0.5) {
      const v = 100 - (100 - s) * (1 - Math.exp(-m / 3.4));
      d += (m === 0 ? 'M' : 'L') + x(m).toFixed(1) + ' ' + y(v).toFixed(1) + ' ';
    }
    svg.appendChild(svgEl('path', { class: 'ch-line ch-line--' + k, d }));
  });
}

/* =====================================================================
   KAPITEL 03 — Laufzeit
   ===================================================================== */
const USE_SHORT = { read: 'Lesen', web: 'Web & Mail', video: 'Video HDR', edit: 'Schnitt', game: 'Gaming', ai: 'KI lokal' };
const rtState = { bright: 40, use: 1, dark: false };

/* Leistungsaufnahme in Watt */
function drawPower(dev, load, bright01, dark) {
  let disp;
  if (dev.key === 'air') {
    disp = (dev.dispBase + dev.dispGain * bright01) * (dark ? 0.97 : 1);
  } else {
    disp = (dev.dispBase + dev.dispGain * bright01) * load.oled * (dark ? 0.55 : 1) + load.hz;
  }
  return disp + dev.socBase * load.soc + 0.12;
}
const runtimeH = (dev, load, b, dark) => dev.battery.wh / drawPower(dev, load, b, dark);

function renderRuntime() {
  const b = rtState.bright / 100, L = USE_LOADS[rtState.use], dark = rtState.dark;
  const ra = runtimeH(DEV.air, L, b, dark), rp = runtimeH(DEV.pro, L, b, dark);
  const mx = Math.max(ra, rp);

  $('#rtAir').innerHTML = fmtHoursRich(ra);
  $('#rtPro').innerHTML = fmtHoursRich(rp);
  $('#rtAirMin').textContent = fmtMinutes(ra);
  $('#rtProMin').textContent = fmtMinutes(rp);
  $('#rtAirBar').style.width = (ra / mx * 100) + '%';
  $('#rtProBar').style.width = (rp / mx * 100) + '%';
  $('#rtAirDraw').textContent = 'Leistungsaufnahme ≈ ' + nf(drawPower(DEV.air, L, b, dark), 2) + ' W · '
    + Math.round(DEV.air.display.maxNits * b) + ' Nits';
  $('#rtProDraw').textContent = 'Leistungsaufnahme ≈ ' + nf(drawPower(DEV.pro, L, b, dark), 2) + ' W · '
    + Math.round(DEV.pro.display.maxNits * b) + ' Nits';

  $('#usageNote').innerHTML = `<b>${L.label}</b> — ${L.note}`;

  const diff = Math.round(Math.abs(ra - rp) * 60);
  const win = ra > rp ? 'iPad Air' : 'iPad Pro';
  let txt = diff < 8
    ? `Bei dieser Einstellung ist es ein <b>Gleichstand</b> — der Unterschied liegt unter zehn Minuten.`
    : `<b>${win} 11″</b> hält <span class="up">${fmtHours(diff / 60)}</span> länger durch.`;
  if (L.soc >= 3) {
    txt += ` Wichtig bei Volllast: Reine Stunden sind hier die falsche Währung. Das iPad Pro zieht zwar mehr Leistung, erledigt dieselbe Arbeit aber rund ${Math.round((DEV.pro.perf.mt / DEV.air.perf.mt - 1) * 100)} % schneller — pro erledigter Aufgabe liegt es trotz kürzerer Laufzeit vorn.`;
  }
  if (dark) txt += ' Der dunkle Modus spielt dem Tandem-OLED des iPad Pro direkt in die Karten: abgeschaltete Pixel verbrauchen keinen Strom.';
  else if (rtState.bright > 70) txt += ' Bei hoher Helligkeit und hellen Inhalten holt das IPS-Panel des iPad Air auf, weil seine Hintergrundbeleuchtung unabhängig vom Bildinhalt arbeitet.';
  else txt += ' ' + L.note;
  $('#rtVerdict').innerHTML = txt;

  /* Tabelle aller Szenarien */
  const tb = $('#rtTable tbody');
  tb.textContent = '';
  USE_LOADS.forEach((l, i) => {
    const a = runtimeH(DEV.air, l, b, dark), p = runtimeH(DEV.pro, l, b, dark);
    const d = Math.round((Math.max(a, p) / Math.min(a, p) - 1) * 100);
    const tr = document.createElement('tr');
    if (i === rtState.use) tr.className = 'is-active';
    tr.innerHTML =
      `<td>${l.label}</td>` +
      `<td class="${a > p ? 'win' : ''}">${fmtHours(a)}</td>` +
      `<td class="${p > a ? 'win' : ''}">${fmtHours(p)}</td>` +
      `<td>${d === 0 ? 'gleichauf' : `+${d} % für ${a > p ? 'Air' : 'Pro'}`}</td>`;
    tb.appendChild(tr);
  });
}

function initRuntime() {
  const dialB = new Dial($('#dialBrightness'), {
    min: 10, max: 100, step: 5, value: rtState.bright,
    label: 'Displayhelligkeit', accent: '#ff9f0a',
    format: v => ({ big: String(v), unit: '%', cap: 'Helligkeit', aria: v + ' Prozent Helligkeit' }),
    onChange: v => { rtState.bright = v; renderRuntime(); }
  });
  const dialU = new Dial($('#dialUsage'), {
    min: 0, max: USE_LOADS.length - 1, step: 1, value: rtState.use,
    label: 'Nutzungsszenario', accent: '#30d158',
    format: v => ({
      big: String(v + 1).padStart(2, '0'), unit: 'Szenario',
      cap: 'von ' + String(USE_LOADS.length).padStart(2, '0'), aria: USE_LOADS[v].label
    }),
    onChange: v => { rtState.use = v; renderRuntime(); }
  });
  void dialB; void dialU;

  $('#darkToggle').addEventListener('change', e => { rtState.dark = e.target.checked; renderRuntime(); });
  renderRuntime();
}

/* =====================================================================
   KAPITEL 04 — Laden
   ===================================================================== */
const EFF = 0.85, STANDBY = 0.12, USE_DRAW = 3.4, TAPER_FRAC = 0.42;
const TAPER_CAP = { air: 10, pro: 11 };
const chState = { w: 20, inUse: false };

function wattClass(w) {
  if (w < 3)  return 'Notladung am USB-Port';
  if (w < 7.5) return 'altes 5-W-Netzteil';
  if (w < 13) return 'Powerbank-Klasse';
  if (w < 19) return 'kompaktes USB-C-Netzteil';
  if (w < 23) return 'Beipack-Netzteil';
  if (w < 33) return 'Schnellladen';
  if (w < 46) return 'volle Ladeleistung';
  return 'überdimensioniert';
}

function chargeModel(dev, watts, inUse) {
  const delivered = Math.min(watts, dev.battery.maxIn) * EFF;
  const net = delivered - STANDBY - (inUse ? USE_DRAW : 0);
  if (net <= 0.05) return { ok: false, net, capped: watts > dev.battery.maxIn };
  const wh = dev.battery.wh;
  const t80  = (0.8 * wh) / net;
  const taperW = Math.min(net * TAPER_FRAC, TAPER_CAP[dev.key]);
  const tTail = (0.2 * wh) / taperW;
  return {
    ok: true, net, capped: watts > dev.battery.maxIn,
    t50: (0.5 * wh) / net, t80, t100: t80 + tTail, tau: tTail / 5.3
  };
}
function chargePct(m, t) {
  if (!m.ok) return 0;
  if (t <= m.t80) return (t / m.t80) * 80;
  return 80 + 20 * (1 - Math.exp(-(t - m.t80) / m.tau));
}

function renderCharge() {
  const w = chState.w, u = chState.inUse;
  const ma = chargeModel(DEV.air, w, u), mp = chargeModel(DEV.pro, w, u);

  $('#wattName').textContent = (w % 1 ? nf(w, 1) : w) + ' W · ' + wattClass(w);
  const hints = [];
  if (w > DEV.air.battery.maxIn) hints.push('Das iPad Air nimmt maximal ≈ 30 W auf — darüber bleibt seine Ladezeit konstant.');
  if (w > DEV.pro.battery.maxIn) hints.push('Auch das iPad Pro deckelt bei ≈ 38 W.');
  if (w <= 5) hints.push('Unterhalb von 5 W wird geladen, aber sehr langsam — der Standby-Eigenverbrauch frisst einen Teil der Energie auf.');
  if (u) hints.push('Bei Nutzung gehen rund 3,4 W für Display und Rechenwerk ab, bevor der Akku überhaupt Energie sieht.');
  $('#wattNote').textContent = hints.length ? hints.join(' ') : 'Beide iPads können diese Leistung vollständig abrufen.';

  const set = (pre, m) => {
    $('#ch' + pre).innerHTML = m.ok ? fmtHoursRich(m.t100) : '<span class="pill pill--bad">lädt nicht</span>';
    $('#ch' + pre + '50').textContent  = m.ok ? fmtHours(m.t50)  : '—';
    $('#ch' + pre + '80').textContent  = m.ok ? fmtHours(m.t80)  : '—';
    $('#ch' + pre + '100').textContent = m.ok ? fmtHours(m.t100) : '—';
  };
  set('Air', ma); set('Pro', mp);

  let v;
  if (!ma.ok && !mp.ok) {
    v = `Bei <b>${w} W</b> und gleichzeitiger Nutzung reicht die Energie nicht einmal für den laufenden Betrieb — <span class="down">beide iPads entladen sich trotz angeschlossenem Netzteil</span>.`;
  } else if (!ma.ok || !mp.ok) {
    v = `Bei <b>${w} W</b> lädt nur das <b>${ma.ok ? 'iPad Air' : 'iPad Pro'}</b>. Das andere Gerät verbraucht im Betrieb mehr, als nachfließt.`;
  } else {
    const d = Math.round(Math.abs(ma.t100 - mp.t100) * 60);
    const faster = mp.t100 < ma.t100 ? 'iPad Pro' : 'iPad Air';
    v = d < 5
      ? `Bei <b>${w} W</b> laden beide praktisch gleich schnell — der Unterschied liegt unter fünf Minuten.`
      : `Bei <b>${w} W</b> ist das <b>${faster} 11″</b> <span class="up">${fmtHours(d / 60)}</span> früher voll.`;
    if (w >= 40) v += ' Oberhalb von 38 W bringt ein stärkeres Netzteil keinem der beiden Geräte noch etwas.';
    else if (w >= 30) v += ' Hier zieht das iPad Pro davon: Es ruft mehr Leistung ab, während das Air bereits an seiner Grenze arbeitet.';
    else if (w <= 10) v += ' In dieser Klasse zählt fast nur die Kapazität — das größere Pro-Akkupaket braucht entsprechend länger.';
  }
  $('#chVerdict').innerHTML = v;

  $$('#wattChips .chip').forEach(c => c.classList.toggle('is-on', Number(c.dataset.w) === w));
  $$('#wattTable tbody tr').forEach(tr => tr.classList.toggle('is-active', Number(tr.dataset.w) === w));
  drawChargeChart(ma, mp);
}

function drawChargeChart(ma, mp) {
  const svg = $('#chargeChart');
  svg.textContent = '';
  const W = 720, H = 320, L = 54, Rp = 18, T = 18, B = 42;
  const tMax = Math.max(ma.ok ? ma.t100 : 1, mp.ok ? mp.t100 : 1) * 1.04;
  const x = t => L + (t / tMax) * (W - L - Rp);
  const y = v => T + (1 - v / 100) * (H - T - B);

  const defs = svgEl('defs', {});
  [['gAir', '#2997ff'], ['gPro', '#bf5af2']].forEach(([id, c]) => {
    const g = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    g.appendChild(svgEl('stop', { offset: '0%',   'stop-color': c, 'stop-opacity': .55 }));
    g.appendChild(svgEl('stop', { offset: '100%', 'stop-color': c, 'stop-opacity': 0 }));
    defs.appendChild(g);
  });
  svg.appendChild(defs);

  [0, 25, 50, 75, 100].forEach(v => {
    svg.appendChild(svgEl('line', { class: 'ch-grid', x1: L, y1: y(v), x2: W - Rp, y2: y(v) }));
    const t = svgEl('text', { class: 'ch-axis', x: L - 9, y: y(v) + 4, 'text-anchor': 'end' });
    t.textContent = v + ' %'; svg.appendChild(t);
  });
  for (let i = 0; i <= 4; i++) {
    const tv = tMax * i / 4;
    const t = svgEl('text', { class: 'ch-axis', x: x(tv), y: H - 12, 'text-anchor': 'middle' });
    t.textContent = tv < 1.2 ? Math.round(tv * 60) + ' Min.' : nf(tv, 1) + ' Std.';
    svg.appendChild(t);
  }

  [['air', ma], ['pro', mp]].forEach(([k, m]) => {
    if (!m.ok) return;
    let d = '', N = 90;
    for (let i = 0; i <= N; i++) {
      const t = m.t100 * i / N;
      d += (i === 0 ? 'M' : 'L') + x(t).toFixed(1) + ' ' + y(chargePct(m, t)).toFixed(1) + ' ';
    }
    svg.appendChild(svgEl('path', { class: 'ch-area--' + k, d: d + `L ${x(m.t100).toFixed(1)} ${y(0)} L ${x(0)} ${y(0)} Z` }));
    svg.appendChild(svgEl('path', { class: 'ch-line ch-line--' + k, d }));
    svg.appendChild(svgEl('circle', { cx: x(m.t100), cy: y(100), r: 5, fill: k === 'air' ? '#2997ff' : '#bf5af2' }));
  });

  svg.appendChild(svgEl('line', { class: 'ch-grid ch-mark', x1: L, y1: y(80), x2: W - Rp, y2: y(80), stroke: 'rgba(255,255,255,.28)' }));
  const lbl = svgEl('text', { class: 'ch-lbl', x: W - Rp, y: y(80) - 8, 'text-anchor': 'end' });
  lbl.textContent = '80 % — ab hier drosselt die Ladeelektronik';
  svg.appendChild(lbl);

  if (!ma.ok && !mp.ok) {
    const note = svgEl('text', { class: 'ch-lbl', x: (L + W - Rp) / 2, y: y(45), 'text-anchor': 'middle' });
    note.textContent = 'Keine Ladekurve — der Verbrauch übersteigt die zugeführte Leistung.';
    svg.appendChild(note);
  }
}

function ratePill(h) {
  if (!isFinite(h)) return '<span class="pill pill--bad">reicht nicht</span>';
  if (h > 12) return '<span class="pill pill--bad">Notladung</span>';
  if (h > 6)  return '<span class="pill pill--bad">sehr langsam</span>';
  if (h > 3)  return '<span class="pill pill--warn">langsam</span>';
  if (h > 2)  return '<span class="pill pill--ok">solide</span>';
  return '<span class="pill pill--top">schnell</span>';
}

function initCharge() {
  const chips = $('#wattChips');
  WATT_PRESETS.forEach(p => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = p.t; b.dataset.w = p.w;
    b.addEventListener('click', () => { chState.w = p.w; dial.set(p.w, true); renderCharge(); });
    chips.appendChild(b);
  });

  const dial = new Dial($('#dialWatt'), {
    min: 1, max: 60, step: 0.5, value: chState.w,
    label: 'Ladeleistung des Netzteils in Watt', accent: '#2997ff',
    format: v => ({ big: v % 1 ? nf(v, 1) : String(v), unit: 'Watt', cap: 'Netzteil', aria: v + ' Watt' }),
    onChange: v => { chState.w = v; renderCharge(); }
  });

  $('#useToggle').addEventListener('change', e => { chState.inUse = e.target.checked; renderCharge(); });

  /* Ladetabelle 1 W – 60 W */
  const tb = $('#wattTable tbody');
  WATT_STEPS.forEach(w => {
    const ma = chargeModel(DEV.air, w, false), mp = chargeModel(DEV.pro, w, false);
    const tr = document.createElement('tr');
    tr.dataset.w = w;
    tr.innerHTML =
      `<td>${w % 1 ? nf(w, 1) : w} W</td>` +
      `<td class="${ma.ok && mp.ok && ma.t100 < mp.t100 ? 'win' : ''}">${fmtHours(ma.t100)}${ma.capped ? ' <span class="muted">(gedeckelt)</span>' : ''}</td>` +
      `<td class="${ma.ok && mp.ok && mp.t100 < ma.t100 ? 'win' : ''}">${fmtHours(mp.t100)}${mp.capped ? ' <span class="muted">(gedeckelt)</span>' : ''}</td>` +
      `<td>${fmtHours(mp.t50)}</td>` +
      `<td>${ratePill(mp.t100)}</td>`;
    tr.addEventListener('click', () => { chState.w = w; dial.set(w, true); renderCharge(); });
    tr.style.cursor = 'pointer';
    tb.appendChild(tr);
  });

  renderCharge();
}

/* =====================================================================
   KAPITEL 05 — Unterschiede
   ===================================================================== */
const diffState = { cat: 'Alle', only: true };

function renderDiffs() {
  const body = $('#diffBody');
  body.textContent = '';
  const rows = DIFFS.filter(d =>
    (diffState.cat === 'Alle' || d.cat === diffState.cat) &&
    (!diffState.only || d.win !== 'tie')
  );
  rows.forEach(d => {
    const row = document.createElement('div');
    row.className = 'diffrow';
    const badge = d.proj ? ' <span class="proj-badge">Prognose</span>' : '';
    row.innerHTML =
      `<div class="diffrow__k">${d.k}<span class="diffrow__cat">${d.cat}</span></div>` +
      `<div class="diffrow__v ${d.win === 'air' ? 'is-win' : ''}">${d.air}${badge}</div>` +
      `<div class="diffrow__v ${d.win === 'pro' ? 'is-win' : ''}">${d.pro}` +
        (d.note ? `<small>${d.note}</small>` : '') + `</div>`;
    body.appendChild(row);
  });
  $('#diffEmpty').hidden = rows.length > 0;
  $$('#catChips .chip').forEach(c => c.classList.toggle('is-on', c.dataset.cat === diffState.cat));
}

function initDiffs() {
  const cats = ['Alle', ...Array.from(new Set(DIFFS.map(d => d.cat)))];
  const box = $('#catChips');
  cats.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = c; b.dataset.cat = c;
    b.addEventListener('click', () => { diffState.cat = c; renderDiffs(); });
    box.appendChild(b);
  });
  $('#diffOnly').addEventListener('change', e => { diffState.only = e.target.checked; renderDiffs(); });
  renderDiffs();
}

/* =====================================================================
   KAPITEL 06 — Empfehlung
   ===================================================================== */
const WLABELS = ['egal', 'nett', 'wichtig', 'entscheidend'];
const wState = {};

function renderAdvisor() {
  let score = 0, range = 0;
  const drivers = [];
  WEIGHTS.forEach(w => {
    const v = wState[w.id];
    score += v * w.bias;
    range += v * Math.abs(w.bias);
    if (v > 0) drivers.push({ w, impact: v * Math.abs(w.bias), dir: w.bias > 0 ? 'pro' : 'air' });
  });
  const ratio = range > 0 ? score / range : 0;
  const proPct = Math.round((ratio + 1) / 2 * 100);

  $('#scaleFill').style.left = proPct + '%';
  $('#scorePro').textContent = proPct + ' %';
  $('#scoreAir').textContent = (100 - proPct) + ' %';

  drivers.sort((a, b) => b.impact - a.impact);
  const list = arr => arr.slice(0, 3).map(d => d.w.label).join(', ');
  const proTop = drivers.filter(d => d.dir === 'pro');
  const airTop = drivers.filter(d => d.dir === 'air');

  let pick, why;
  if (!drivers.length) {
    pick = 'Noch keine Gewichtung';
    why = 'Zieh mindestens einen Regler nach rechts — je nachdem, was dir wichtig ist, ändert sich die Empfehlung.';
  } else if (proPct >= 62) {
    pick = 'iPad Pro 11″ (2025)';
    why = `Deine Schwerpunkte (${list(proTop)}) liegen genau dort, wo das iPad Pro real vorlegt: ${proTop[0].w.why}. Der Aufpreis von rund 400 € ist in deinem Profil gerechtfertigt.`;
  } else if (proPct <= 38) {
    pick = 'iPad Air 11″ (2026)';
    why = `Dein Profil (${list(airTop.length ? airTop : drivers)}) spricht klar für das Air: ${(airTop[0] || drivers[0]).w.why}. Die Stärken des Pro zahlen bei dir kaum ein — der Aufpreis wäre schwer zu begründen.`;
  } else {
    pick = 'Knapp — im Zweifel das iPad Air';
    why = `Dein Profil (${list(drivers)}) liegt fast in der Mitte. In solchen Fällen ist das iPad Air die vernünftigere Wahl: Du sparst rund 400 €, und die 120 Hz des Pro sind der einzige Punkt, den du täglich wirklich vermissen könntest.`;
  }
  $('#advPick').textContent = pick;
  $('#advWhy').textContent = why;
}

function initAdvisor() {
  const list = $('#weightList');
  WEIGHTS.forEach(w => {
    wState[w.id] = w.def;
    const row = document.createElement('div');
    row.className = 'wrow';
    row.innerHTML =
      `<div class="wrow__top"><b>${w.label}</b><span id="wl-${w.id}">${WLABELS[w.def]}</span></div>` +
      `<input type="range" min="0" max="3" step="1" value="${w.def}" aria-label="${w.label} gewichten">`;
    const input = row.querySelector('input');
    input.addEventListener('input', () => {
      wState[w.id] = Number(input.value);
      $('#wl-' + w.id).textContent = WLABELS[wState[w.id]];
      renderAdvisor();
    });
    list.appendChild(row);
  });
  $('#advReset').addEventListener('click', () => {
    WEIGHTS.forEach(w => {
      wState[w.id] = w.def;
      const inp = list.querySelectorAll('input')[WEIGHTS.indexOf(w)];
      inp.value = w.def;
      $('#wl-' + w.id).textContent = WLABELS[w.def];
    });
    renderAdvisor();
  });
  renderAdvisor();
}

/* =====================================================================
   HERO — 3D-Choreografie beim Scrollen
   ===================================================================== */
function initHero() {
  const track  = $('#heroTrack');
  const stage  = $('#stage');
  const inner  = $('#stageInner');
  const hint   = $('#heroHint');
  const phases = $$('.phase');
  const rigs   = { air: $('.rig[data-rig="air"]'), pro: $('.rig[data-rig="pro"]') };
  const devs   = { air: rigs.air.querySelector('.device'), pro: rigs.pro.querySelector('.device') };
  const blobs  = $$('.blob');

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!REDUCED && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', e => {
      pointer.tx = (e.clientX / window.innerWidth - .5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - .5) * 2;
    }, { passive: true });
  }

  let p = 0;

  function measure() {
    const rect = track.getBoundingClientRect();
    const total = Math.max(1, track.offsetHeight - window.innerHeight);
    p = clamp(-rect.top / total, 0, 1);
  }

  function paint() {
    /* Drehung: Front → Kante (Dickenvergleich) → Rückseite → Front */
    const rot = seq(p, [
      [0.00,   0], [0.14,   0],
      [0.30,  90], [0.40,  90],
      [0.58, 180], [0.68, 180],
      [0.90, 360], [1.00, 368]
    ]);
    const tilt   = seq(p, [[0, 5], [0.2, -2], [0.6, 3], [1, 0]]);
    const spread = seq(p, [[0, 0.90], [0.24, 1], [0.84, 1], [1, 1.26]]);
    const scale  = seq(p, [[0, 0.98], [0.3, 1], [0.84, 1], [1, 0.93]]);
    const lift   = seq(p, [[0, 16], [0.25, 0], [1, -8]]);

    /* Steht das Gerät hochkant zum Betrachter, wird die Bauhöhe überhöht,
       damit der Dickenunterschied überhaupt sichtbar wird. Das Verhältnis
       6,1 : 5,3 bleibt dabei erhalten. */
    const edge  = Math.abs(Math.sin(rot * Math.PI / 180));
    const boost = 1 + 6.2 * Math.pow(edge, 4);
    rigs.air.style.setProperty('--dboost', boost.toFixed(3));
    rigs.pro.style.setProperty('--dboost', boost.toFixed(3));

    pointer.x += (pointer.tx - pointer.x) * 0.07;
    pointer.y += (pointer.ty - pointer.y) * 0.07;

    const gap = window.innerWidth < 700 ? 42 : 140;
    const off = gap * (spread - 1);

    rigs.air.style.transform = `translate3d(${-off}px,${lift}px,0) scale(${scale})`;
    rigs.pro.style.transform = `translate3d(${off}px,${lift}px,0) scale(${scale})`;
    devs.air.style.transform = `rotateX(${tilt + pointer.y * -3}deg) rotateY(${rot + 17 + pointer.x * 5}deg) rotateZ(${-1.5 + p * 1.5}deg)`;
    devs.pro.style.transform = `rotateX(${tilt + pointer.y * -3}deg) rotateY(${rot - 17 + pointer.x * 5}deg) rotateZ(${1.5 - p * 1.5}deg)`;

    blobs.forEach((b, i) => {
      const s = (i + 1) * 26;
      b.style.transform = `translate3d(${pointer.x * s - p * s * 1.4}px,${pointer.y * s + p * s}px,0)`;
    });

    /* Textphasen */
    const active = p < 0.22 ? 0 : p < 0.46 ? 1 : p < 0.72 ? 2 : 3;
    phases.forEach((el, i) => el.classList.toggle('is-active', i === active));

    stage.classList.toggle('show-tags', p > 0.84);
    hint.classList.toggle('is-gone', p > 0.03);
  }

  if (REDUCED) {
    measure();
    devs.air.style.transform = 'rotateY(14deg)';
    devs.pro.style.transform = 'rotateY(-14deg)';
    stage.classList.add('show-tags');
    return;
  }

  /* Nur zeichnen, solange die Bühne sichtbar ist */
  (function loop() {
    const r = track.getBoundingClientRect();
    if (r.bottom > -60 && r.top < window.innerHeight + 60) { measure(); paint(); }
    requestAnimationFrame(loop);
  })();
}

/* =====================================================================
   Scroll-Effekte: Reveal, Zähler, Navigation
   ===================================================================== */
function initReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((ents) => {
    ents.forEach(en => {
      if (!en.isIntersecting) return;
      const sibs = Array.from(en.target.parentElement.children).filter(c => c.classList.contains('reveal'));
      en.target.style.setProperty('--d', (sibs.indexOf(en.target) % 4) * 0.09 + 's');
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  /* threshold 0: sehr hohe Blöcke erreichen nie einen hohen Sichtbarkeitsanteil */
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  els.forEach(e => io.observe(e));
}

function initCounters() {
  const els = $$('.count');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(ents => {
    ents.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, to = parseFloat(el.dataset.to), dec = Number(el.dataset.dec || 0);
      const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
      const t0 = performance.now(), dur = REDUCED ? 1 : 1400;
      (function tick(now) {
        const t = clamp((now - t0) / dur, 0, 1);
        el.innerHTML = pre + nf(to * easeOut(t), dec) + suf;
        if (t < 1) requestAnimationFrame(tick);
      })(t0);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  els.forEach(e => io.observe(e));
}

function initNav() {
  const nav = $('#nav'), prog = $('#navProgress');
  const links = $$('.nav__links a');
  let last = window.scrollY;

  function update() {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = clamp(y / Math.max(1, h), 0, 1) * 100 + '%';
    nav.classList.toggle('is-hidden', y > last && y > 520);
    last = y;
  }
  window.addEventListener('scroll', update, { passive: true });
  update();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(ents => {
      ents.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
  }
}

/* ------------------------------ Start ------------------------------ */
function boot() {
  initHero();
  initPerf();
  initRuntime();
  initCharge();
  initDiffs();
  initAdvisor();
  initReveal();
  initCounters();
  initNav();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
