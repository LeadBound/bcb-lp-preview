/* v2-aisle: the hall takes the light of the booth in front of you.
   Bespoke page code (no engine). One rAF loop reads scrollY once and writes transforms + 3 CSS vars. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- colour: sampled hex -> the light it throws ---------- */
  const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function lift([r, g, b]) {           // keep the hue, raise lightness so a dim sample still lights a dark hall
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    l = Math.max(l, .56); s = Math.min(1, Math.max(s, .55));
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
  }
  const ZERO = '#18e9d9', OCHRE = '#f0b429';
  const LZERO = hex2rgb(ZERO), LOCHRE = hex2rgb(OCHRE);

  /* ---------- projects (real folders; counts from manifest.json) ---------- */
  const C = 'assets/cyber/';
  const seq = (f, n) => Array.from({ length: n }, (_, i) => f + '-' + (i + 1));
  const PROJ = {
    zero: { t: 'Zero Networks, Black Hat USA 2025', c: ZERO, imgs: seq('black-hat-lv-2025-zero', 7) },
    novee: { t: 'Novee, Black Hat USA 2026', c: '#6048a0', imgs: seq('black-hat-2026-novee', 8) },
    astelia: { t: 'Astelia, Black Hat USA 2026', c: '#4a8822', imgs: seq('black-hat-2026-astelia', 5) },
    cognyte: { t: 'Cognyte, ISS World 2024', c: '#5967a5', imgs: seq('iss-dubai-2024-cognyte', 3) },
    pentera: { t: 'Pentera, Cybertech 2023 and GISEC 2023', c: '#cb7e27', imgs: [...seq('cybertech-2023-pentera', 3), ...seq('gices-2023-dubai-pentera', 5)] },
    ox: { t: 'OX Security, RSAC 2026', c: '#4c5193', imgs: seq('rsa-2026-ox', 8) },
    sepio: { t: 'Sepio, RSAC 2024 and Infosecurity Europe 2025', c: '#699dd8', imgs: [...seq('rsa-2024-sepio', 3), ...seq('infosec-2025-sepio', 3)] },
  };

  /* ---------- language ---------- */
  const DICT = {
    he: { name: 'שם', company: 'חברה', phone: 'טלפון', email: 'אימייל', show: 'באיזו תערוכה?', size: 'גודל ביתן משוער', other: 'תערוכה אחרת', unknown: 'עוד לא יודעים', pick: 'בחירה',
      yours: 'הביתן שלכם', close: 'סגירה', prev: 'הקודמת', next: 'הבאה', aisle: 'המסדרון' },
    en: { name: 'Name', company: 'Company', phone: 'Phone', email: 'Email', show: 'Which show?', size: 'Approx. booth size', other: 'Another show', unknown: 'Not sure yet', pick: 'Select',
      yours: 'Your booth', close: 'Close', prev: 'Previous', next: 'Next', aisle: 'The aisle' },
  };
  function getLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'he') return q;
    try { const s = localStorage.getItem('bcb-aisle-lang'); if (s === 'en' || s === 'he') return s; } catch (e) {}
    return 'he';
  }
  let LANG = 'he';
  function setLang(l) {
    LANG = l; root.lang = l; root.dir = l === 'he' ? 'rtl' : 'ltr';
    $$('[data-t]').forEach(el => { el.textContent = DICT[l][el.dataset.t] || el.textContent; });
    $$('.lang-toggle button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    $('[data-vclose]').setAttribute('aria-label', DICT[l].close);
    $('[data-vstep="-1"]').setAttribute('aria-label', DICT[l].prev);
    $('[data-vstep="1"]').setAttribute('aria-label', DICT[l].next);
    $('.sign__map').setAttribute('aria-label', DICT[l].aisle);
    try { localStorage.setItem('bcb-aisle-lang', l); } catch (e) {}
    updateFascia(); layout(); tick(true);
  }

  /* ---------- WhatsApp + toast (Matan's number is not known yet) ---------- */
  const WA = ''; // ⚠️ Matan's WhatsApp number, E.164 without "+"
  function toast(msg) {
    let t = $('.bcb-toast');
    if (!t) { t = document.createElement('div'); t.className = 'bcb-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3800);
  }
  function openWA() {
    const show = $('[data-show-select]').value;
    const sh = show && show !== 'other' ? show : '';
    const txt = LANG === 'he'
      ? `היי מתן, ראיתי את הביתנים שבניתם לחברות סייבר.${sh ? ' אנחנו מציגים ב-' + sh + ' 2027.' : ''} אפשר לדבר על הביתן?`
      : `Hi Matan, I saw the booths you built for cyber companies.${sh ? ' We are exhibiting at ' + sh + ' 2027.' : ''} Can we talk about our booth?`;
    if (!WA) { toast(LANG === 'he' ? '⚠️ טיוטה: מספר הוואטסאפ של מתן עוד לא הוכנס' : '⚠️ Draft: Matan\'s WhatsApp number is not set yet'); return; }
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
  }

  /* ---------- the counter (form): fascia shows their name and show live ---------- */
  const form = $('#lead');
  const companyIn = $('[data-company]'), showSel = $('[data-show-select]');
  const chips = $$('.shows button');
  function updateFascia() {
    const nm = $('[data-fascia-name]');
    const v = companyIn.value.trim();
    if (v) { nm.textContent = v; nm.dataset.filled = '1'; }
    else if (nm.dataset.filled) { nm.innerHTML = '<span class="he">השם שלכם כאן</span><span class="en">Your name here</span>'; delete nm.dataset.filled; }
    const chip = chips.find(c => c.dataset.show === showSel.value);
    $('[data-fascia-show]').textContent = chip ? chip.dataset.show + ' 2027, ' + chip.dataset.when : (showSel.value === 'other' ? '2027' : '2027');
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
  }
  companyIn.addEventListener('input', updateFascia);
  showSel.addEventListener('change', updateFascia);
  chips.forEach(c => c.addEventListener('click', () => { showSel.value = c.dataset.show; updateFascia(); }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    $$('.err', form).forEach(x => x.classList.remove('err'));
    const bad = $$('[required]', form).filter(i => !i.value.trim());
    if (bad.length) { bad.forEach(i => i.closest('label').classList.add('err')); bad[0].focus(); return; }
    const email = $('[type=email]', form), phone = $('[type=tel]', form);
    if (!email.value.trim() && !phone.value.trim()) { phone.closest('label').classList.add('err'); phone.focus(); return; }
    if (email.value.trim() && !/^\S+@\S+\.\S+$/.test(email.value.trim())) { email.closest('label').classList.add('err'); email.focus(); return; }
    form.classList.add('sent');
    $('.thanks', form).focus();
  });
  $$('[data-wa]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openWA(); }));

  /* ---------- viewer: every photo of one booth ---------- */
  const dlg = $('.viewer'), strip = $('[data-vstrip]');
  let vIdx = 0, vN = 0;
  function openViewer(id) {
    const p = PROJ[id]; if (!p) return;
    const small = innerWidth <= 760;
    strip.innerHTML = '';
    p.imgs.forEach((f, i) => {
      const im = new Image(); im.src = C + f + (small ? '-s' : '') + '.webp'; im.alt = p.t + ' (' + (i + 1) + '/' + p.imgs.length + ')'; im.decoding = 'async';
      strip.appendChild(im);
    });
    $('[data-vtitle]').textContent = p.t;
    dlg.style.setProperty('--vc', lift(hex2rgb(p.c)).join(' '));
    vIdx = 0; vN = p.imgs.length; $('[data-vcount]').textContent = '1 / ' + vN;
    dlg.showModal(); strip.scrollLeft = 0; strip.focus({ preventScroll: true });
  }
  function vGo(step) {
    const ims = $$('img', strip); vIdx = clamp(vIdx + step, 0, vN - 1);
    ims[vIdx].scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    $('[data-vcount]').textContent = (vIdx + 1) + ' / ' + vN;
  }
  strip.addEventListener('scroll', () => {
    const ims = $$('img', strip); const mid = strip.getBoundingClientRect().left + strip.clientWidth / 2;
    let best = 0, bd = 1e9; ims.forEach((im, i) => { const r = im.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
    vIdx = best; $('[data-vcount]').textContent = (vIdx + 1) + ' / ' + vN;
  }, { passive: true });
  strip.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); vGo(root.dir === 'rtl' ? -1 : 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); vGo(root.dir === 'rtl' ? 1 : -1); }
  });
  $$('[data-vstep]').forEach(b => b.addEventListener('click', () => vGo(+b.dataset.vstep)));
  $('[data-vclose]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  $$('[data-open]').forEach(b => b.addEventListener('click', () => openViewer(b.dataset.open)));

  /* ---------- scene + aisle geometry ---------- */
  const entrance = $('#entrance'), aisle = $('#aisle'), yours = $('#your-booth');
  const intro = $('[data-intro]'), outro = $('[data-outro]');
  const scene = $('[data-scene]');
  const L = { plate: $('.pl--plate'), booth: $('.pl--booth'), counter: $('.pl--counter'), ring: $('.pl--ring') };
  const hcopy = $('[data-hcopy]'), hlabel = $('[data-hlabel]');
  const fade = document.createElement('div');
  fade.setAttribute('aria-hidden', 'true');
  fade.style.cssText = 'position:absolute;inset:0;background:#080808;opacity:0;pointer-events:none;z-index:5';
  $('.entrance__stage').appendChild(fade);

  const ar = im => (+im.getAttribute('width')) / (+im.getAttribute('height'));
  const booths = $$('.booth').map(el => {
    const mainImg = $('.b-main > img', el), near = $('.b-near', el), far = $('.b-far', el);
    const c = el.dataset.c, rgb = hex2rgb(c);
    const spill = new Image(); spill.className = 'b-spill'; spill.alt = ''; spill.setAttribute('aria-hidden', 'true'); spill.decoding = 'async';
    spill.src = 'assets/glow/' + mainImg.getAttribute('src').split('/').pop().replace('-s.webp', '.webp');
    el.insertBefore(spill, el.firstChild);
    el.style.setProperty('--tagc', rgb.join(' '));
    $('[data-hex]', el).textContent = c;
    return {
      el, c, rgb, light: lift(rgb), id: el.dataset.id, show: el.dataset.show,
      name: $('.tag b', el).textContent,
      main: $('.b-main', el), spill, dim: $('.b-dim', el), near, far, tag: $('.tag', el),
      ma: ar(mainImg), na: ar(near), fa: ar(far),
    };
  });
  const N = booths.length, S_IN = .8, S_OUT = .48, UNITS = N - 1 + S_IN + S_OUT;
  const posOf = i => (i + S_IN) / UNITS;   // scroll fraction of the aisle at which booth i is centred
  let G = {};
  function layout() {
    const vw = innerWidth, vh = innerHeight, phone = vw <= 760;
    const sy = scrollY;
    const top = el => el.getBoundingClientRect().top + sy;
    G = { vw, vh, phone, dir: root.dir === 'rtl' ? -1 : 1,
      eTop: top(entrance), eH: entrance.offsetHeight,
      aTop: top(aisle), aH: aisle.offsetHeight, yTop: top(yours) };

    // hero scene: all four planes share one box, so they line up exactly
    let w, h, left, tp;
    if (phone) {
      h = vh * .55; w = h * 1600 / 989; left = vw * .5 - w * .545; tp = 50;
    } else {
      w = Math.max(vw * 1.02, vh * 1.618); h = w * 989 / 1600;
      left = (vw - w) / 2 + (G.dir === -1 ? -vw * .085 : vw * .06);
      tp = Math.min(0, vh - h * .99);
      if (left > 0) left = 0; if (left + w < vw) left = vw - w;
    }
    Object.assign(scene.style, { width: w + 'px', height: h + 'px', left: left + 'px', top: tp + 'px' });
    G.sceneH = h;

    // aisle: every booth stands on one floor line; three depths per booth
    const sign = phone ? 56 : 64;
    G.S = phone ? vw * .94 : vw * .56;
    G.floorY = phone ? vh * .56 : vh * .79;
    $('.floor').style.setProperty('--floor-h', (vh - G.floorY) + 'px');
    booths.forEach(b => {
      let mw, mh, nw, nh, fw, fh;
      if (phone) {
        mw = vw * .9; mh = mw / b.ma; if (mh > vh * .33) { mh = vh * .33; mw = mh * b.ma; }
        nh = vh * .2; nw = Math.min(vw * .38, nh * b.na); nh = nw / b.na;
        fh = vh * .15; fw = Math.min(vw * .3, fh * b.fa); fh = fw / b.fa;
      } else {
        mh = (G.floorY - sign) * .86; mw = Math.min(vw * .66, mh * b.ma); mh = mw / b.ma;
        nh = vh * .34; nw = Math.min(vw * .2, nh * b.na); nh = nw / b.na;
        fh = vh * .36; fw = Math.min(vw * .17, fh * b.fa); fh = fw / b.fa;
      }
      const mTop = G.floorY - mh;
      Object.assign(b, { mw, mh, nw, nh, fw, fh, mTop });
      b.main.style.width = mw + 'px'; b.main.style.top = mTop + 'px';
      b.near.style.width = nw + 'px'; b.near.style.top = (phone ? G.floorY - nh * .25 : G.floorY - nh * .62) + 'px';
      b.far.style.width = fw + 'px'; b.far.style.top = (phone ? mTop - fh * .62 : mTop - fh * .16) + 'px';
      b.spill.style.width = (mw * 1.55) + 'px'; b.spill.style.top = (mTop - mh * .32) + 'px';
      b.tag.style.top = (phone ? G.floorY + 22 : G.floorY + 20) + 'px';
      b.tw = b.tag.offsetWidth;
    });
  }

  /* ---------- the loop ---------- */
  const ceilRows = $$('.ceil__row');
  const nowName = $('[data-now]'), nowShow = $('[data-now-show]'), mapBtns = $$('.sign__map button');
  let lastNow = '', ticking = false;
  function setAmb(rgb, ai) {
    root.style.setProperty('--amb', rgb.map(Math.round).join(' '));
    root.style.setProperty('--ai', ai.toFixed(3));
  }
  function setNow(key, name, show) {
    if (key === lastNow) return; lastNow = key;
    nowName.textContent = name; nowShow.textContent = show;
    mapBtns.forEach(b => b.setAttribute('aria-current', String(b.dataset.go === key)));
  }
  function tick(force) {
    ticking = false;
    const y = scrollY, { vh, vw, dir, phone } = G, still = RM.matches;

    // ACT 1 · entrance push-in
    const q = still ? .3 : clamp((y - G.eTop) / (G.eH - vh));
    if (y < G.eTop + G.eH || force) {
      L.plate.style.transform = `scale(${1 + .06 * q})`;
      L.booth.style.transform = `scale(${1 + .17 * q})`;
      L.counter.style.transform = `scale(${1 + .27 * q})`;
      L.ring.style.transform = `translate3d(0, ${-q * G.sceneH * .16}px, 0) scale(${1 + .45 * q})`;
      const co = still ? 1 : 1 - smooth(.5, .86, q);
      hcopy.style.opacity = co;
      hcopy.style.transform = phone ? `translate3d(0, ${q * vh * .05}px, 0)` : `translate3d(0, calc(-50% + ${q * vh * .09}px), 0)`;
      hcopy.style.visibility = co < .01 ? 'hidden' : 'visible';
      hlabel.style.opacity = still ? 1 : 1 - smooth(.3, .6, q);
      hlabel.style.visibility = hlabel.style.opacity < .01 ? 'hidden' : 'visible';
      fade.style.opacity = still ? 0 : (smooth(.8, 1, q) * .5).toFixed(3);
    }

    // ACT 3 · the aisle
    const p = clamp((y - G.aTop) / (G.aH - vh));
    const s = p * UNITS - S_IN;     // which booth is in front of you (fractional)
    const outT = smooth(N - 1 + .06, N - 1 + S_OUT * .7, s);   // end of the aisle: house lights going down
    if (!still) {
      booths.forEach((b, i) => {
        // on a phone the first booth leans in further during the badge-in, so the screen is never empty
        const d0 = i - s, d = (phone && i === 0 && d0 > 0) ? d0 * .5 : d0, ad = Math.abs(d);
        const vis = ad < 1.85;
        b.el.style.visibility = vis ? 'visible' : 'hidden';
        if (!vis) { b.tag.style.opacity = '0'; b.tag.style.pointerEvents = 'none'; return; }
        b.el.style.zIndex = String(10 - Math.round(ad * 3));
        const xm = dir * d * G.S, sc = 1 - Math.min(ad, 1.5) * .2;
        b.main.style.transform = `translate3d(${xm - b.mw / 2}px, 0, 0) scale(${sc})`;
        b.dim.style.opacity = Math.max(Math.min(1, ad) * .45, outT * .5).toFixed(3);
        b.spill.style.transform = `translate3d(${xm - b.mw * .775}px, 0, 0)`;
        b.spill.style.opacity = (.85 * (1 - smooth(0, 1, ad))).toFixed(3);
        const xn = dir * d * G.S * 1.38 + dir * (b.mw * .5 - b.nw * (phone ? .55 : .3)) * sc;
        b.near.style.transform = `translate3d(${xn - b.nw / 2}px, ${ad * 26}px, 0)`;
        b.near.style.opacity = (1 - smooth(.55, 1.2, ad)).toFixed(3);
        const xf = dir * d * G.S * .74 - dir * (b.mw * .5 + b.fw * (phone ? -.3 : .12)) * sc;
        b.far.style.transform = `translate3d(${xf - b.fw / 2}px, 0, 0)`;
        b.far.style.opacity = (1 - smooth(.7, 1.5, ad)).toFixed(3);
        const tx = dir === -1 ? xm + b.mw / 2 - b.tw : xm - b.mw / 2;
        b.tag.style.transform = `translate3d(${tx}px, 0, 0)`;
        b.tag.style.opacity = ((1 - smooth(.3, .7, ad)) * (1 - outT)).toFixed(3);
        b.tag.style.pointerEvents = ad < .7 ? 'auto' : 'none';
      });
      const shift = (s + S_IN) * G.S;
      const io = 1 - smooth(-.64, -.44, s);
      intro.style.opacity = io.toFixed(3);
      intro.style.visibility = io < .01 ? 'hidden' : 'visible';
      intro.style.transform = (phone ? '' : 'translateY(-50%) ') + `translate3d(${dir * -(s + S_IN) * vw * .06}px,0,0)`;
      outro.style.opacity = smooth(N - 1 + .12, N - 1 + .32, s).toFixed(3);
      outro.style.transform = `translate(-50%, -50%) scale(${(1.06 - .06 * smooth(N - 1 + .12, N - 1 + S_OUT, s)).toFixed(4)})`;
      ceilRows[1].style.transform = `translate3d(${(-dir * shift * .5) % 150}px,0,0)`;
      ceilRows[0].style.transform = `translate3d(${(-dir * shift * .28) % 84}px,0,0)`;
    }

    // light: which colour reaches the hall right now
    let rgb = LZERO, ai = 1, now = ['entrance', 'Zero Networks', 'Black Hat USA 2025'];
    if (y >= G.aTop - vh * .6) {
      const sc = clamp(s, 0, N - 1), i0 = Math.floor(sc), i1 = Math.min(N - 1, i0 + 1), f = smooth(.3, .7, sc - i0);
      const A = booths[i0].light, B = booths[i1].light;
      let col = A.map((v, k) => lerp(v, B[k], f));
      let a = .92 - .16 * Math.sin(Math.PI * (sc - i0));
      if (s < 0) { // the first booth's light leaks in while the teal of the entrance fades
        const t = smooth(-S_IN, -.1, s); col = LZERO.map((v, k) => lerp(v, booths[0].light[k], t)); a = lerp(.7, .92, t);
      }
      if (y < G.aTop) { const t = smooth(G.aTop - vh * .6, G.aTop, y); col = LZERO.map((v, k) => lerp(v, col[k], t)); a = lerp(1, a, t); }
      a *= 1 - outT * .62;                     // end of the aisle: the last light fades, never to black
      rgb = col; ai = a;
      const bi = Math.round(clamp(s, 0, N - 1)), bb = booths[bi];
      if (s > -.45) now = [String(bi), bb.name, bb.show];
      if (outT > .5) now = ['end', '', ''];
    }
    // your booth: the work lights come on
    const r = clamp((y + vh - G.yTop) / (vh * .95));
    const rr = still ? 1 : r;
    if (rr > 0) {
      yours.style.setProperty('--r', smooth(.25, 1, rr).toFixed(3));
      yours.style.setProperty('--l1', smooth(.3, .5, rr).toFixed(3));
      yours.style.setProperty('--l2', smooth(.45, .65, rr).toFixed(3));
      yours.style.setProperty('--l3', smooth(.6, .8, rr).toFixed(3));
    }
    if (y + vh * .65 > G.yTop) {
      const t = smooth(G.yTop - vh * .65, G.yTop - vh * .1, y);
      rgb = LOCHRE; ai = Math.max(ai, t);
      now = ['your-booth', DICT[LANG].yours, '2027'];
    }
    setAmb(rgb, ai);
    setNow(now[0] + LANG, now[1], now[2]);
    mapBtns.forEach(bt => bt.setAttribute('aria-current', String(bt.dataset.go === now[0])));
    document.querySelector('.sign').classList.toggle('sign--over', y < G.eTop + G.eH - vh);
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => tick()); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { layout(); tick(true); });
  RM.addEventListener?.('change', () => { layout(); tick(true); });

  /* keyboard: tabbing to a booth's tag walks the aisle to that booth */
  booths.forEach((b, i) => b.tag.addEventListener('focus', () => {
    if (RM.matches) return;
    scrollTo({ top: G.aTop + posOf(i) * (G.aH - G.vh), behavior: 'auto' });
  }));
  booths.forEach(b => { b.tag.style.visibility = 'visible'; });

  /* ---------- jumps from the overhead sign ---------- */
  mapBtns.forEach(b => b.addEventListener('click', () => {
    const g = b.dataset.go; let ty = 0;
    if (g === 'entrance') ty = G.eTop;
    else if (g === 'your-booth') ty = G.yTop;
    else if (RM.matches) ty = booths[+g].el.getBoundingClientRect().top + scrollY - 40;
    else ty = G.aTop + posOf(+g) * (G.aH - G.vh);
    scrollTo({ top: ty, behavior: RM.matches ? 'auto' : 'smooth' });
  }));
  $$('a[href="#your-booth"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: G.yTop, behavior: RM.matches ? 'auto' : 'smooth' }); }));
  $$('a[href="#top"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: RM.matches ? 'auto' : 'smooth' }); }));

  /* ---------- boot ---------- */
  $$('.lang-toggle button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  document.addEventListener('DOMContentLoaded', () => {});
  setLang(getLang());
  addEventListener('load', () => { layout(); tick(true); });
  window.__aisle = { layout, tick, G: () => G, booths, posOf };
})();
