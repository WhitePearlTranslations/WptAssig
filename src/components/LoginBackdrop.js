import React, { useEffect, useRef } from 'react';
import { colors } from '../theme/tokens';

/**
 * Fondo animado del login: perlas que suben despacio (por WhitePearl) y dos
 * brillos lavanda que se desplazan muy lento. Canvas para que sea ligero.
 * - Se para cuando la pestaña no se ve.
 * - Con "reducir movimiento" se dibuja un solo fotograma, quieto.
 * - Las perlas cercanas se mueven un poco con el ratón (paralaje).
 */

const toRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
};
const PEARL = toRgb(colors.onSurface);
const LAVENDER = toRgb(colors.primary);

const GLOWS = [
  { x: 0.18, y: 0.22, r: 0.5, phase: 0, color: LAVENDER, alpha: 0.16 },
  { x: 0.82, y: 0.78, r: 0.55, phase: 2.1, color: LAVENDER, alpha: 0.12 },
  { x: 0.7, y: 0.12, r: 0.32, phase: 4.2, color: PEARL, alpha: 0.05 },
];

export default function LoginBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    let width = 0;
    let height = 0;
    let pearls = [];
    let raf = 0;
    let last = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const makePearl = (fromBottom) => {
      const depth = Math.random(); // 0 = lejos, 1 = cerca
      return {
        x: Math.random() * width,
        y: fromBottom ? height + 24 : Math.random() * height,
        r: 1.2 + depth * 4.4,
        speed: 6 + depth * 18, // px por segundo
        sway: 6 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.14 + depth * 0.4,
        depth,
        tint: Math.random() < 0.35 ? LAVENDER : PEARL,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Densidad según el área, sin pasarse en pantallas grandes.
      const target = Math.round(Math.min(70, Math.max(18, (width * height) / 16000)));
      if (pearls.length === 0) {
        pearls = Array.from({ length: target }, () => makePearl(false));
      } else if (pearls.length < target) {
        pearls.push(...Array.from({ length: target - pearls.length }, () => makePearl(false)));
      } else {
        pearls.length = target;
      }
    };

    const draw = (time, dt) => {
      ctx.clearRect(0, 0, width, height);

      // Brillos de fondo
      const span = Math.max(width, height);
      GLOWS.forEach((g) => {
        const gx = (g.x + Math.sin(time * 0.00005 + g.phase) * 0.07) * width;
        const gy = (g.y + Math.cos(time * 0.00004 + g.phase) * 0.06) * height;
        const radius = g.r * span;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
        grad.addColorStop(0, `rgba(${g.color},${g.alpha})`);
        grad.addColorStop(1, `rgba(${g.color},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      });

      // Paralaje suave hacia el puntero
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      // Perlas
      for (let i = 0; i < pearls.length; i++) {
        const p = pearls[i];
        p.y -= p.speed * dt;
        if (p.y < -24) {
          pearls[i] = makePearl(true);
          continue;
        }
        const x = p.x + Math.sin(time * 0.0006 + p.phase) * p.sway + pointer.x * p.depth * 18;
        const y = p.y + pointer.y * p.depth * 12;
        const halo = p.r * 2.4;
        // Brillo desplazado arriba a la izquierda: da el aspecto de perla.
        const grad = ctx.createRadialGradient(x - p.r * 0.35, y - p.r * 0.35, 0, x, y, halo);
        grad.addColorStop(0, `rgba(${p.tint},${p.alpha})`);
        grad.addColorStop(0.4, `rgba(${p.tint},${p.alpha * 0.45})`);
        grad.addColorStop(1, `rgba(${p.tint},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, halo, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(now, dt);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduceMotion.matches) {
        draw(0, 0);
        return;
      }
      last = performance.now();
      draw(last, 0); // primer fotograma ya, sin esperar al siguiente refresco
      raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };

    const onPointerMove = (e) => {
      if (!finePointer.matches || !width) return;
      pointer.tx = e.clientX / width - 0.5;
      pointer.ty = e.clientY / height - 0.5;
    };

    resize();
    start();

    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion.matches) draw(0, 0);
    });
    observer.observe(canvas);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reduceMotion.addEventListener?.('change', start);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      reduceMotion.removeEventListener?.('change', start);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
