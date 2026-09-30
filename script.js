/* ============================================================
   BS-CYS NOTES HUB — Shared Scripts (v2)
   themes · canvas FX · tabs · flips · checklists + confetti
   worked examples · copy code · keyboard shortcuts
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ================= THEME MANAGER ================= */
  const THEMES = ['midnight', 'matrix', 'paper', 'synthwave', 'aurora', 'cyberpunk', 'dracula', 'coffee'];
  const wrap = document.querySelector('.theme-wrap');
  const btn = document.getElementById('themeBtn');

  function applyTheme(name, animate) {
    if (!THEMES.includes(name)) name = 'midnight';
    if (animate) {
      document.documentElement.classList.add('theme-anim');
      setTimeout(() => document.documentElement.classList.remove('theme-anim'), 650);
    }
    document.documentElement.setAttribute('data-theme', name);
    try { localStorage.setItem('cys-theme', name); } catch (e) {}
    document.querySelectorAll('.theme-opt').forEach(o =>
      o.classList.toggle('on', o.dataset.theme === name));
    startFX(name);
  }

  let saved = 'midnight';
  try { saved = localStorage.getItem('cys-theme') || 'midnight'; } catch (e) {}
  // NOTE: initial applyTheme() is called after the FX layer is defined (below),
  // because startFX() touches fxRaf/fxCanvas which are declared with let.

  if (btn && wrap) {
    btn.addEventListener('click', (e) => { e.stopPropagation(); wrap.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) wrap.classList.remove('open');
    });
    document.querySelectorAll('.theme-opt').forEach(o =>
      o.addEventListener('click', () => { applyTheme(o.dataset.theme, true); wrap.classList.remove('open'); }));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wrap) wrap.classList.remove('open');
    if (e.key.toLowerCase() === 't' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      const cur = document.documentElement.getAttribute('data-theme') || 'midnight';
      applyTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length], true);
    }
  });

  /* ================= FX LAYERS ================= */
  ['scanlines', 'retro-sun', 'floor-grid'].forEach(cls => {
    if (!document.querySelector('.' + cls)) {
      const d = document.createElement('div');
      d.className = cls; d.setAttribute('aria-hidden', 'true');
      document.body.appendChild(d);
    }
  });

  let fxCanvas = document.getElementById('fx-canvas');
  if (!fxCanvas) {
    fxCanvas = document.createElement('canvas');
    fxCanvas.id = 'fx-canvas';
    document.body.insertBefore(fxCanvas, document.body.firstChild);
  }
  const fxCtx = fxCanvas.getContext('2d');
  let fxRaf = null, fxMode = null, rain = [], stars = [];

  function sizeFx() {
    fxCanvas.width = innerWidth; fxCanvas.height = innerHeight;
  }
  addEventListener('resize', () => { sizeFx(); buildFX(); });

  function buildFX() {
    if (fxMode === 'matrix') {
      const cols = Math.floor(fxCanvas.width / 15);
      rain = Array.from({ length: cols }, () => ({
        y: Math.random() * fxCanvas.height,
        v: 2 + Math.random() * 4
      }));
    } else if (fxMode === 'stars') {
      stars = Array.from({ length: 130 }, () => ({
        x: Math.random() * fxCanvas.width,
        y: Math.random() * fxCanvas.height * 0.75,
        r: Math.random() * 1.7 + 0.4,
        p: Math.random() * Math.PI * 2,
        c: ['#ffffff', '#ff9de9', '#9de7ff', '#ffd36e'][Math.floor(Math.random() * 4)]
      }));
    }
  }

  function drawMatrix() {
    fxCtx.fillStyle = 'rgba(1, 6, 3, 0.09)';
    fxCtx.fillRect(0, 0, fxCanvas.width, fxCanvas.height);
    fxCtx.font = '13px Consolas, monospace';
    rain.forEach((col, i) => {
      const ch = String.fromCharCode(0x0400 + Math.floor(Math.random() * 96));
      fxCtx.fillStyle = Math.random() < 0.14 ? '#d9ffe6' : '#00ff6a';
      fxCtx.fillText(ch, i * 15, col.y);
      col.y += col.v;
      if (col.y > fxCanvas.height + 40) { col.y = -20; col.v = 2 + Math.random() * 4; }
    });
    fxRaf = requestAnimationFrame(drawMatrix);
  }

  let starT = 0;
  function drawStars() {
    starT += 0.03;
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    stars.forEach(s => {
      const tw = 0.55 + 0.45 * Math.sin(starT + s.p);
      fxCtx.globalAlpha = tw;
      fxCtx.fillStyle = s.c;
      fxCtx.beginPath();
      fxCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      fxCtx.fill();
    });
    fxCtx.globalAlpha = 1;
    fxRaf = requestAnimationFrame(drawStars);
  }

  function startFX(theme) {
    if (fxRaf) { cancelAnimationFrame(fxRaf); fxRaf = null; }
    fxMode = theme === 'matrix' ? 'matrix' : theme === 'synthwave' ? 'stars' : null;
    sizeFx();
    if (!fxMode) { fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height); return; }
    buildFX();
    fxRaf = fxMode === 'matrix' ? drawMatrix : drawStars;
    if (fxMode === 'matrix') drawMatrix(); else drawStars();
  }

  /* initial theme (must come after startFX exists) */
  applyTheme(saved, false);

  /* ================= SCROLL PROGRESS + TO-TOP ================= */
  const progress = document.getElementById('progress');
  const onScroll = () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    if (progress) progress.style.width = pct + '%';
    const toTop = document.getElementById('toTop');
    if (toTop) toTop.classList.toggle('show', h.scrollTop > 400);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toTop = document.getElementById('toTop');
  if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ================= REVEAL ON SCROLL ================= */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.subject-card, .note-card, .tip-card, .course-week').forEach((el, i) => {
    el.style.animationDelay = (i % 9) * 0.07 + 's';
    observer.observe(el);
  });

  /* ================= TABS ================= */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      panels.forEach(p => p.classList.toggle('active', p.id === target));
      document.querySelectorAll('#' + target + ' .note-card, #' + target + ' .tip-card, #' + target + ' .course-week')
        .forEach(el => el.classList.add('visible'));
      scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ================= FLIP CARDS ================= */
  document.querySelectorAll('.flip-card').forEach(card =>
    card.addEventListener('click', () => card.classList.toggle('flipped')));

  /* ================= CHECKLISTS + CONFETTI ================= */
  const confCanvas = document.createElement('canvas');
  confCanvas.id = 'confetti';
  Object.assign(confCanvas.style, {
    position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 9999, display: 'none'
  });
  document.body.appendChild(confCanvas);
  const confCtx = confCanvas.getContext('2d');
  let confParts = [], confRaf = null;

  function confettiBurst() {
    confCanvas.width = innerWidth; confCanvas.height = innerHeight;
    confCanvas.style.display = 'block';
    const colors = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#3b82f6'];
    confParts = Array.from({ length: 150 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 160,
      y: innerHeight / 2,
      vx: (Math.random() - 0.5) * 15,
      vy: -6 - Math.random() * 9,
      g: 0.32 + Math.random() * 0.2,
      s: 5 + Math.random() * 6,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)],
      life: 1
    }));
    if (confRaf) cancelAnimationFrame(confRaf);
    (function anim() {
      confCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);
      let alive = false;
      confParts.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.008;
        confCtx.save();
        confCtx.globalAlpha = Math.max(p.life, 0);
        confCtx.translate(p.x, p.y); confCtx.rotate(p.r);
        confCtx.fillStyle = p.c;
        confCtx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        confCtx.restore();
      });
      if (alive) confRaf = requestAnimationFrame(anim);
      else { confCanvas.style.display = 'none'; confRaf = null; }
    })();
  }

  document.querySelectorAll('.checklist').forEach(list => {
    list.addEventListener('click', () => {
      const items = list.querySelectorAll('li');
      const done = list.querySelectorAll('li.done');
      if (items.length && done.length === items.length && !list.dataset.celebrated) {
        list.dataset.celebrated = '1';
        confettiBurst();
      } else if (done.length < items.length) {
        delete list.dataset.celebrated;
      }
    });
    list.querySelectorAll('li').forEach(li =>
      li.addEventListener('click', () => li.classList.toggle('done')));
  });

  /* ================= WORKED EXAMPLES (step reveal) ================= */
  document.querySelectorAll('.example').forEach(ex => {
    const steps = [...ex.querySelectorAll('.ex-step')];
    const btn = ex.querySelector('.ex-next');
    let shown = 1;
    const render = () => {
      steps.forEach((s, i) => s.classList.toggle('shown', i < shown));
      if (btn) btn.textContent = shown >= steps.length ? 'Restart ↺' : 'Next step →';
    };
    if (btn) btn.addEventListener('click', () => {
      shown = shown >= steps.length ? 1 : shown + 1;
      render();
    });
    render();
  });

  /* ================= COPY CODE ================= */
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const code = btn.parentElement.innerText.replace(/^Copy$/, '').trim();
      navigator.clipboard.writeText(code).then(() => {
        const old = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = old), 1400);
      }).catch(() => {
        btn.textContent = 'Failed';
        setTimeout(() => (btn.textContent = 'Copy'), 1400);
      });
    });
  });

  /* ================= KEYBOARD ================= */
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (/^[1-9]$/.test(e.key)) {
      const b = tabBtns[+e.key - 1];
      if (b) b.click();
    }
    if (e.key.toLowerCase() === 'r') {
      document.querySelectorAll('.flip-card').forEach(c => c.classList.remove('flipped'));
    }
  });
});
