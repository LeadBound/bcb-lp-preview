/* BCB landing pages: shared data + HE/EN toggle + WhatsApp + form (draft, no backend). */
(function () {
  const A = 'assets/cyber/';
  // Real projects from BCB's photo folders (Cyber). show = key into SHOWS.
  const PROJECTS = [
    { id: 'zero', client: 'Zero Networks', show: 'bh', year: 2025, n: 7, hero: 2, he: 'Black Hat, לאס וגאס', en: 'Black Hat, Las Vegas' },
    { id: 'ox', client: 'OX Security', show: 'rsac', year: 2026, n: 8, hero: 6, he: 'RSAC, סן פרנסיסקו', en: 'RSAC, San Francisco' },
    { id: 'novee', client: 'Novee', show: 'bh', year: 2026, n: 8, hero: 3, he: 'Black Hat, לאס וגאס', en: 'Black Hat, Las Vegas' },
    { id: 'astelia', client: 'Astelia', show: 'bh', year: 2026, n: 5, hero: 2, he: 'Black Hat, לאס וגאס', en: 'Black Hat, Las Vegas' },
    { id: 'pentera-ct', client: 'Pentera', show: 'cybertech', year: 2023, n: 3, hero: 1, he: 'Cybertech, תל אביב', en: 'Cybertech, Tel Aviv' },
    { id: 'pentera-gices', client: 'Pentera', show: 'gisec', year: 2023, n: 5, hero: 3, he: 'GISEC, דובאי', en: 'GISEC, Dubai' },
    { id: 'sepio-info', client: 'Sepio', show: 'infosec', year: 2025, n: 3, hero: 2, he: 'Infosecurity Europe, לונדון', en: 'Infosecurity Europe, London' },
    { id: 'sepio-rsa', client: 'Sepio', show: 'rsac', year: 2024, n: 3, hero: 2, he: 'RSAC, סן פרנסיסקו', en: 'RSAC, San Francisco' },
    { id: 'cognyte', client: 'Cognyte', show: 'iss', year: 2024, n: 3, hero: 1, he: 'ISS World, דובאי', en: 'ISS World, Dubai' },
  ];
  const FILE = {
    zero: 'black-hat-lv-2025-zero', ox: 'rsa-2026-ox', novee: 'black-hat-2026-novee', astelia: 'black-hat-2026-astelia',
    'pentera-ct': 'cybertech-2023-pentera', 'pentera-gices': 'gices-2023-dubai-pentera', 'sepio-info': 'infosec-2025-sepio',
    'sepio-rsa': 'rsa-2024-sepio', cognyte: 'iss-dubai-2024-cognyte',
  };
  PROJECTS.forEach(p => {
    p.imgs = Array.from({ length: p.n }, (_, i) => A + FILE[p.id] + '-' + (i + 1));
    p.cover = p.imgs[p.hero - 1];
  });
  // 2027 dates from BCB's own show list (Matan, 18.11.2026).
  const SHOWS = {
    rsac: { name: 'RSAC', he: 'סן פרנסיסקו', en: 'San Francisco', start: '2027-04-05', label: '5–8.4.2027' },
    gisec: { name: 'GISEC', he: 'דובאי', en: 'Dubai', start: '2027-05-04', label: '4–6.5.2027' },
    iss: { name: 'ISS World', he: 'פראג ודובאי', en: 'Prague & Dubai', start: '2027-06-01', label: '1–3.6.2027' },
    infosec: { name: 'Infosecurity Europe', he: 'לונדון', en: 'London', start: '2027-06-08', label: '8–10.6.2027' },
    bh: { name: 'Black Hat USA', he: 'לאס וגאס', en: 'Las Vegas', start: '2027-07-31', label: '31.7–5.8.2027' },
    itsa: { name: 'it-sa', he: 'נירנברג', en: 'Nuremberg', start: '2027-10-05', label: '5–7.10.2027' },
    cybertech: { name: 'Cybertech Global', he: 'תל אביב', en: 'Tel Aviv', start: '2027-01-25', label: '25–27.1.2027' },
  };
  const monthsTo = iso => {
    const d = new Date(iso), n = new Date();
    return Math.max(0, Math.round((d - n) / (1000 * 60 * 60 * 24 * 30.44)));
  };

  /* ---- language ---- */
  const DICT = {
    he: { name: 'שם', company: 'חברה', phone: 'טלפון', email: 'אימייל', show: 'באיזו תערוכה?', size: 'גודל ביתן משוער', other: 'תערוכה אחרת', unknown: 'עוד לא יודעים', pick: 'בחירה' },
    en: { name: 'Name', company: 'Company', phone: 'Phone', email: 'Email', show: 'Which show?', size: 'Approx. booth size', other: 'Another show', unknown: 'Not sure yet', pick: 'Select' },
  };
  function getLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'he') return q;
    try { const s = localStorage.getItem('bcb-lang'); if (s) return s; } catch (e) {}
    return 'he';
  }
  function setLang(l) {
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-ph]').forEach(el => { el.placeholder = DICT[l][el.dataset.ph] || ''; });
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = DICT[l][el.dataset.t] || el.textContent; });
    document.querySelectorAll('.lang-toggle button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    try { localStorage.setItem('bcb-lang', l); } catch (e) {}
    document.dispatchEvent(new CustomEvent('bcb:lang', { detail: l }));
  }

  /* ---- WhatsApp (Matan's number is not known yet) ---- */
  const WA = ''; // ⚠️ Matan's WhatsApp number, E.164 without "+", e.g. 9725XXXXXXXX
  function toast(msg) {
    let t = document.querySelector('.bcb-toast');
    if (!t) { t = document.createElement('div'); t.className = 'bcb-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3800);
  }
  function openWA(showName) {
    const l = document.documentElement.lang;
    const txt = l === 'he'
      ? `היי מתן, ראיתי את הביתנים שבניתם לחברות סייבר.${showName ? ' אנחנו מציגים ב-' + showName + '.' : ''} אפשר לדבר?`
      : `Hi Matan, I saw the booths you built for cyber companies.${showName ? ' We are exhibiting at ' + showName + '.' : ''} Can we talk?`;
    if (!WA) { toast(l === 'he' ? '⚠️ טיוטה: מספר הוואטסאפ של מתן עוד לא הוכנס' : '⚠️ Draft: Matan\'s WhatsApp number is not set yet'); return; }
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
  }

  /* ---- form (draft: validates and shows the thank-you state, sends nothing) ---- */
  function wireForm(form) {
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = [...form.querySelectorAll('[required]')].filter(i => !i.value.trim());
      form.querySelectorAll('.err').forEach(x => x.classList.remove('err'));
      if (bad.length) { bad.forEach(i => i.closest('label')?.classList.add('err')); bad[0].focus(); return; }
      const email = form.querySelector('[type=email]'), phone = form.querySelector('[type=tel]');
      if (email && phone && !email.value.trim() && !phone.value.trim()) { phone.closest('label').classList.add('err'); phone.focus(); return; }
      form.classList.add('sent');
      form.querySelector('.thanks')?.focus();
    });
  }

  window.BCB = { PROJECTS, SHOWS, monthsTo, setLang, getLang, openWA, wireForm, toast };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-toggle button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    document.querySelectorAll('[data-wa]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openWA(b.dataset.wa || ''); }));
    setLang(getLang());
  });
})();
