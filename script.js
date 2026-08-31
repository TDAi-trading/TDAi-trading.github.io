// ---- Year ----
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Mobile menu ----
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
menuBtn.addEventListener('click', () => {
  const open = !mobileMenu.classList.contains('hidden');
  mobileMenu.classList.toggle('hidden');
  menuBtn.setAttribute('aria-expanded', String(!open));
});
mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
  })
);

// ---- Reduced motion ----
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Scroll reveal ----
const revealEls = document.querySelectorAll('.reveal');
if (reduceMotion) {
  revealEls.forEach(el => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('in'), (i % 4) * 70);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
}

// ---- Animated counters ----
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
  const dur = 1200, start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); countObserver.unobserve(e.target); } });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(c => countObserver.observe(c));

// ---- Hero network animation (particle nodes + links) ----
(function () {
  const canvas = document.getElementById('net');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr, nodes = [], raf;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function init() {
    size();
    const count = Math.min(60, Math.floor(w / 22));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          ctx.strokeStyle = `rgba(46,125,255,${0.16 * (1 - dist / 130)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = 'rgba(125,176,255,0.7)';
      ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  init();
  if (!reduceMotion) draw(); else { /* draw one static frame */ draw(); cancelAnimationFrame(raf); }
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(init, 200); });
})();

// ---- How-it-works decision pipeline animation ----
(function () {
  const svg = document.getElementById('pipeline');
  if (!svg) return;
  const nodes = [...svg.querySelectorAll('.pnode')];
  const pulse = document.getElementById('pulse');
  const verdict = document.getElementById('verdictG');
  // path of node centers the pulse visits, in order
  const path = nodes.map(g => {
    const c = g.querySelector('circle');
    return { x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), g };
  });

  function clearActive() { nodes.forEach(n => n.classList.remove('active')); }

  function runOnce() {
    clearActive();
    verdict.setAttribute('opacity', '0');
    let i = 0;
    pulse.setAttribute('opacity', '1');
    function moveTo(idx) {
      if (idx >= path.length) {
        verdict.setAttribute('opacity', '1');
        setTimeout(runOnce, 2600);
        return;
      }
      const p = path[idx];
      pulse.setAttribute('cx', p.x);
      pulse.setAttribute('cy', p.y);
      p.g.classList.add('active');
      setTimeout(() => moveTo(idx + 1), 360);
    }
    moveTo(0);
  }

  // hover a node to highlight it
  nodes.forEach(n => {
    n.addEventListener('mouseenter', () => n.classList.add('active'));
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (reduce) { nodes.forEach(n => n.classList.add('active')); verdict.setAttribute('opacity','1'); pulse.setAttribute('opacity','0'); }
        else runOnce();
        io.disconnect();
      }
    });
  }, { threshold: 0.4 });
  io.observe(svg);
})();

// ---- Credibility backtest equity curve ----
(function () {
  const svg = document.getElementById('btChart');
  if (!svg) return;
  const linePath = document.getElementById('btLine');
  const areaPath = document.getElementById('btArea');
  const dot = document.getElementById('btDot');
  const tip = document.getElementById('btTip');
  const tipBox = document.getElementById('btTipBox');
  const t1 = document.getElementById('btTipT1');
  const t2 = document.getElementById('btTipT2');

  const X0 = 30, X1 = 470, Y0 = 200, Y1 = 30;
  const N = 60;
  // deterministic equity curve rising with drawdowns (market cycles)
  let seed = 42;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const vals = [];
  let eq = 100;
  for (let i = 0; i < N; i++) {
    const cycle = Math.sin(i / 7) * 1.2;           // waves = regimes
    const drift = 0.9;                              // upward bias
    const noise = (rnd() - 0.5) * 2.2;
    eq += drift + cycle + noise;
    if (i === 22) eq -= 6;                          // a bear drawdown
    if (i === 40) eq -= 4;                          // a range chop
    vals.push(eq);
  }
  const min = Math.min(...vals), max = Math.max(...vals);
  const pts = vals.map((v, i) => {
    const x = X0 + (X1 - X0) * (i / (N - 1));
    const y = Y0 - (Y0 - Y1) * ((v - min) / (max - min));
    return [x, y];
  });
  const regimes = i => (i < 18 ? 'Bull trend' : i < 30 ? 'Bear drawdown' : i < 44 ? 'Range / chop' : 'Recovery');
  const years = i => 2021 + (i / (N - 1)) * 5;

  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  linePath.setAttribute('d', d);
  areaPath.setAttribute('d', d + ` L${X1} ${Y0} L${X0} ${Y0} Z`);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function play() {
    if (reduce) { dot.setAttribute('cx', pts.at(-1)[0]); dot.setAttribute('cy', pts.at(-1)[1]); return; }
    const len = linePath.getTotalLength();
    linePath.style.strokeDasharray = len;
    linePath.style.strokeDashoffset = len;
    areaPath.style.opacity = 0;
    const dur = 1800, start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      linePath.style.strokeDashoffset = len * (1 - p);
      areaPath.style.opacity = p;
      const pt = linePath.getPointAtLength(len * p);
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // hover to inspect
  function nearest(mx) {
    let best = 0, bd = 1e9;
    pts.forEach((p, i) => { const dd = Math.abs(p[0] - mx); if (dd < bd) { bd = dd; best = i; } });
    return best;
  }
  svg.addEventListener('mousemove', (e) => {
    const r = svg.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width * 480;
    if (mx < X0 || mx > X1) { tip.setAttribute('opacity', 0); return; }
    const i = nearest(mx);
    const [x, y] = pts[i];
    dot.setAttribute('cx', x); dot.setAttribute('cy', y);
    t1.textContent = `${years(i).toFixed(0)} · eq ${vals[i].toFixed(0)}`;
    t2.textContent = regimes(i);
    const w = Math.max(t1.getComputedTextLength ? t1.getComputedTextLength() : 90, 90) + 20;
    tipBox.setAttribute('width', w);
    let tx = x + 10; if (tx + w > 480) tx = x - w - 10;
    const ty = Math.max(4, y - 44);
    tip.setAttribute('transform', `translate(${tx},${ty})`);
    tip.setAttribute('opacity', 1);
  });
  svg.addEventListener('mouseleave', () => tip.setAttribute('opacity', 0));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { play(); io.disconnect(); } });
  }, { threshold: 0.4 });
  io.observe(svg);
})();

// ---- Hero interactive neural-network brain ----
(function () {
  var c = document.getElementById('brainNet');
  if (!c) return;
  var x = c.getContext('2d');
  var W, H, dpr, mouse = { x: -999, y: -999 };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = c.getBoundingClientRect();
    W = r.width; H = r.height;
    c.width = W * dpr; c.height = H * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function(){ size(); build(); }, 180); });
  c.addEventListener('mousemove', function (e) { var r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  c.addEventListener('mouseleave', function () { mouse.x = -999; mouse.y = -999; });

  var nodes = [], links = [];
  function inBrain(px, py) {
    var cx = W / 2, cy = H / 2, rx = W * 0.46, ry = H * 0.42;
    var dx = (px - cx) / rx, dy = (py - cy) / ry;
    return dx * dx + dy * dy < 1;
  }
  function build() {
    nodes = []; links = [];
    var target = Math.min(240, Math.floor(W / 3.6)); // denser + wider
    var tries = 0;
    while (nodes.length < target && tries < 9000) {
      tries++;
      var px = Math.random() * W, py = Math.random() * H;
      if (!inBrain(px, py)) continue;
      nodes.push({ bx: px, by: py, x: px, y: py, left: px < W / 2, ph: Math.random() * 6.28 });
    }
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 56) links.push({ a: i, b: j, pulse: Math.random() });
      }
    }
  }
  build();

  var t = 0;
  function frame() {
    t += 0.016; x.clearRect(0, 0, W, H);
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var ox = reduce ? 0 : Math.sin(t + n.ph) * 1.8;
      var oy = reduce ? 0 : Math.cos(t * 0.8 + n.ph) * 1.8;
      var tx = n.bx + ox, ty = n.by + oy;
      var mdx = mouse.x - tx, mdy = mouse.y - ty, md = Math.hypot(mdx, mdy);
      if (md < 110) { var f = (1 - md / 110) * 12; tx += mdx / md * f; ty += mdy / md * f; }
      n.x = tx; n.y = ty;
    }
    for (var k = 0; k < links.length; k++) {
      var l = links[k], a = nodes[l.a], b = nodes[l.b];
      var mid = (Math.hypot(mouse.x - a.x, mouse.y - a.y) + Math.hypot(mouse.x - b.x, mouse.y - b.y)) / 2;
      var near = mid < 130 ? (1 - mid / 130) : 0;
      var base = 0.28 + near * 0.6;
      var col = (a.left || b.left) ? '80,160,255' : '190,120,255';
      x.strokeStyle = 'rgba(' + col + ',' + base.toFixed(3) + ')';
      x.lineWidth = near > 0 ? 1.7 : 0.9;
      if (a.left && b.left) { x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
      else { x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
      if (!reduce) { l.pulse += 0.005 + near * 0.02; if (l.pulse > 1) l.pulse -= 1; }
      var pxp = a.x + (b.x - a.x) * l.pulse, pyp = a.y + (b.y - a.y) * l.pulse;
      x.fillStyle = 'rgba(' + col + ',' + (0.5 + near * 0.5).toFixed(3) + ')';
      x.beginPath(); x.arc(pxp, pyp, near > 0 ? 2.6 : 1.6, 0, 6.28); x.fill();
    }
    for (var i2 = 0; i2 < nodes.length; i2++) {
      var n2 = nodes[i2], md2 = Math.hypot(mouse.x - n2.x, mouse.y - n2.y);
      var glow = md2 < 110 ? (1 - md2 / 110) : 0;
      var col2 = n2.left ? '150,200,255' : '215,170,255';
      x.fillStyle = 'rgba(' + col2 + ',' + (0.8 + glow * 0.2).toFixed(3) + ')';
      x.beginPath(); x.arc(n2.x, n2.y, 1.9 + glow * 3.5, 0, 6.28); x.fill();
      if (glow > 0.25) { x.strokeStyle = 'rgba(' + col2 + ',' + (glow * 0.7).toFixed(3) + ')'; x.lineWidth = 1.3; x.beginPath(); x.arc(n2.x, n2.y, 6 + glow * 7, 0, 6.28); x.stroke(); }
    }
    requestAnimationFrame(frame);
  }
  frame();
})();
