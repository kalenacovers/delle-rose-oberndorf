/* ════════════════════════════════════════════════════════════════════
   Delle Rose Ristorante Oberndorf — Site behaviors
   ════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ─── Opening hours ────────────────────────────────────────── */
  // Day index: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  // Real schedule: Tue–Sun 11–14 + 17–23, Mon 17–23 (kein Ruhetag)
  const HOURS = {
    0: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '23:00' }],  // So
    1: [{ open: '17:00', close: '23:00' }],                                       // Mo
    2: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '23:00' }],  // Di
    3: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '23:00' }],  // Mi
    4: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '23:00' }],  // Do
    5: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '23:00' }],  // Fr
    6: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '23:00' }],  // Sa
  };

  function parseHM(str) {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  }

  function nowMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function getStatus() {
    const today = new Date().getDay();
    const slots = HOURS[today] || [];
    const now = nowMinutes();

    for (const slot of slots) {
      const o = parseHM(slot.open);
      const c = parseHM(slot.close);
      if (now >= o && now < c) {
        return { state: 'open', current: slot, allToday: slots };
      }
    }
    // not currently open — find next slot today
    const upcoming = slots.find((s) => parseHM(s.open) > now);
    if (upcoming) return { state: 'soon', next: upcoming, allToday: slots };
    return { state: 'closed', allToday: slots };
  }

  function formatSlots(slots) {
    return slots.map((s) => `${s.open}–${s.close}`).join(' · ');
  }

  function setStatus() {
    const status = getStatus();
    const cells = document.querySelectorAll('[data-today-status]');
    cells.forEach((cell) => {
      const valueEl = cell.querySelector('.value') || cell;
      if (status.state === 'open') {
        valueEl.textContent = `Geöffnet · bis ${status.current.close} Uhr`;
        valueEl.classList.add('open');
        valueEl.classList.remove('closed');
      } else if (status.state === 'soon') {
        valueEl.textContent = `Heute ab ${status.next.open} Uhr`;
        valueEl.classList.remove('open', 'closed');
      } else if (status.allToday.length) {
        valueEl.textContent = `Heute geschlossen — morgen ab 11:00`;
        valueEl.classList.add('closed');
        valueEl.classList.remove('open');
      } else {
        valueEl.textContent = `Heute Ruhetag`;
        valueEl.classList.add('closed');
        valueEl.classList.remove('open');
      }
    });
  }

  /* ─── Mobile nav drawer ────────────────────────────────────── */
  function initMobileNav() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const drawer = document.querySelector('[data-mobile-nav]');
    const close = document.querySelector('[data-nav-close]');
    if (!toggle || !drawer) return;

    function openNav() {
      drawer.dataset.open = 'true';
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeNav() {
      drawer.dataset.open = 'false';
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', openNav);
    close?.addEventListener('click', closeNav);

    drawer.querySelectorAll('a').forEach((link) =>
      link.addEventListener('click', closeNav)
    );

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.dataset.open === 'true') closeNav();
    });
  }

  /* ─── Sticky mobile CTA ────────────────────────────────────── */
  function initStickyCta() {
    const bar = document.querySelector('[data-sticky-cta]');
    if (!bar) return;
    const trigger = () => {
      const scrolled = window.scrollY;
      const threshold = window.innerHeight * 0.6;
      bar.dataset.visible = scrolled > threshold ? 'true' : 'false';
    };
    window.addEventListener('scroll', trigger, { passive: true });
    trigger();
  }

  /* ─── Reveal on scroll ─────────────────────────────────────── */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((i) => (i.dataset.visible = 'true'));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.dataset.visible = 'true';
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((i) => obs.observe(i));
  }

  /* ─── Cookie banner ────────────────────────────────────────── */
  function initCookieBanner() {
    const banner = document.querySelector('[data-cookie-banner]');
    if (!banner) return;
    const KEY = 'dr-cookie-consent-v1';
    if (localStorage.getItem(KEY)) {
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    banner.querySelectorAll('[data-cookie-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        localStorage.setItem(KEY, btn.dataset.cookieAction);
        banner.hidden = true;
      });
    });
  }

  /* ─── Reservation min date ─────────────────────────────────── */
  function initReservationDate() {
    const input = document.querySelector('input[type="date"][data-reservation-date]');
    if (!input) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    input.min = `${yyyy}-${mm}-${dd}`;
  }

  /* ─── Generic form submit via /api/submit ──────────────────── */
  function initForm(selector, formType) {
    const form = document.querySelector(selector);
    if (!form) return;
    const success = form.querySelector('[data-form-success]');
    const submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      const originalLabel = submitBtn ? submitBtn.textContent : null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wird gesendet …';
      }

      const data = { _type: formType };
      new FormData(form).forEach((val, key) => { data[key] = val; });

      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          form.querySelectorAll('input, select, textarea, button').forEach((el) => (el.disabled = true));
          if (success) {
            success.hidden = false;
            success.focus?.();
            success.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
          alert('Beim Senden ist ein Fehler aufgetreten. Bitte rufen Sie uns direkt an: 07423 · 870 05 70');
        }
      } catch {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
        alert('Keine Verbindung. Bitte rufen Sie uns direkt an: 07423 · 870 05 70');
      }
    });
  }

  function initReservationForm() { initForm('[data-reservation-form]', 'reservation'); }
  function initCateringForm()    { initForm('[data-catering-form]', 'catering'); }

  /* ─── Active menu category ────────────────────────────────── */
  function initMenuActiveCategory() {
    const categoryLinks = document.querySelectorAll('.menu-categories a[href^="#"]');
    if (!categoryLinks.length) return;
    const sections = Array.from(categoryLinks)
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    if (!sections.length) return;

    const map = new Map();
    sections.forEach((sec, i) => map.set(sec.id, categoryLinks[i]));

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            categoryLinks.forEach((l) => l.classList.remove('active'));
            const link = map.get(entry.target.id);
            link?.classList.add('active');
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach((s) => obs.observe(s));
  }

  /* ─── Today's hours highlight in lists ─────────────────────── */
  function initHoursList() {
    const lists = document.querySelectorAll('[data-hours-list]');
    if (!lists.length) return;
    const today = new Date().getDay();
    lists.forEach((list) => {
      const todayRow = list.querySelector(`[data-day="${today}"]`);
      todayRow?.classList.add('today');
    });
  }

  /* ─── Boot ──────────────────────────────────────────────────── */
  function init() {
    setStatus();
    initMobileNav();
    initStickyCta();
    initReveal();
    initCookieBanner();
    initReservationDate();
    initReservationForm();
    initCateringForm();
    initMenuActiveCategory();
    initHoursList();
    setInterval(setStatus, 1000 * 60 * 5);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
