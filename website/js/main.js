// ── Navbar scroll behavior ──
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ── Mobile nav toggle ──
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ── Scroll reveal ──
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => revealObserver.observe(el));

// ── KG card modals (static HTML) ──
const kgCards = document.querySelectorAll('.kg-card[data-modal-target]');
const kgModals = document.querySelectorAll('.kg-modal');

if (kgCards.length && kgModals.length) {
  function openModal(modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.kg-modal.open')) {
      document.body.classList.remove('modal-open');
    }
  }

  kgCards.forEach(card => {
    const targetId = card.getAttribute('data-modal-target');
    const modal = targetId ? document.getElementById(targetId) : null;
    if (!modal) return;

    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.addEventListener('click', () => openModal(modal));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(modal);
      }
    });
  });

  kgModals.forEach(modal => {
    modal.querySelectorAll('[data-close-modal]').forEach(closeTarget => {
      closeTarget.addEventListener('click', () => closeModal(modal));
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.kg-modal.open').forEach(open => closeModal(open));
    }
  });
}

// ── Hero canvas: antique celestial navigation chart ──
const canvas = document.getElementById('heroCanvas');
if (canvas) {

const ctx = canvas.getContext('2d');
let stars = [];
let animFrame;
let tick = 0;

function initCanvas() {
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;

  // Scatter star positions
  const count = Math.floor((w * h) / 9000);
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.4,
      alpha: Math.random() * 0.4 + 0.15,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.006 + 0.002,
      isBright: Math.random() < 0.15,
    });
  }
}

function drawChart() {
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  tick++;

  // Fill with parchment color
  ctx.fillStyle = '#f6f0e2';
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const cy = h * 0.5;
  const maxR = Math.max(w, h) * 0.65;
  const inkColor = 'rgba(30, 21, 8,';
  const goldColor = 'rgba(122, 92, 20,';

  // ── Concentric rings (astrolabe) ──
  [0.12, 0.22, 0.34, 0.47, 0.62, 0.78, 0.94].forEach((f, i) => {
    const r = maxR * f;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const a = i === 0 ? 0.18 : i < 3 ? 0.07 : 0.04;
    ctx.strokeStyle = `${inkColor} ${a})`;
    ctx.lineWidth = i === 0 ? 1.2 : 0.6;
    ctx.stroke();
  });

  // ── Radial bearing lines ──
  const spokeCount = 32;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const inner = maxR * 0.12;
    const outer = maxR * 0.96;
    const isMajor = i % 4 === 0;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.strokeStyle = `${inkColor} ${isMajor ? 0.1 : 0.04})`;
    ctx.lineWidth = isMajor ? 0.8 : 0.4;
    ctx.stroke();
  }

  // ── Coordinate grid (latitude/longitude style) ──
  const gridA = 0.025;
  ctx.strokeStyle = `${inkColor} ${gridA})`;
  ctx.lineWidth = 0.4;
  const gridStep = Math.min(w, h) * 0.08;
  for (let x = 0; x < w; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += gridStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // ── Stars (pulsing ink dots with cross-hairs for bright ones) ──
  stars.forEach(s => {
    s.pulse += s.pulseSpeed;
    const a = s.alpha + Math.sin(s.pulse) * 0.1;

    if (s.isBright) {
      // Draw small navigational cross mark
      const arm = s.r * 3.5;
      ctx.strokeStyle = `${goldColor} ${Math.max(0, a * 0.9)})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(s.x - arm, s.y); ctx.lineTo(s.x + arm, s.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x, s.y - arm); ctx.lineTo(s.x, s.y + arm); ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * (s.isBright ? 1.2 : 0.8), 0, Math.PI * 2);
    ctx.fillStyle = s.isBright
      ? `${goldColor} ${Math.max(0, a)})`
      : `${inkColor} ${Math.max(0, a * 0.6)})`;
    ctx.fill();
  });

  // ── Constellation lines between nearby bright stars ──
  const bright = stars.filter(s => s.isBright);
  for (let i = 0; i < bright.length; i++) {
    for (let j = i + 1; j < bright.length; j++) {
      const dx = bright[i].x - bright[j].x;
      const dy = bright[i].y - bright[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        const la = (1 - dist / 130) * 0.08;
        ctx.beginPath();
        ctx.moveTo(bright[i].x, bright[i].y);
        ctx.lineTo(bright[j].x, bright[j].y);
        ctx.strokeStyle = `${goldColor} ${la})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // ── Center compass rose ──
  const roseR = maxR * 0.07;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const isCard = i % 2 === 0;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * roseR * (isCard ? 1 : 0.65), cy + Math.sin(a) * roseR * (isCard ? 1 : 0.65));
    ctx.strokeStyle = `${goldColor} ${isCard ? 0.35 : 0.2})`;
    ctx.lineWidth = isCard ? 1.2 : 0.8;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, roseR * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = `${goldColor} 0.4)`;
  ctx.fill();

  animFrame = requestAnimationFrame(drawChart);
}

initCanvas();
drawChart();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    cancelAnimationFrame(animFrame);
    initCanvas();
    drawChart();
  }, 200);
});

} // end heroCanvas guard

// ── 404 page canvases ──
const bgCanvas = document.getElementById('bgCanvas');
if (bgCanvas) {
  const bgCtx = bgCanvas.getContext('2d');
  let bgStars = [];

  function initBg() {
    bgCanvas.width = bgCanvas.offsetWidth * window.devicePixelRatio;
    bgCanvas.height = bgCanvas.offsetHeight * window.devicePixelRatio;
    bgCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = bgCanvas.offsetWidth;
    const h = bgCanvas.offsetHeight;
    const count = Math.floor((w * h) / 12000);
    bgStars = [];
    for (let i = 0; i < count; i++) {
      bgStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.3 + 0.1,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.005 + 0.002,
        isBright: Math.random() < 0.12,
      });
    }
  }

  function drawBg() {
    const w = bgCanvas.offsetWidth;
    const h = bgCanvas.offsetHeight;

    bgCtx.fillStyle = '#f6f0e2';
    bgCtx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxR = Math.max(w, h) * 0.6;
    const ink = 'rgba(30, 21, 8,';
    const gold = 'rgba(122, 92, 20,';

    // Faded concentric rings — off-center, as if the chart has drifted
    const ocx = cx * 1.15;
    const ocy = cy * 0.85;
    [0.15, 0.28, 0.42, 0.58, 0.76, 0.95].forEach((f, i) => {
      bgCtx.beginPath();
      bgCtx.arc(ocx, ocy, maxR * f, 0, Math.PI * 2);
      bgCtx.strokeStyle = `${ink} ${i < 2 ? 0.05 : 0.025})`;
      bgCtx.lineWidth = 0.5;
      bgCtx.stroke();
    });

    // Sparse bearing lines
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      bgCtx.beginPath();
      bgCtx.moveTo(ocx + Math.cos(angle) * maxR * 0.15, ocy + Math.sin(angle) * maxR * 0.15);
      bgCtx.lineTo(ocx + Math.cos(angle) * maxR * 0.95, ocy + Math.sin(angle) * maxR * 0.95);
      bgCtx.strokeStyle = `${ink} ${i % 4 === 0 ? 0.04 : 0.02})`;
      bgCtx.lineWidth = 0.4;
      bgCtx.stroke();
    }

    // Grid lines — very faint
    const gridStep = Math.min(w, h) * 0.1;
    bgCtx.strokeStyle = `${ink} 0.018)`;
    bgCtx.lineWidth = 0.3;
    for (let x = 0; x < w; x += gridStep) {
      bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, h); bgCtx.stroke();
    }
    for (let y = 0; y < h; y += gridStep) {
      bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(w, y); bgCtx.stroke();
    }

    // Stars
    bgStars.forEach(s => {
      s.pulse += s.pulseSpeed;
      const a = s.alpha + Math.sin(s.pulse) * 0.08;

      if (s.isBright) {
        const arm = s.r * 3;
        bgCtx.strokeStyle = `${gold} ${Math.max(0, a * 0.7)})`;
        bgCtx.lineWidth = 0.5;
        bgCtx.beginPath(); bgCtx.moveTo(s.x - arm, s.y); bgCtx.lineTo(s.x + arm, s.y); bgCtx.stroke();
        bgCtx.beginPath(); bgCtx.moveTo(s.x, s.y - arm); bgCtx.lineTo(s.x, s.y + arm); bgCtx.stroke();
      }

      bgCtx.beginPath();
      bgCtx.arc(s.x, s.y, s.r * (s.isBright ? 1.1 : 0.7), 0, Math.PI * 2);
      bgCtx.fillStyle = s.isBright
        ? `${gold} ${Math.max(0, a)})`
        : `${ink} ${Math.max(0, a * 0.5)})`;
      bgCtx.fill();
    });

    // Constellation lines
    const bright = bgStars.filter(s => s.isBright);
    for (let i = 0; i < bright.length; i++) {
      for (let j = i + 1; j < bright.length; j++) {
        const dx = bright[i].x - bright[j].x;
        const dy = bright[i].y - bright[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          bgCtx.beginPath();
          bgCtx.moveTo(bright[i].x, bright[i].y);
          bgCtx.lineTo(bright[j].x, bright[j].y);
          bgCtx.strokeStyle = `${gold} ${(1 - dist / 120) * 0.06})`;
          bgCtx.lineWidth = 0.4;
          bgCtx.stroke();
        }
      }
    }

    requestAnimationFrame(drawBg);
  }

  // ── Compass rose: slowly drifting, searching ──
  const compassCanvas = document.getElementById('compassCanvas');
  const cCtx = compassCanvas.getContext('2d');
  let compassTick = 0;

  function initCompass() {
    const size = compassCanvas.offsetWidth;
    compassCanvas.width = size * window.devicePixelRatio;
    compassCanvas.height = size * window.devicePixelRatio;
    cCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function drawCompass() {
    const size = compassCanvas.offsetWidth;
    compassTick++;

    cCtx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.42;
    const gold = 'rgba(122, 92, 20,';

    // Slow wandering rotation — the compass can't find north
    const drift = Math.sin(compassTick * 0.008) * 0.4 + Math.sin(compassTick * 0.003) * 0.25;

    cCtx.save();
    cCtx.translate(cx, cy);
    cCtx.rotate(drift);

    // Outer ring
    cCtx.beginPath();
    cCtx.arc(0, 0, r, 0, Math.PI * 2);
    cCtx.strokeStyle = `${gold} 0.35)`;
    cCtx.lineWidth = 1;
    cCtx.stroke();

    // Inner ring
    cCtx.beginPath();
    cCtx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
    cCtx.strokeStyle = `${gold} 0.18)`;
    cCtx.lineWidth = 0.6;
    cCtx.stroke();

    // Tick marks around outer ring
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const isMajor = i % 8 === 0;
      const isMinor = i % 4 === 0;
      const inner = r * (isMajor ? 0.85 : isMinor ? 0.88 : 0.92);
      cCtx.beginPath();
      cCtx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      cCtx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      cCtx.strokeStyle = `${gold} ${isMajor ? 0.5 : isMinor ? 0.3 : 0.15})`;
      cCtx.lineWidth = isMajor ? 1.2 : 0.6;
      cCtx.stroke();
    }

    // Cardinal points — N, S, E, W
    const cardinalR = r * 0.68;
    const labels = ['N', 'E', 'S', 'W'];
    cCtx.font = `500 ${size * 0.07}px 'Cormorant Garamond', Georgia, serif`;
    cCtx.fillStyle = `${gold} 0.55)`;
    cCtx.textAlign = 'center';
    cCtx.textBaseline = 'middle';
    labels.forEach((label, i) => {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
      cCtx.fillText(label, Math.cos(angle) * cardinalR, Math.sin(angle) * cardinalR);
    });

    // Rose points — 8-pointed star
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const isCardinal = i % 2 === 0;
      const len = r * (isCardinal ? 0.52 : 0.32);
      const spread = isCardinal ? 0.08 : 0.06;

      cCtx.beginPath();
      cCtx.moveTo(Math.cos(angle) * len, Math.sin(angle) * len);
      cCtx.lineTo(Math.cos(angle - spread) * r * 0.12, Math.sin(angle - spread) * r * 0.12);
      cCtx.lineTo(0, 0);
      cCtx.lineTo(Math.cos(angle + spread) * r * 0.12, Math.sin(angle + spread) * r * 0.12);
      cCtx.closePath();

      cCtx.fillStyle = `${gold} ${isCardinal && i === 0 ? 0.4 : isCardinal ? 0.2 : 0.1})`;
      cCtx.fill();
      cCtx.strokeStyle = `${gold} ${isCardinal ? 0.4 : 0.2})`;
      cCtx.lineWidth = 0.6;
      cCtx.stroke();
    }

    // Center dot
    cCtx.beginPath();
    cCtx.arc(0, 0, 2.5, 0, Math.PI * 2);
    cCtx.fillStyle = `${gold} 0.5)`;
    cCtx.fill();

    cCtx.restore();
    requestAnimationFrame(drawCompass);
  }

  initBg();
  drawBg();
  initCompass();
  drawCompass();

  let resizeTimer404;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer404);
    resizeTimer404 = setTimeout(() => {
      initBg();
      initCompass();
    }, 200);
  });

} // end bgCanvas guard
