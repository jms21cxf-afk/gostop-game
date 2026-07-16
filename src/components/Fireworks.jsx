import { useEffect, useRef } from 'react';

const PALETTES = [
  ['#ff6bcb', '#ffd93d', '#ffffff'],
  ['#6c5ce7', '#a29bfe', '#dfe6e9'],
  ['#00cec9', '#55efc4', '#ffffff'],
  ['#fd79a8', '#fab1a0', '#ffeaa7'],
  ['#0984e3', '#74b9ff', '#ffffff'],
  ['#e17055', '#fdcb6e', '#fff'],
];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickPalette() {
  return PALETTES[Math.floor(Math.random() * PALETTES.length)];
}

function spawnRocket(width, height) {
  const x = rand(width * 0.12, width * 0.88);
  return {
    kind: 'rocket',
    x,
    y: height + 10,
    tx: x + rand(-40, 40),
    ty: rand(height * 0.12, height * 0.42),
    progress: 0,
    speed: rand(0.018, 0.026),
    hue: pickPalette(),
    trail: [],
  };
}

function spawnBurst(x, y, palette) {
  const particles = [];
  const [c1, c2, c3] = palette;
  const colors = [c1, c2, c3, c1, c2];

  // core flash
  for (let i = 0; i < 3; i++) {
    particles.push({
      kind: 'flash',
      x, y,
      life: 1,
      decay: rand(0.04, 0.06),
      size: rand(18, 32) - i * 6,
      color: colors[i % colors.length],
    });
  }

  // ring wave
  for (let i = 0; i < 24; i++) {
    const angle = (Math.PI * 2 * i) / 24;
    particles.push({
      kind: 'ring',
      x, y,
      angle,
      radius: 0,
      maxRadius: rand(55, 95),
      life: 1,
      decay: rand(0.015, 0.022),
      width: rand(2, 3.5),
      color: colors[i % colors.length],
    });
  }

  // sparks
  const sparkCount = 70 + Math.floor(Math.random() * 40);
  for (let i = 0; i < sparkCount; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(2, 9);
    particles.push({
      kind: 'spark',
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: rand(0.008, 0.018),
      size: rand(1.5, 3.5),
      color: colors[i % colors.length],
      gravity: rand(0.04, 0.07),
      drag: rand(0.975, 0.988),
      twinkle: Math.random() > 0.5,
    });
  }

  // falling embers
  for (let i = 0; i < 16; i++) {
    particles.push({
      kind: 'ember',
      x: x + rand(-20, 20),
      y: y + rand(-10, 10),
      vx: rand(-1.5, 1.5),
      vy: rand(0.5, 3),
      life: 1,
      decay: rand(0.006, 0.012),
      size: rand(2, 4),
      color: c2,
    });
  }

  return particles;
}

export default function Fireworks() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let items = [];
    let running = true;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const launch = () => {
      if (!running || items.filter((i) => i.kind === 'rocket').length >= 4) return;
      items.push(spawnRocket(width, height));
    };

    launch();
    setTimeout(launch, 300);
    setTimeout(launch, 700);
    const launchTimer = setInterval(launch, 900);

    const tick = () => {
      if (!running) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      const next = [];

      for (const item of items) {
        if (item.kind === 'rocket') {
          item.progress += item.speed;
          const t = item.progress;
          const ease = 1 - (1 - t) ** 3;
          const cx = item.x + (item.tx - item.x) * ease;
          const cy = item.y + (item.ty - item.y) * ease;

          item.trail.push({ x: cx, y: cy, life: 1 });
          if (item.trail.length > 12) item.trail.shift();

          for (const tr of item.trail) {
            tr.life -= 0.08;
            if (tr.life <= 0) continue;
            ctx.globalAlpha = tr.life * 0.7;
            ctx.fillStyle = item.hue[0];
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.globalAlpha = 1;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();

          if (item.progress < 1) {
            next.push(item);
          } else {
            next.push(...spawnBurst(cx, cy, item.hue));
          }
          continue;
        }

        item.life -= item.decay;
        if (item.life <= 0) continue;

        if (item.kind === 'flash') {
          ctx.globalAlpha = item.life * 0.55;
          const g = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.size);
          g.addColorStop(0, item.color);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.size * (2 - item.life), 0, Math.PI * 2);
          ctx.fill();
          next.push(item);
        } else if (item.kind === 'ring') {
          item.radius += (item.maxRadius - item.radius) * 0.08;
          ctx.globalAlpha = item.life * 0.85;
          ctx.strokeStyle = item.color;
          ctx.lineWidth = item.width * item.life;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, item.angle, item.angle + Math.PI * 0.55);
          ctx.stroke();
          next.push(item);
        } else if (item.kind === 'spark') {
          item.x += item.vx;
          item.y += item.vy;
          item.vy += item.gravity;
          item.vx *= item.drag;
          item.vy *= item.drag;
          const alpha = item.twinkle ? item.life * (0.6 + Math.sin(item.life * 30) * 0.4) : item.life;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.size * item.life, 0, Math.PI * 2);
          ctx.fill();
          if (item.life > 0.15 && item.twinkle) {
            ctx.globalAlpha = alpha * 0.35;
            ctx.beginPath();
            ctx.arc(item.x - item.vx * 2, item.y - item.vy * 2, item.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          next.push(item);
        } else if (item.kind === 'ember') {
          item.x += item.vx;
          item.y += item.vy;
          item.vy += 0.05;
          ctx.globalAlpha = item.life * 0.8;
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.size * item.life, 0, Math.PI * 2);
          ctx.fill();
          next.push(item);
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      items = next;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      clearInterval(launchTimer);
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="fireworks-canvas" aria-hidden="true" />;
}
