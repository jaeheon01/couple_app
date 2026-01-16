'use client';

import { useEffect, useRef } from 'react';

type Petal = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  wobble: number;
  alpha: number;
  hue: number;
};

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

export default function PetalFall({
  count = 25,
}: {
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const petals: Petal[] = Array.from({ length: count }).map(() => ({
      x: rand(0, w),
      y: rand(-h, 0),
      r: rand(5, 10), // 크기 조금 작게
      vx: rand(-0.3, 0.4), // 좌우 움직임 줄이기
      vy: rand(0.6, 1.2), // 떨어지는 속도 느리게
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.02, 0.02), // 회전 속도 줄이기
      wobble: rand(0, Math.PI * 2),
      alpha: rand(0.5, 0.9), // 투명도 낮춰서 더 차분하게
      // 핑크~라벤더 계열 (채도 낮춰서 더 파스텔하게)
      hue: rand(320, 350),
    }));

    const start = performance.now();

    const drawPetal = (p: Petal, globalAlpha: number) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha * globalAlpha;

      // 부드러운 꽃잎 느낌의 타원(약간 찌그러진) - 더 차분한 색상
      const grad = ctx.createRadialGradient(0, -p.r * 0.25, 1, 0, 0, p.r * 1.2);
      grad.addColorStop(0, `hsla(${p.hue}, 60%, 85%, 0.7)`); // 채도 낮추고 밝기 높여서 더 파스텔하게
      grad.addColorStop(1, `hsla(${p.hue}, 50%, 80%, 0.3)`);
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * 0.85, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // 하이라이트
      ctx.globalAlpha = 0.12 * globalAlpha;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(-p.r * 0.15, -p.r * 0.12, p.r * 0.35, p.r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of petals) {
        p.wobble += 0.01; // wobble 속도 줄이기
        p.x += p.vx + Math.sin(p.wobble) * 0.4; // 좌우 흔들림 줄이기
        p.y += p.vy;
        p.rot += p.vr;

        // 화면 아래로 벗어나면 다시 위로 (무한 반복)
        if (p.y > h + 30) {
          p.y = rand(-120, -30);
          p.x = rand(0, w);
        }
        if (p.x < -40) p.x = w + 40;
        if (p.x > w + 40) p.x = -40;

        drawPetal(p, 1); // 항상 완전히 보이도록
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  );
}

