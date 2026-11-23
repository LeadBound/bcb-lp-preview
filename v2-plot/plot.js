/* v2-plot «המגרש»: hall plan, show chooser, plot → booth (FLIP), scroll acts, the taped offer. */
(function () {
  'use strict';
  const IMG = 'assets/cyber/';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMQ = matchMedia('(max-width: 760px)');
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp01(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const $ = s => document.querySelector(s);

  /* ---- real data: BCB's cyber photo folders + BCB's own 2027 show list (Matan, 18.11.2026) ---- */
  const SHOWS = {
    rsac: { name: 'RSAC', he: 'סן פרנסיסקו', en: 'San Francisco', start: '2027-04-05', label: '5–8.4.2027' },
    gisec: { name: 'GISEC', he: 'דובאי', en: 'Dubai', start: '2027-05-04', label: '4–6.5.2027' },
    iss: { name: 'ISS World', he: 'פראג ודובאי', en: 'Prague & Dubai', start: '2027-06-01', label: '1–3.6.2027' },
    infosec: { name: 'Infosecurity Europe', he: 'לונדון', en: 'London', start: '2027-06-08', label: '8–10.6.2027' },
    bh: { name: 'Black Hat USA', he: 'לאס וגאס', en: 'Las Vegas', start: '2027-07-31', label: '31.7–5.8.2027' },
    itsa: { name: 'it-sa', he: 'נירנברג', en: 'Nuremberg', start: '2027-10-05', label: '5–7.10.2027' },
    cybertech: { name: 'Cybertech Global', he: 'תל אביב', en: 'Tel Aviv', start: '2027-01-25', label: '25–27.1.2027' },
  };
  const SHOW_ORDER = ['rsac', 'bh', 'gisec', 'infosec', 'iss', 'cybertech', 'itsa'];
  // past-show names as BCB's folders name them
  const PAST = { bh: 'Black Hat', rsac: 'RSAC', gisec: 'GISEC', infosec: 'Infosecurity', iss: 'ISS World', cybertech: 'Cybertech' };
  const PLACE = {
    bh: { he: 'לאס וגאס', en: 'Las Vegas' }, rsac: { he: 'סן פרנסיסקו', en: 'San Francisco' }, gisec: { he: 'דובאי', en: 'Dubai' },
    infosec: { he: 'לונדון', en: 'London' }, iss: { he: 'דובאי', en: 'Dubai' }, cybertech: { he: 'תל אביב', en: 'Tel Aviv' },
  };
  //            id            client           show        year  file prefix                 n  picks (first = cover)   desktop x,y,w,h      mobile x,y,w,h
  const P = [
    ['zero', 'Zero Networks', 'bh', 2025, 'black-hat-lv-2025-zero', 7, [2, 1, 3, 4], [3, 6, 22, 34], [4, 3, 44, 21]],
    ['novee', 'Novee', 'bh', 2026, 'black-hat-2026-novee', 8, [3, 6, 2, 4], [27.5, 6, 17, 34], [52, 3, 44, 21]],
    ['ox', 'OX Security', 'rsac', 2026, 'rsa-2026-ox', 8, [6, 4, 8, 1], [55, 6, 22, 34], [4, 27, 44, 21]],
    ['astelia', 'Astelia', 'bh', 2026, 'black-hat-2026-astelia', 5, [2, 1, 4, 3], [79.5, 6, 17.5, 34], [52, 27, 44, 21]],
    ['pentera-ct', 'Pentera', 'cybertech', 2023, 'cybertech-2023-pentera', 3, [1, 2, 3], [3, 48, 14, 20], [66, 52, 30, 9.5]],
    ['pentera-gisec', 'Pentera', 'gisec', 2023, 'gices-2023-dubai-pentera', 5, [3, 5, 2, 1], [19, 48, 13, 20], [66, 62.5, 30, 9.5]],
    ['sepio-info', 'Sepio', 'infosec', 2025, 'infosec-2025-sepio', 3, [2, 1, 3], [3, 74, 14, 20], [4, 76, 28, 10]],
    ['cognyte', 'Cognyte', 'iss', 2024, 'iss-dubai-2024-cognyte', 3, [1, 2, 3], [19, 74, 13, 20], [68, 76, 28, 10]],
    ['sepio-rsa', 'Sepio', 'rsac', 2024, 'rsa-2024-sepio', 3, [2, 1, 3], [68, 48, 29, 20], [36, 76, 28, 10]],
  ].map(r => ({ id: r[0], client: r[1], show: r[2], year: r[3], file: r[4], n: r[5], picks: r[6], d: r[7], m: r[8] }));
  P.forEach(p => {
    p.full = i => IMG + p.file + '-' + i + '.webp';
    p.small = i => IMG + p.file + '-' + i + '-s.webp';
  });
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const LEAD = { rsac: 'ox', bh: 'zero', gisec: 'pentera-gisec', infosec: 'sepio-info', iss: 'cognyte', cybertech: 'pentera-ct' };
  const YOURS = { d: [36, 48, 28, 46], m: [4, 52, 58, 20] };
  const EMPTY = [{ d: [68, 74, 14, 20], m: [4, 89, 44, 8] }, { d: [84, 74, 13, 20], m: [52, 89, 44, 8] }];
  const PILLARS = [[34, 44], [66, 44], [50, 44]];

  const state = { show: null, lang: 'he', company: '' };
  const L = () => state.lang;
  const t = (he, en) => (L() === 'he' ? he : en);
  const big = () => !mobileMQ.matches;

  const monthsTo = iso => Math.max(0, Math.round((new Date(iso) - new Date()) / (864e5 * 30.44)));
  const monthsWords = n => L() === 'he'
    ? (n <= 0 ? 'זה כבר החודש' : n === 1 ? 'עוד חודש' : n === 2 ? 'עוד חודשיים' : `עוד ${n} חודשים`)
    : (n <= 0 ? 'This month' : n === 1 ? '1 month to go' : `${n} months to go`);
  const where = p => `${PAST[p.show]} ${p.year}, ${PLACE[p.show][L()]}`;

  /* ---- build a hall ---- */
  function vars(p, d, m) {
    return `--dx:${d[0]};--dy:${d[1]};--dw:${d[2]};--dh:${d[3]};--mx:${m[0]};--my:${m[1]};--mw:${m[2]};--mh:${m[3]}`;
  }
  const tape = '<i class="t t1"></i><i class="t t2"></i><i class="t t3"></i><i class="t t4"></i>';
  function buildHall(el) {
    let h = PILLARS.map(([x, y]) => `<span class="pillar" style="left:${x}%;top:${y}%"></span>`).join('');
    EMPTY.forEach(e => { h += `<span class="plot plot--empty" style="${vars(null, e.d, e.m)}" aria-hidden="true">${tape}</span>`; });
    h += `<span class="plot plot--yours" style="${vars(null, YOURS.d, YOURS.m)}" aria-hidden="true">${tape}
      <span class="yours-label"><b data-dyn="plan-yours"></b><small data-dyn="plan-yours-sub"></small></span></span>`;
    P.forEach(p => {
      const sm = p.m[3] < 15 ? ' plot--sm' : '';
      h += `<button type="button" class="plot plot--bcb${sm}" data-id="${p.id}" data-show="${p.show}" style="${vars(p, p.d, p.m)}">
        <img src="${p.small(p.picks[0])}" alt="" loading="${el.dataset.hall === 'hero' ? 'eager' : 'lazy'}" decoding="async">${tape}
        <span class="plot__tag"><b>${p.client}</b><small>${PAST[p.show]} ${p.year}</small></span>
        <span class="sr" data-dyn-label="${p.id}"></span></button>`;
    });
    el.innerHTML = h;
    el.querySelectorAll('.plot--bcb').forEach(b => b.addEventListener('click', () => openBooth(b.dataset.id, b)));
  }
  const heroHall = $('#hall-plan'), flyHall = $('#fly-plan');
  // neighbours around your plot in the offer: real booths, dimmed, partly off the edge
  $('#nb').innerHTML = ['ox', 'novee', 'pentera-gisec', 'sepio-rsa'].map((id, i) =>
    `<span class="nbp nbp--${i + 1}"><img src="${byId[id].small(byId[id].picks[0])}" alt="" loading="lazy">${tape}</span>`).join('');
  buildHall(heroHall); buildHall(flyHall);

  /* ---- show chips ---- */
  const chips = $('#chips');
  chips.innerHTML = SHOW_ORDER.map(k => `<button type="button" class="chip" data-show="${k}" aria-pressed="false">
    <b>${SHOWS[k].name}</b><small>${SHOWS[k].label}</small></button>`).join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    setShow(state.show === b.dataset.show ? null : b.dataset.show);
  });

  /* ---- the form selects ---- */
  const fShow = $('#f-show'), fSize = $('#f-size');
  function fillSelects() {
    const cur = fShow.value;
    fShow.innerHTML = `<option value="">${t('בחירה', 'Select')}</option>` +
      SHOW_ORDER.map(k => `<option value="${k}">${SHOWS[k].name} 2027</option>`).join('') +
      `<option value="other">${t('תערוכה אחרת', 'Another show')}</option>`;
    fShow.value = state.show || cur || '';
    const cs = fSize.value;
    fSize.innerHTML = `<option value="">${t('בחירה', 'Select')}</option>` +
      [['s', 'עד 20 מ״ר', 'Up to 20 m²'], ['m', '20–50 מ״ר', '20–50 m²'], ['l', '50–100 מ״ר', '50–100 m²'], ['xl', '100+ מ״ר', '100+ m²'], ['u', 'עוד לא יודעים', 'Not sure yet']]
        .map(o => `<option value="${o[0]}">${t(o[1], o[2])}</option>`).join('');
    fSize.value = cs;
  }
  fShow.addEventListener('change', () => { if (fShow.value && fShow.value !== 'other') setShow(fShow.value, true); });

  /* ---- everything that depends on show + language ---- */
  const dyn = k => document.querySelectorAll(`[data-dyn="${k}"]`);
  const setText = (k, s) => dyn(k).forEach(el => { el.textContent = s; });
  const setHTML = (k, s) => dyn(k).forEach(el => { el.innerHTML = s; });
  let openId = null;

  function render() {
    const s = state.show && SHOWS[state.show];
    const showName = s ? s.name : '';
    setText('cta', s ? t(`נדבר על הביתן שלכם ב-${showName}`, `Talk about your booth at ${showName}`) : t('נדבר על הביתן שלכם', 'Talk about your booth'));
    const ours = s ? P.filter(p => p.show === state.show).length : 0;
    setText('hint', !s ? t('או לחצו על כל מגרש מואר כדי להיכנס לביתן.', 'Or tap any lit plot to walk into its booth.')
      : ours ? t(`${ours === 1 ? 'ביתן אחד שלנו' : ours + ' ביתנים שלנו'} ב-${PAST[state.show] || showName}. לחצו על מגרש כדי להיכנס.`,
        `${ours === 1 ? 'One booth' : ours + ' booths'} we built at ${PAST[state.show] || showName}. Tap a plot to walk in.`)
        : t(`ב-${showName} עוד אין לנו ביתן סייבר בתמונות. לחצו על כל מגרש אחר כדי להיכנס.`,
          `No cyber booth from ${showName} in these photos yet. Tap any other plot to walk in.`));
    setText('plan-yours', s ? t(`המגרש שלכם, ${showName} 2027`, `Your plot, ${showName} 2027`) : t('המגרש שלכם', 'Your plot'));
    setText('plan-yours-sub', s ? s.label : t('2027, עוד ריק', '2027, still empty'));
    document.querySelectorAll('[data-dyn-label]').forEach(el => {
      const p = byId[el.dataset.dynLabel];
      el.textContent = t(`פתיחת הביתן של ${p.client}, ${where(p)}`, `Open the ${p.client} booth, ${where(p)}`);
    });
    // countdown (the authored silence): real dates, computed months
    const ts = s || SHOWS.rsac, tk = state.show || 'rsac';
    setText('when', t(`${ts.name} 2027, ${ts.he}: ${ts.label}.`, `${ts.name} 2027, ${ts.en}: ${ts.label}.`));
    setHTML('left', `<em>${monthsWords(monthsTo(ts.start))}.</em> ${t('המגרש שלכם עוד ריק.', 'Your plot is still empty.')}`);
    // the peak
    const label = state.company ? `${state.company}, ${s ? showName + ' 2027' : '2027'}` : (s ? t(`המגרש שלכם, ${showName} 2027`, `Your plot, ${showName} 2027`) : t('המגרש שלכם, 2027', 'Your plot, 2027'));
    setText('tag', label);
    setText('stencil', s ? `${showName} 2027` : '2027');
    const nb = x => `<span class="nw">${x}</span>`;
    setHTML('offer-h', s ? t(`נדבר על הביתן שלכם ${nb('ב-' + showName + ' 2027.')}`, `Let's talk about your booth ${nb('at ' + showName + ' 2027.')}`) : t(`נדבר על הביתן שלכם ${nb('ב-2027.')}`, `Let's talk about your booth ${nb('in 2027.')}`));
    // act 2 content follows the show
    const lead = byId[LEAD[tk]] || byId.zero;
    if (lead.id !== openId) buildOpen(lead);
    setText('op-client', lead.client);
    setText('op-where', where(lead));
    fillSelects();
  }

  function setShow(k, fromForm) {
    state.show = k;
    [heroHall, flyHall].forEach(h => {
      if (k) h.dataset.show = k; else delete h.dataset.show;
      h.querySelectorAll('.plot--bcb').forEach(b => b.classList.toggle('on', !!k && b.dataset.show === k));
    });
    flyHall.classList.toggle('hall--lit', true);
    chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.show === k)));
    if (!fromForm) fShow.value = k || '';
    render();
  }

  /* ---- act 2: the opening ---- */
  const opMedia = $('#op-media'), opIndex = $('#op-index');
  let opImgs = [];
  function buildOpen(p) {
    openId = p.id;
    const src = i => (big() ? p.full(i) : p.small(i));
    opMedia.innerHTML = p.picks.slice(0, 4).map((i, n) => `<img src="${src(i)}" alt="${p.client}, ${where(p)}" ${n ? 'loading="lazy"' : ''} decoding="async">`).join('');
    opImgs = [...opMedia.querySelectorAll('img')];
    opIndex.innerHTML = opImgs.map(() => '<i></i>').join('');
    $('#op-tag').innerHTML = `<b>${p.client}</b><small>${PAST[p.show]} ${p.year}</small>`;
  }
  $('#op-all').addEventListener('click', () => {
    const cur = Math.max(0, opIndex.querySelectorAll('i.on').length - 1);
    openBooth(openId, null, byId[openId].picks[cur]);
  });

  /* ---- scroll-driven acts ---- */
  const actHall = $('#hall'), actOpen = $('#open'), actFly = $('#fly');
  const far = $('.far'), heroCopy = $('.hero-copy'), nearTape = $('.near-tape'), chooser = $('#chooser');
  const opFrame = $('#op-frame'), opIntro = $('#op-intro'), opCap = $('#op-cap');
  const opT = { top: $('.op-t--top'), bottom: $('.op-t--bottom'), left: $('.op-t--left'), right: $('.op-t--right') };
  const flyCopy = $('.fly-copy'), opTag = $('#op-tag');
  const yours = $('#yours'), yt = [...document.querySelectorAll('.yt')];
  const pOf = el => parseFloat(el.style.getPropertyValue('--sc-p')) || 0;

  function frameHall() {
    const p = pOf(actHall);
    const e = ease(p / .55);
    const rx = lerp(big() ? 64 : 56, 0, e), sc = lerp(big() ? 1.3 : 1.1, 1, e), ty = lerp(big() ? 21 : 9, 0, e);
    heroHall.style.transform = `translateY(${ty}vh) rotateX(${rx}deg) scale(${sc})`;
    heroHall.style.setProperty('--glow', lerp(.88, .5, e).toFixed(3));
    far.style.transform = `translateY(${-14 * p}vh) scale(${1.08 - .08 * p})`;
    far.style.opacity = String(lerp(.9, .25, e));
    const c = smooth((p - .08) / .3);
    heroCopy.style.opacity = String(1 - c);
    heroCopy.style.transform = `translateY(${-9 * c}vh)`;
    heroCopy.style.visibility = c >= .999 ? 'hidden' : '';
    const n = smooth(p / .32);
    nearTape.style.opacity = String(.9 * (1 - n));
    nearTape.style.transform = `translateY(${-70 * n}vh) rotate(${document.dir === 'rtl' ? 8 : -8}deg)`;
    const ch = smooth((p - .42) / .2);
    chooser.style.opacity = String(ch);
    chooser.style.transform = `translateY(${(1 - ch) * 24}px)`;
    chooser.style.pointerEvents = ch > .5 ? '' : 'none';
    chooser.setAttribute('aria-hidden', ch > .5 ? 'false' : 'true');
  }

  function frameOpen() {
    const p = pOf(actOpen);
    const vw = innerWidth, vh = innerHeight;
    const W0 = big() ? Math.min(vw * .38, 620) : vw * .76, H0 = big() ? W0 / 1.45 : W0 * .78;
    const g = ease((p - .1) / .38);
    const ix = lerp((vw - W0) / 2, 0, g), iy = lerp((vh - H0) / 2 + (big() ? vh * .06 : vh * .04), 0, g);
    const iyb = lerp((vh - H0) / 2 - (big() ? vh * .06 : vh * .04), 0, g);
    opFrame.style.clipPath = `inset(${iy}px ${ix}px ${iyb}px ${ix}px)`;
    const s0 = Math.max(W0 / vw, H0 / vh) * 1.04;
    opMedia.style.transform = `translateY(${(iy - iyb) / 2}px) scale(${lerp(s0, 1, g)})`;
    opTag.style.transform = `translate(${document.dir === 'rtl' ? -ix : ix}px, ${-iyb}px)`;
    opTag.style.opacity = String(1 - smooth(g / .25));
    opMedia.style.filter = `brightness(${lerp(.7, 1, g)})`;
    // tape rides the edges, then is pushed off the frame
    const tw = big() ? 8 : 5, out = smooth((g - .82) / .18);
    const w = vw - 2 * ix, h = vh - iy - iyb;
    opT.top.style.transform = `translate(${ix - 6}px, ${iy - tw / 2 - out * 30}px) scaleX(${(w + 12) / vw})`;
    opT.bottom.style.transform = `translate(${ix - 4}px, ${vh - iyb - tw / 2 + out * 30}px) scaleX(${(w + 10) / vw})`;
    opT.left.style.transform = `translate(${ix - tw / 2 - out * 30}px, ${iy - 5}px) scaleY(${(h + 10) / vh})`;
    opT.right.style.transform = `translate(${vw - ix - tw / 2 + out * 30}px, ${iy - 4}px) scaleY(${(h + 8) / vh})`;
    Object.values(opT).forEach(el => { el.style.opacity = String(1 - out); });
    const intro = smooth((p - .06) / .12);
    opIntro.style.opacity = String(1 - intro);
    opIntro.style.transform = `translateY(${-30 * intro}px)`;
    opCap.style.opacity = String(smooth((g - .7) / .3));
    opCap.style.pointerEvents = g > .9 ? '' : 'none';
    // the booth's other angles, wiping in from the inline end
    const k = opImgs.length - 1, rtl = document.dir === 'rtl';
    let shown = 1;
    for (let i = 1; i <= k; i++) {
      const a = .52 + (i - 1) * (.44 / k), r = ease((p - a) / (.44 / k * .8));
      if (r > .5) shown = i + 1;
      opImgs[i].style.clipPath = rtl ? `inset(0 ${100 * (1 - r)}% 0 0)` : `inset(0 0 0 ${100 * (1 - r)}%)`;
    }
    opIndex.querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i < shown));
    opIndex.style.opacity = String(smooth((g - .8) / .2));
  }

  function frameFly() {
    const p = pOf(actFly);
    const vw = innerWidth, vh = innerHeight;
    const W = flyHall.offsetWidth, H = flyHall.offsetHeight;
    const e = smooth(p);
    const tx = lerp(-(W - vw) / 2 * .92, (W - vw) / 2 * .92, e);
    const ty = lerp((H - vh) / 2 * .62, -(H - vh) / 2 * .78, e);
    flyHall.style.transform = `translate(${tx}px, ${ty}px) rotateX(${lerp(34, 22, e)}deg) rotateZ(${lerp(-4, 3, e)}deg)`;
    const c = smooth((p - .3) / .1);
    flyCopy.style.opacity = String(1 - c);
    flyCopy.style.transform = `translateY(${c * 20}px)`;
  }

  let litDone = false;
  function frameOffer() {
    if (litDone) return;
    const r = yours.getBoundingClientRect(), vh = innerHeight;
    const pr = clamp01((vh * .92 - r.top) / (vh * .62));
    yt.forEach((el, i) => {
      const s = smooth(pr * 4 - i);
      el.style.transform = (i % 2 === 0 ? `scaleX(${s})` : `scaleY(${s})`);
    });
    if (pr >= 1) { litDone = true; yours.classList.add('lit'); yours.parentElement.classList.add('lit'); }
  }

  let ticking = false;
  function frame() {
    ticking = false;
    if (!reduce) { frameHall(); frameOpen(); frameFly(); }
    frameOffer();
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  // The engine writes --sc-p on its own rAF; follow it every frame while the page moves.
  (function loop() { frame(); requestAnimationFrame(loop); })();
  addEventListener('resize', req);

  if (reduce) {
    litDone = true; yours.classList.add('lit'); yours.parentElement.classList.add('lit');
    chooser.style.opacity = '1';
    flyHall.style.transform = 'none';
  }

  /* ---- the opened booth (FLIP from the plot's taped outline) ---- */
  const ov = $('#ov'), ovClip = $('#ov-clip'), ovImg = $('#ov-img'), ovBg = $('#ov-bg'), ovT = [...ov.querySelectorAll('.ov-t')];
  const ovTitle = $('#ov-title'), ovWhere = $('#ov-where'), ovThumbs = $('#ov-thumbs'), ovCta = $('#ov-cta');
  let ovP = null, ovI = 1, ovFrom = null, lastFocus = null;

  function ovShow(i) {
    ovI = i;
    const src = big() ? ovP.full(i) : ovP.small(i);
    ovImg.src = src; ovBg.src = ovP.small(i);
    ovImg.alt = `${ovP.client}, ${where(ovP)}`;
    ovThumbs.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', String(+b.dataset.i === i)));
    const cur = ovThumbs.querySelector('[aria-current="true"]');
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function rectInset(r) {
    const vw = innerWidth, vh = innerHeight;
    return `inset(${Math.max(0, r.top)}px ${Math.max(0, vw - r.right)}px ${Math.max(0, vh - r.bottom)}px ${Math.max(0, r.left)}px)`;
  }
  function tapeTo(r, ms, closing) {
    const vw = innerWidth, vh = innerHeight, tw = big() ? 7 : 5;
    const full = { top: 0, left: 0, right: vw, bottom: vh, width: vw, height: vh };
    const geo = q => [
      [`translate(${q.left - 5}px, ${q.top - tw / 2}px) scale(${(q.width + 10) / vw}, 1)`, vw, tw],
      [`translate(${q.left - 3}px, ${q.bottom - tw / 2}px) scale(${(q.width + 8) / vw}, 1)`, vw, tw],
      [`translate(${q.left - tw / 2}px, ${q.top - 4}px) scale(1, ${(q.height + 8) / vh})`, tw, vh],
      [`translate(${q.right - tw / 2}px, ${q.top - 3}px) scale(1, ${(q.height + 6) / vh})`, tw, vh],
    ];
    const a = geo(closing ? full : r), b = geo(closing ? r : full);
    ovT.forEach((el, i) => {
      el.style.width = a[i][1] + 'px'; el.style.height = a[i][2] + 'px';
      if (reduce) { el.style.opacity = '0'; return; }
      el.animate([{ transform: a[i][0] }, { transform: b[i][0] }], { duration: ms, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
      el.animate([{ opacity: 1 }, { opacity: 1, offset: .82 }, { opacity: closing ? 1 : 0 }], { duration: ms, fill: 'forwards' });
    });
  }
  function openBooth(id, fromEl, startI) {
    ovP = byId[id]; if (!ovP) return;
    lastFocus = document.activeElement;
    ovFrom = fromEl || null;
    ovTitle.textContent = ovP.client;
    ovWhere.textContent = where(ovP);
    ovThumbs.innerHTML = Array.from({ length: ovP.n }, (_, k) => k + 1).map(i =>
      `<button type="button" data-i="${i}" aria-label="${t('תמונה', 'Photo')} ${i}"><img src="${ovP.small(i)}" alt="" loading="lazy"></button>`).join('');
    const showName = SHOWS[ovP.show] ? SHOWS[ovP.show].name : PAST[ovP.show];
    ovCta.textContent = t(`נדבר על ביתן כזה ב-${showName} 2027`, `Talk about a booth like this at ${showName} 2027`);
    ovShow(startI || ovP.picks[0]);
    ov.hidden = false; ov.classList.remove('ready');
    document.documentElement.style.overflow = 'hidden';
    const r = fromEl ? fromEl.getBoundingClientRect() : { top: innerHeight * .2, bottom: innerHeight * .8, left: innerWidth * .2, right: innerWidth * .8, width: innerWidth * .6, height: innerHeight * .6 };
    const ms = reduce ? 0 : 760;
    if (!reduce) {
      ovClip.animate([{ clipPath: rectInset(r) }, { clipPath: 'inset(0px 0px 0px 0px)' }], { duration: ms, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'none' });
      ovImg.animate([{ transform: `scale(${Math.max(r.width / innerWidth, r.height / innerHeight)})`, opacity: .85 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: ms, easing: 'cubic-bezier(.7,0,.2,1)' });
    }
    tapeTo(r, ms, false);
    setTimeout(() => { ov.classList.add('ready'); $('#ov-close').focus({ preventScroll: true }); }, reduce ? 0 : ms - 120);
  }
  function closeBooth(then) {
    if (ov.hidden) return;
    const done = () => {
      ov.hidden = true; ov.classList.remove('ready');
      document.documentElement.style.overflow = '';
      ovT.forEach(el => el.getAnimations().forEach(a => a.cancel()));
      if (then) then(); else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    const r = ovFrom && ovFrom.isConnected ? ovFrom.getBoundingClientRect() : null;
    const visible = r && r.bottom > 0 && r.top < innerHeight && r.width > 4;
    if (reduce || !visible || then) {
      if (reduce) return done();
      ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260 }).onfinish = done; return;
    }
    ov.classList.remove('ready');
    tapeTo(r, 600, true);
    ovClip.animate([{ clipPath: 'inset(0px 0px 0px 0px)' }, { clipPath: rectInset(r) }], { duration: 600, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' })
      .onfinish = () => { ovClip.getAnimations().forEach(a => a.cancel()); done(); };
  }
  const step = d => { const i = ((ovI - 1 + d + ovP.n) % ovP.n) + 1; ovShow(i); };
  $('#ov-close').addEventListener('click', () => closeBooth());
  // prev/next are physical (left/right arrows), so they read the same in both languages
  $('#ov-prev').addEventListener('click', () => step(document.dir === 'rtl' ? 1 : -1));
  $('#ov-next').addEventListener('click', () => step(document.dir === 'rtl' ? -1 : 1));
  ovThumbs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) ovShow(+b.dataset.i); });
  ovCta.addEventListener('click', () => {
    const k = ovP.show;
    closeBooth(() => { setShow(k); $('#offer').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
  });
  addEventListener('keydown', e => {
    if (ov.hidden) return;
    if (e.key === 'Escape') closeBooth();
    else if (e.key === 'ArrowLeft') step(document.dir === 'rtl' ? 1 : -1);
    else if (e.key === 'ArrowRight') step(document.dir === 'rtl' ? -1 : 1);
    else if (e.key === 'Tab') {
      const f = [...ov.querySelectorAll('button')].filter(b => b.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  let sx = null;
  ov.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  ov.addEventListener('touchend', e => {
    if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });

  /* ---- language ---- */
  function setLang(l) {
    state.lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
    document.querySelectorAll('.lang-toggle button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    document.title = l === 'he' ? 'המגרש | ביימן כהן בירן' : 'The Plot | Beiman Cohen Biran';
    try { localStorage.setItem('bcb-lang', l); } catch (e) {}
    render();
    if (!ov.hidden && ovP) { ovWhere.textContent = where(ovP); }
  }
  document.querySelectorAll('.lang-toggle button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

  /* ---- WhatsApp (Matan's number is not known yet) ---- */
  const WA = ''; // ⚠️ Matan's WhatsApp number, E.164 without "+"
  function toast(msg) {
    let el = document.querySelector('.bcb-toast');
    if (!el) { el = document.createElement('div'); el.className = 'bcb-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('on'); clearTimeout(el._h); el._h = setTimeout(() => el.classList.remove('on'), 3800);
  }
  document.querySelectorAll('[data-wa]').forEach(b => b.addEventListener('click', () => {
    const s = state.show && SHOWS[state.show];
    const txt = t(`היי מתן, ראיתי את הביתנים שבניתם לחברות סייבר.${s ? ' אנחנו מציגים ב-' + s.name + ' 2027.' : ''} אפשר לדבר?`,
      `Hi Matan, I saw the booths you built for cyber companies.${s ? ' We are exhibiting at ' + s.name + ' 2027.' : ''} Can we talk?`);
    if (!WA) { toast(t('⚠️ טיוטה: מספר הוואטסאפ של מתן עוד לא הוכנס', "⚠️ Draft: Matan's WhatsApp number is not set yet")); return; }
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
  }));

  /* ---- form (draft: validates and shows the thank-you state, sends nothing) ---- */
  const form = $('#lead');
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.querySelectorAll('.err').forEach(x => x.classList.remove('err'));
    const bad = [...form.querySelectorAll('[required]')].filter(i => !i.value.trim());
    if (bad.length) { bad.forEach(i => i.closest('label').classList.add('err')); bad[0].focus(); return; }
    const email = form.email, phone = form.phone;
    if (!email.value.trim() && !phone.value.trim()) { phone.closest('label').classList.add('err'); phone.focus(); return; }
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.closest('label').classList.add('err'); email.focus(); return; }
    state.company = form.company.value.trim();
    if (fShow.value && fShow.value !== 'other' && fShow.value !== state.show) setShow(fShow.value, true); else render();
    form.classList.add('sent');
    form.querySelector('.thanks').focus();
  });

  /* ---- start ---- */
  let lang = 'he';
  const q = new URLSearchParams(location.search);
  if (q.get('lang') === 'en' || q.get('lang') === 'he') lang = q.get('lang');
  else { try { const s = localStorage.getItem('bcb-lang'); if (s === 'en' || s === 'he') lang = s; } catch (e) {} }
  if (q.get('show') && SHOWS[q.get('show')]) state.show = q.get('show');
  setLang(lang);
  setShow(state.show);
  mobileMQ.addEventListener('change', () => { openId = null; render(); });
  window.__plot = { setShow, openBooth, closeBooth, state };
})();
