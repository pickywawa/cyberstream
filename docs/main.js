// Cyberstream site: gallery tabs, install tabs, copy buttons, typed terminal, lightbox, reveal.
const EN = document.documentElement.lang === 'en';
const T = EN ? { copy: 'copy', copied: 'copied ✓', shot: 'Screenshot: ' } : { copy: 'copier', copied: 'copié ✓', shot: 'Capture : ' };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// tab lists (gallery + install)
for (const list of document.querySelectorAll('[role=tablist]')) {
  const tabs = [...list.querySelectorAll('[role=tab]')];
  const select = (tab) => {
    for (const t of tabs) t.setAttribute('aria-selected', String(t === tab));
    if (tab.dataset.src) {
      const img = document.getElementById('stage-img');
      const cap = document.getElementById('stage-cap');
      img.classList.add('fade');
      const next = new Image();
      next.src = tab.dataset.src;
      next.onload = () => {
        img.src = tab.dataset.src;
        img.alt = T.shot + tab.textContent.trim();
        cap.textContent = tab.dataset.cap || '';
        img.classList.remove('fade');
      };
    }
    if (tab.dataset.panel) {
      for (const t of tabs) document.getElementById(t.dataset.panel).hidden = t !== tab;
    }
  };
  list.addEventListener('click', (e) => {
    const tab = e.target.closest('[role=tab]');
    if (tab) select(tab);
  });
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0 || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    n.focus();
    select(n);
  });
}
// preload gallery images after load
addEventListener('load', () => {
  for (const t of document.querySelectorAll('[data-src]')) new Image().src = t.dataset.src;
});

// copy buttons
for (const b of document.querySelectorAll('.copy')) {
  b.addEventListener('click', async () => {
    const text = b.parentElement.querySelector('code').textContent;
    try {
      await navigator.clipboard.writeText(text);
      b.textContent = T.copied;
      b.classList.add('ok');
      setTimeout(() => { b.textContent = T.copy; b.classList.remove('ok'); }, 1600);
    } catch { /* clipboard unavailable */ }
  });
}

// typed terminal
const typed = document.querySelector('.typed');
if (typed) {
  const lines = JSON.parse(typed.dataset.lines);
  if (reduce) typed.textContent = lines[0];
  else {
    let li = 0, ci = 0, del = false;
    const tick = () => {
      const s = lines[li];
      typed.textContent = s.slice(0, ci);
      if (!del && ci < s.length) { ci++; return setTimeout(tick, 55 + Math.random() * 50); }
      if (!del) { del = true; return setTimeout(tick, 1800); }
      if (ci > 0) { ci--; return setTimeout(tick, 22); }
      del = false; li = (li + 1) % lines.length;
      setTimeout(tick, 350);
    };
    tick();
  }
}

// lightbox
const lb = document.querySelector('.lightbox');
document.querySelector('.stage')?.addEventListener('click', () => {
  const img = document.getElementById('stage-img');
  lb.querySelector('img').src = img.src;
  lb.querySelector('img').alt = img.alt;
  lb.hidden = false;
});
lb.addEventListener('click', () => (lb.hidden = true));
addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.hidden = true; });

// reveal on scroll
if (!reduce && 'IntersectionObserver' in window) {
  const els = document.querySelectorAll('.sec-head, .feat, .stage, .phones, .arch, .perf, .install, .final, .stats');
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }, { threshold: 0.12 });
  els.forEach((el, i) => {
    el.classList.add('reveal');
    if (el.classList.contains('feat')) el.style.transitionDelay = (i % 3) * 80 + 'ms';
    io.observe(el);
  });
}
