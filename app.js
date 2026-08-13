/* ---------- The Respected Path — interactions ---------- */

/* ===== Route SVG ===== */
(function buildRoute() {
  const svg = document.getElementById('routeSvg');
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1160, H = 240, PAD = 60;
  const n = STOPS.length;
  const pts = STOPS.map((s, i) => ({
    x: PAD + (i / (n - 1)) * (W - PAD * 2),
    y: H / 2 + Math.sin(i * 1.35) * 46,
    ...s
  }));

  // smooth path through points (catmull-rom -> bezier)
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  const glow = document.createElementNS(NS, 'path');
  glow.setAttribute('d', d);
  glow.setAttribute('stroke', 'rgba(70,139,151,.18)');
  glow.setAttribute('stroke-width', '10');
  glow.setAttribute('fill', 'none');
  glow.setAttribute('stroke-linecap', 'round');
  svg.appendChild(glow);

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', 'route-path-line');
  path.setAttribute('stroke', '#468b97');
  path.setAttribute('stroke-width', '2.5');
  path.setAttribute('fill', 'none');
  svg.appendChild(path);

  // draw-on animation
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;
  path.style.strokeDashoffset = `${len}`;
  path.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(.4,0,.2,1)';

  pts.forEach((p, i) => {
    const col = COUNTRIES[p.key].color;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'stop');
    g.setAttribute('data-country', p.key);
    g.setAttribute('role', 'listitem');
    g.style.opacity = '0';
    g.style.transition = `opacity .5s ease ${0.9 + i * 0.14}s`;

    const halo = document.createElementNS(NS, 'circle');
    halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y);
    halo.setAttribute('r', '13'); halo.setAttribute('class', 'halo');
    halo.setAttribute('fill', col); halo.setAttribute('opacity', '.18');
    g.appendChild(halo);

    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', p.x); ring.setAttribute('cy', p.y);
    ring.setAttribute('r', '7'); ring.setAttribute('fill', '#f6eddc');
    ring.setAttribute('stroke', col); ring.setAttribute('stroke-width', '3');
    g.appendChild(ring);

    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
    dot.setAttribute('r', '3'); dot.setAttribute('fill', col);
    g.appendChild(dot);

    const above = i % 2 === 0;
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', p.x); label.setAttribute('y', p.y + (above ? -22 : 34));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'stop-label');
    label.textContent = p.label;
    g.appendChild(label);

    const meta = document.createElementNS(NS, 'text');
    meta.setAttribute('x', p.x); meta.setAttribute('y', p.y + (above ? -38 : 50));
    meta.setAttribute('text-anchor', 'middle');
    meta.setAttribute('class', 'stop-meta');
    meta.textContent = p.sub;
    g.appendChild(meta);

    g.addEventListener('click', () => setFilter(p.key));
    g.addEventListener('mouseenter', () => halo.setAttribute('opacity', '.45'));
    g.addEventListener('mouseleave', () => { if (!g.classList.contains('active')) halo.setAttribute('opacity', '.18'); });
    svg.appendChild(g);
  });

  // trigger when in view
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (e.isIntersecting) {
        path.style.strokeDashoffset = '0';
        svg.querySelectorAll('.stop').forEach(s => s.style.opacity = '1');
        io.disconnect();
      }
    });
  }, { threshold: 0.35 });
  io.observe(svg);
})();

/* ===== Journal grid + filters ===== */
const grid = document.getElementById('grid');
const filtersEl = document.getElementById('filters');
let activeFilter = 'All';

const arrow = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function sunsetSVG() {
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="300" fill="#123c53"/>
    <circle cx="200" cy="150" r="120" fill="#f6eddc" opacity=".1"/>
    <circle cx="200" cy="150" r="92" fill="#f3aa60" opacity=".35"/>
    <circle cx="200" cy="150" r="64" fill="#ef6262" opacity=".5"/>
    <path d="M0 220 L70 140 L120 195 L180 110 L250 200 L310 150 L400 230 L400 300 L0 300 Z" fill="#1d5b79"/>
    <path d="M0 255 L60 205 L130 250 L210 190 L290 250 L360 215 L400 245 L400 300 L0 300 Z" fill="#16303f"/>
    <path d="M0 300 L0 285 Q100 268 200 282 T400 278 L400 300 Z" fill="#468b97" opacity=".7"/>
    <path d="M200 300 L186 300 L200 235 L214 300 Z" fill="#f6eddc" opacity=".9"/>
    <path d="M200 235 L200 300" stroke="#f6eddc" stroke-width="2" opacity=".5"/>
    <path d="M196 262 h8 M194 274 h12 M192 286 h16" stroke="#123c53" stroke-width="1.4" opacity=".6"/>
  </svg>`;
}

function cardHTML(p, featured) {
  const col = COUNTRIES[p.c].color;
  if (featured) {
    return `<a class="card featured reveal" style="--c:${col}" href="${p.href}">
      <div class="feat-body">
        <span class="feat-tag">Latest dispatch</span>
        <h3>${p.t}</h3>
        <div class="feat-date">${p.d} · ${p.c}</div>
        <p>${p.x}</p>
        <span class="card-more">Read the entry ${arrow}</span>
      </div>
      <div class="feat-visual">${sunsetSVG()}</div>
    </a>`;
  }
  return `<a class="card reveal" style="--c:${col}" href="${p.href}">
    <div class="card-top"><span class="card-country">${p.c}</span><span>${p.d}</span></div>
    <h3>${p.t}</h3>
    <p>${p.x}</p>
    <span class="card-more">Read the entry ${arrow}</span>
  </a>`;
}

function renderGrid() {
  const shown = POSTS.filter(p => activeFilter === 'All' || p.c === activeFilter);
  let html = '';
  if (activeFilter === 'All') {
    html += cardHTML(POSTS[0], true);
    shown.slice(1).forEach(p => html += cardHTML(p));
  } else {
    shown.forEach(p => html += cardHTML(p));
  }
  grid.innerHTML = html;
  observeReveals();
}

function renderFilters() {
  const counts = {};
  POSTS.forEach(p => counts[p.c] = (counts[p.c] || 0) + 1);
  const order = ['All', 'México', 'Guatemala', 'El Salvador', 'Costa Rica', 'Panamá', 'Spain', 'Italy', 'Reflections'];
  filtersEl.innerHTML = order.map(k => {
    const isAll = k === 'All';
    const col = isAll ? '#16303f' : COUNTRIES[k].color;
    const n = isAll ? POSTS.length : (counts[k] || 0);
    if (!n) return '';
    return `<button class="chip ${k === activeFilter ? 'active' : ''}" data-k="${k}" style="--c:${col}">
      <span class="dot"></span>${isAll ? 'All entries' : COUNTRIES[k].label} <span class="n">${n}</span>
    </button>`;
  }).join('');
  filtersEl.querySelectorAll('.chip').forEach(c =>
    c.addEventListener('click', () => setFilter(c.dataset.k)));
}

function setFilter(k) {
  activeFilter = k;
  renderFilters();
  renderGrid();
  // sync route stops
  document.querySelectorAll('.stop').forEach(s => {
    const match = s.dataset.country === k;
    s.classList.toggle('active', match);
    const halo = s.querySelector('.halo');
    halo.setAttribute('opacity', match ? '.5' : '.18');
    halo.setAttribute('r', match ? '17' : '13');
  });
  document.getElementById('journal').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ===== Reveal on scroll ===== */
let revealIO;
function observeReveals() {
  if (!revealIO) {
    revealIO = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
  }
  document.querySelectorAll('.reveal:not(.in)').forEach(el => revealIO.observe(el));
}

/* ===== Count-up stats ===== */
(function stats() {
  const els = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count, t0 = performance.now();
      (function tick(t) {
        const p = Math.min((t - t0) / 1300, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  els.forEach(el => io.observe(el));
})();

/* ===== init ===== */
renderFilters();
renderGrid();
observeReveals();
