/* v2-build: the build clock (scrubbed real footage), the wall hand-off, the ochre floor. Bespoke, no engine. */
(function () {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (RM) root.classList.add('rm');
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eo = t => 1 - Math.pow(1 - t, 3);
  const eio = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const { PROJECTS, SHOWS } = window.BCB;

  /* ---------------- data: the wall ---------------- */
  const byFile = {};
  PROJECTS.forEach(p => p.imgs.forEach((src, i) => { byFile[src.split('/').pop()] = { p, i }; }));
  // Best frames first: they land in the rings closest to the film.
  const PRIORITY = [
    'black-hat-lv-2025-zero-2', 'black-hat-2026-astelia-2', 'black-hat-2026-novee-3', 'cybertech-2023-pentera-1',
    'rsa-2026-ox-6', 'black-hat-2026-novee-6', 'black-hat-lv-2025-zero-4', 'infosec-2025-sepio-2',
    'rsa-2026-ox-4', 'black-hat-2026-astelia-1', 'black-hat-2026-novee-2', 'gices-2023-dubai-pentera-3',
    'black-hat-lv-2025-zero-5', 'black-hat-2026-novee-4', 'black-hat-2026-astelia-4', 'rsa-2024-sepio-2',
    'iss-dubai-2024-cognyte-2', 'rsa-2026-ox-8', 'black-hat-lv-2025-zero-1', 'black-hat-2026-novee-7',
    'cybertech-2023-pentera-2', 'gices-2023-dubai-pentera-5', 'black-hat-2026-astelia-3', 'rsa-2026-ox-5',
    'infosec-2025-sepio-1', 'black-hat-lv-2025-zero-3', 'black-hat-2026-novee-5', 'iss-dubai-2024-cognyte-1',
    'rsa-2026-ox-7', 'gices-2023-dubai-pentera-1', 'black-hat-lv-2025-zero-6', 'black-hat-2026-novee-8',
    'rsa-2024-sepio-1', 'black-hat-2026-astelia-5', 'rsa-2026-ox-2', 'gices-2023-dubai-pentera-4',
    'black-hat-lv-2025-zero-7', 'iss-dubai-2024-cognyte-3', 'rsa-2026-ox-3', 'black-hat-2026-novee-1',
    'infosec-2025-sepio-3', 'gices-2023-dubai-pentera-2', 'rsa-2024-sepio-3', 'rsa-2026-ox-1', 'cybertech-2023-pentera-3',
  ];

  /* ---------------- geometry ---------------- */
  let vw = innerWidth, vh = innerHeight, portrait = vw / vh < 1;
  const SEG = { hero: .9, scrub: 3.0, ba: 1.1, zoom: 1.4, hold: .8 };
  const RUN_VH = SEG.hero + SEG.scrub + SEG.ba + SEG.zoom + SEG.hold;
  const run = $('#run'), stage = $('#stage'), wall = $('#wall');
  let G = {};

  function buildWall() {
    const cols = portrait ? 7 : 9, rows = portrait ? 3 : 5;
    const cw = Math.round(portrait ? vw * .17 : vw * .118);
    const ch = Math.round(cw * vh / vw);
    const gap = portrait ? 5 : Math.round(vw * .007);
    G = { cols, rows, cw, ch, gap, s0: vw / cw };
    wall.style.setProperty('--cols', cols); wall.style.setProperty('--cw', cw + 'px');
    wall.style.setProperty('--ch', ch + 'px'); wall.style.setProperty('--gap', gap + 'px');
    const cc = (cols - 1) / 2, cr = (rows - 1) / 2;
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (r === cr && c === cc) continue;
      // ring = Chebyshev distance, scaled so the wall reads as rings on a wide grid
      const ring = Math.max(Math.abs(c - cc), Math.abs(r - cr) * (portrait ? 1 : 1));
      cells.push({ r, c, ring, d: Math.hypot(c - cc, (r - cr) * 1.4) });
    }
    cells.sort((a, b) => a.ring - b.ring || a.d - b.d);
    const assign = new Map();
    cells.forEach((cell, i) => assign.set(cell.r * cols + cell.c, { file: PRIORITY[i], ring: cell.ring }));
    wall.innerHTML = '';
    const small = true;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = r * cols + c;
      if (r === cr && c === cc) {
        const f = document.createElement('div');
        f.className = 'tile film'; f.setAttribute('role', 'listitem'); f.dataset.ring = 0;
        f.dataset.l = root.lang === 'en' ? 'The build you just scrolled, ICE 2025' : 'ההקמה שגללתם, ICE 2025';
        wall.appendChild(f); continue;
      }
      const a = assign.get(k); if (!a || !a.file) continue;
      const meta = byFile[a.file];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tile'; b.dataset.ring = a.ring; b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', meta ? `${meta.p.client}, ${SHOWS[meta.p.show].name} ${meta.p.year}` : a.file);
      const im = document.createElement('img'); im.alt = ''; im.decoding = 'async';
      im.dataset.src = 'assets/cyber/' + a.file + (small ? '-s' : '') + '.webp';
      if (wallLoaded) im.src = im.dataset.src;
      b.appendChild(im);
      if (meta) b.addEventListener('click', () => openLB(meta.p.id, meta.i));
      wall.appendChild(b);
    }
    tiles = $$('.tile');
  }
  let tiles = [], wallLoaded = false;
  function loadWall() { if (wallLoaded) return; wallLoaded = true; $$('.wall img[data-src]').forEach(im => { im.src = im.dataset.src; }); }

  /* ---------------- frames ---------------- */
  const N = 116;
  const cv = $('#film'), ctx = cv.getContext('2d', { alpha: false });
  let set = portrait ? 'm' : 'd', frames = [], cur = -1, needDraw = true;
  function frameSrc(i) { return `assets/seq/${set}/f${String(i).padStart(3, '0')}.webp`; }
  function loadFrame(i) {
    if (frames[i]) return frames[i];
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { im._ok = true; if (Math.abs(i - cur) <= 2 || cur < 0) needDraw = true; };
    im.src = frameSrc(i); frames[i] = im; return im;
  }
  function loadAll() {
    // coarse pass first (every 6th), then fill, a few at a time so the hero is never starved
    const order = [];
    for (let i = 0; i < 10; i++) order.push(i);
    for (let i = 10; i < N; i += 6) order.push(i);
    for (let i = 10; i < N; i++) if (!order.includes(i)) order.push(i);
    let k = 0, active = 0;
    const pump = () => {
      while (active < 6 && k < order.length) {
        const im = loadFrame(order[k++]); active++;
        const done = () => { active--; pump(); };
        if (im.complete) setTimeout(done); else { im.addEventListener('load', done, { once: true }); im.addEventListener('error', done, { once: true }); }
      }
    };
    pump();
  }
  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); needDraw = true;
  }
  function nearest(i) {
    for (let d = 0; d < N; d++) {
      if (frames[i - d] && frames[i - d]._ok) return frames[i - d];
      if (frames[i + d] && frames[i + d]._ok) return frames[i + d];
    }
    return null;
  }
  function blit(im, a) {
    const cw = cv.width, ch = cv.height, iw = im.naturalWidth, ih = im.naturalHeight;
    const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    ctx.globalAlpha = a; ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  let lastDrawn = -1;
  function draw(f) {
    if (!needDraw && Math.abs(f - lastDrawn) < .001) return;
    const i = Math.floor(f), fr = f - i;
    const A = frames[i] && frames[i]._ok ? frames[i] : nearest(i);
    if (!A) return;
    blit(A, 1);
    // dissolve only through the middle of each step, so frames read crisp and cuts read as cuts
    const a = clamp((fr - .3) / .4);
    if (a > 0 && i + 1 < N && frames[i + 1] && frames[i + 1]._ok) blit(frames[i + 1], a);
    ctx.globalAlpha = 1; lastDrawn = f; needDraw = false;
  }

  /* ---------------- elements ---------------- */
  const planes = { back: $('.pl-back'), floor: $('.pl-floor'), haze: $('.pl-haze'), shade: $('.pl-shade'), ghost: $('.pl-ghost') };
  const heroCopy = $('#heroCopy'), tape = $('#heroTape'), invite = $('#invite'), ghostCap = $('#ghostCap'), filmbar = $('#filmbar'), ba = $('#ba');
  const chaps = $$('.chap').map(el => ({ el, a: +el.dataset.a, b: +el.dataset.b }));
  const phases = $('.phases'), phLis = $$('.phases li'), PH = [0, 8, 30, 45, 72, 98];
  const wallTop = $('#wallTop'), wallBot = $('#wallBot');
  const spreads = $$('[data-sp]').map(el => ({ el, figs: [...el.querySelectorAll('[data-depth]')].map(f => ({ f, d: +f.dataset.depth })) }));
  const offer = $('#offer'), oPlate = $('.o-plate'), oFloor = $('#oFloor'), oHead = $('#oHead'), oPick = $('#oPick'), oMark = $('#oMark');
  let HZ = 44;
  let px = 0, py = 0, tpx = 0, tpy = 0; // pointer parallax (hero only)

  function layout() {
    vw = innerWidth; vh = innerHeight;
    const np = vw / vh < 1;
    if (np !== portrait) { portrait = np; set = portrait ? 'm' : 'd'; frames = []; if (!RM) loadAll(); }
    if (!RM) run.style.height = Math.round((RUN_VH + 1) * vh) + 'px';
    HZ = parseFloat(getComputedStyle(root).getPropertyValue('--hz')) || 44;
    buildWall(); sizeCanvas();
    if (RM) placeWallStatic();
  }

  /* ---------------- the frame loop ---------------- */
  function tick() {
    px += (tpx - px) * .08; py += (tpy - py) * .08;
    if (!RM) {
      const u = (scrollY - run.offsetTop) / vh;
      const h = clamp(u / SEG.hero);
      const s = clamp((u - SEG.hero) / SEG.scrub);
      const tb = clamp((u - SEG.hero - SEG.scrub) / SEG.ba);
      const z = clamp((u - SEG.hero - SEG.scrub - SEG.ba) / SEG.zoom), ze = eio(z);
      const f = s * (N - 1);

      // ACT 1: the planes separate. Back barely moves, the floor dollies at you, the type lifts away.
      const hp = eo(h);
      const backS = 1 + .06 * hp;
      const fade = 1 - clamp((u - .62) / .42);
      planes.back.style.transform = `translate3d(${px * -6}px, ${py * -4}px, 0) scale(${backS})`;
      planes.floor.style.transform = `translate3d(${px * -16}px, ${py * -8}px, 0) scale(${1 + .34 * hp})`;
      planes.haze.style.transform = `translate3d(${px * -10}px, ${-hp * 4}vh, 0)`;
      planes.ghost.style.transform = `translate3d(${px * -14}px, ${hp * 8}vh, 0) scale(${1 + .12 * hp})`;
      planes.back.style.opacity = planes.floor.style.opacity = planes.haze.style.opacity = planes.shade.style.opacity = fade;
      planes.ghost.style.opacity = .92 * (1 - clamp((u - .3) / .4));
      ghostCap.style.opacity = 1 - clamp((u - .2) / .3);
      invite.style.opacity = 1 - clamp((u - .15) / .3);
      heroCopy.style.transform = `translate3d(${px * -10}px, ${-hp * 11}vh, 0)`;
      heroCopy.style.opacity = 1 - clamp((u - .62) / .4);
      tape.style.transform = `translate3d(${px * -16}px, ${hp * 22}vh, 0) scale(${1 + .2 * hp}) rotate(${-1.2 + hp * 1.2}deg)`;
      tape.style.opacity = 1 - clamp((u - .35) / .35);

      // ACT 2: the build clock
      const cs0 = lerp(backS, 1, clamp(s / .12));
      // ACT 3: the film pulls back into the centre tile
      const ws = lerp(G.s0, 1, ze);
      const k = z <= 0 ? cs0 : ws * G.cw / vw;
      cv.style.transform = `scale(${k})`;
      draw(f);

      chaps.forEach(c => {
        const t = (f - c.a) / (c.b - c.a);
        let o = clamp(t / .16) * clamp((1 - t) / .16);
        if (c.b > N) o = clamp(t / .16) * (1 - clamp(tb / .15));
        c.el.style.opacity = o;
        c.el.style.transform = `translate3d(0, ${(1 - o) * 18}px, 0)`;
      });
      const onRail = u > .7 && u < SEG.hero + SEG.scrub + .12;
      filmbar.classList.toggle('on', onRail);
      // ACT 2b: before / after, side by side, then it gives way to the pull-back
      const bin = eo(clamp(tb / .3)), bout = clamp((tb - .78) / .22);
      ba.classList.toggle('on', tb > 0 && tb < 1);
      ba.style.opacity = tb > 0 ? 1 - bout : 0;
      ba.style.setProperty('--bw', ((1 - bin) * 100).toFixed(2) + '%');
      ba.style.setProperty('--aw', ((1 - eo(clamp((tb - .1) / .3))) * 100).toFixed(2) + '%');
      let ph = 0; PH.forEach((a, i) => { if (f >= a) ph = i; });
      phLis.forEach((li, i) => { li.classList.toggle('cur', i === ph); li.classList.toggle('done', i < ph); });
      phases.style.setProperty('--pf', s.toFixed(4));

      wall.classList.toggle('on', z > 0);
      if (u > 2) loadWall();
      wall.style.setProperty('--ws', ws.toFixed(4));
      tiles.forEach(t => { const r = +t.dataset.ring; if (r) t.style.opacity = clamp(ze * 2.1 - r * .26); });
      wall.querySelector('.film')?.style.setProperty('--fl', clamp((z - .85) / .15));
      wallTop.style.opacity = clamp((ze - .55) / .3);
      wallTop.style.transform = `translate3d(0, ${(1 - clamp((ze - .55) / .3)) * 16}px, 0)`;
      wallBot.style.opacity = clamp((ze - .7) / .3);
      // tiles become clickable once the wall has landed
      wall.style.pointerEvents = ze > .9 ? 'auto' : 'none';

      // ACT 4: spreads, each photo at its own rate
      const amp = portrait ? 50 : 90;
      spreads.forEach(sp => {
        const r = sp.el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = (vh - r.top) / (vh + r.height);
        sp.figs.forEach(({ f: fig, d }) => { fig.style.transform = `translate3d(0, ${((p - .5) * -d * amp).toFixed(1)}px, 0)`; });
      });

      // ACT 7: the floor comes back, and floods ochre
      const orr = offer.getBoundingClientRect();
      if (orr.top < vh && orr.bottom > 0) {
        const ou = -orr.top / vh;           // 0 when the stage reaches the top
        const head = clamp((ou + .55) / .55);
        oHead.style.opacity = head;
        oHead.style.transform = `translate3d(0, ${(1 - head) * 30}px, 0)`;
        const fl = eo(clamp((ou - .02) / .8));
        oFloor.style.setProperty('--ft', lerp(100, HZ, fl).toFixed(2) + '%');
        oPlate.style.transform = `scale(${lerp(1.1, 1, clamp((ou + .6) / 1.4))})`;
        oMark.style.setProperty('--mo', clamp((ou - .45) / .35));
        oMark.style.setProperty('--ms', lerp(.86, 1, clamp((ou - .45) / .6)).toFixed(3));
        oPick.style.opacity = clamp((ou - .6) / .3);
      }
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- reduced motion: static wall, open floor ---------------- */
  function placeWallStatic() {
    let host = $('.rm-wall');
    if (!host) {
      host = document.createElement('section'); host.className = 'rm-wall';
      host.innerHTML = '<h2>' + wallTop.querySelector('h2').innerHTML + '</h2>';
      ($('.rm-ba') || $('.rm-build')).after(host);
    }
    if (!$('.rm-ba')) { const h2 = document.createElement('section'); h2.className = 'rm-ba'; $('.rm-build').after(h2); h2.appendChild(ba); }
    wall.style.setProperty('--ws', 1); host.appendChild(wall); loadWall();
    const film = wall.querySelector('.film');
    if (film) film.innerHTML = '<img src="assets/seq/d/f106.webp" alt="" style="width:100%;height:100%;object-fit:cover">';
    oMark.style.setProperty('--mo', 1);
  }

  /* ---------------- offer: the show chooser ---------------- */
  const order = Object.entries(SHOWS).sort((a, b) => a[1].start.localeCompare(b[1].start));
  const chipsEl = $('#chips'), line = $('#oLine'), sel = $('#showSel'), waBtn = $('#waBtn');
  let picked = new URLSearchParams(location.search).get('show');
  if (picked && !SHOWS[picked]) picked = null;
  order.forEach(([k, sh]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.k = k;
    b.setAttribute('role', 'radio'); b.textContent = sh.name; chipsEl.appendChild(b);
    b.addEventListener('click', () => pick(k));
    const o = document.createElement('option'); o.value = k; o.textContent = sh.name + ' 2027'; sel.appendChild(o);
  });
  const other = document.createElement('option'); other.value = 'other'; other.dataset.t = 'other'; other.textContent = 'תערוכה אחרת'; sel.appendChild(other);
  chipsEl.addEventListener('keydown', e => {
    const all = $$('.chip'), i = all.indexOf(document.activeElement); if (i < 0) return;
    const rtl = root.dir === 'rtl';
    let n = null;
    if (e.key === 'ArrowRight') n = rtl ? i - 1 : i + 1; else if (e.key === 'ArrowLeft') n = rtl ? i + 1 : i - 1;
    if (n === null) return; e.preventDefault(); n = (n + all.length) % all.length; all[n].focus(); pick(all[n].dataset.k);
  });
  function renderPick() {
    const he = root.lang !== 'en';
    $$('.chip').forEach(c => { const on = c.dataset.k === picked; c.setAttribute('aria-checked', String(on)); c.tabIndex = on || (!picked && c === chipsEl.firstChild) ? 0 : -1; });
    if (!picked) {
      line.textContent = he ? 'בחרו תערוכה, והרצפה מקבלת שם.' : 'Pick a show and the floor gets a name.';
      oMark.textContent = '2027'; waBtn.dataset.wa = ''; return;
    }
    const sh = SHOWS[picked], m = BCB.monthsTo(sh.start);
    line.innerHTML = '';
    const b = document.createElement('b'); b.textContent = sh.name + ' 2027';
    const t = document.createElement('span'), d = document.createElement('bdi');
    d.dir = 'ltr'; d.textContent = sh.label;
    const tail = he ? (m > 1 ? ' עוד ' + m + ' חודשים.' : m === 1 ? ' עוד חודש.' : '') : (m > 1 ? ' ' + m + ' months away.' : m === 1 ? ' One month away.' : '');
    t.append((he ? sh.he : sh.en) + ', ', d, '.' + tail);
    line.append(b, t);
    oMark.textContent = sh.name.split(' ')[0].toUpperCase();
    sel.value = picked; waBtn.dataset.wa = sh.name + ' 2027';
  }
  function pick(k) { picked = k; renderPick(); }
  sel.addEventListener('change', () => { if (SHOWS[sel.value]) { picked = sel.value; renderPick(); } });
  renderPick();
  document.addEventListener('bcb:lang', () => { renderPick(); const film = wall.querySelector('.film'); if (film) film.dataset.l = root.lang === 'en' ? 'The build you just scrolled, ICE 2025' : 'ההקמה שגללתם, ICE 2025'; });

  /* ---------------- lightbox ---------------- */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbTitle = $('#lbTitle'), lbCount = $('#lbCount');
  let lbP = null, lbI = 0;
  function showLB() {
    const src = lbP.imgs[lbI] + (vw < 760 ? '-s' : '') + '.webp';
    lbImg.src = src; lbImg.alt = `${lbP.client}, ${SHOWS[lbP.show].name} ${lbP.year}`;
    lbTitle.textContent = lbP.client;
    lbCount.textContent = `${SHOWS[lbP.show].name} ${lbP.year}  ${lbI + 1}/${lbP.n}`;
  }
  function openLB(id, i = 0) { lbP = PROJECTS.find(p => p.id === id); if (!lbP) return; lbI = i; showLB(); lb.showModal(); }
  $('#lbClose').addEventListener('click', () => lb.close());
  $('#lbNext').addEventListener('click', () => { lbI = (lbI + 1) % lbP.n; showLB(); });
  $('#lbPrev').addEventListener('click', () => { lbI = (lbI - 1 + lbP.n) % lbP.n; showLB(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const fwd = (e.key === 'ArrowLeft') === (root.dir === 'rtl');
      lbI = (lbI + (fwd ? 1 : -1) + lbP.n) % lbP.n; showLB();
    }
  });
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  $$('[data-lb]').forEach(b => b.addEventListener('click', () => openLB(b.dataset.lb, 0)));

  /* ---------------- rest: one wipe ---------------- */
  const plates = $('.plates');
  $$('.plates li').forEach((li, i) => li.style.setProperty('--d', (i * .09) + 's'));
  if ('IntersectionObserver' in window && !RM) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { plates.classList.add('in'); io.disconnect(); } }), { threshold: .15 });
    io.observe(plates);
  } else plates.classList.add('in');

  /* ---------------- form ---------------- */
  BCB.wireForm($('#leadForm'));

  /* ---------------- boot ---------------- */
  if (!RM && matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', e => { tpx = e.clientX / vw - .5; tpy = e.clientY / vh - .5; }, { passive: true });
  }
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(layout, 120); });
  layout();
  if (!RM) { loadAll(); requestAnimationFrame(tick); }
  window.__bcb = { SEG, N, get G() { return G; } };
})();
