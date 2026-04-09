import { useEffect, useRef } from 'react';
import type { Routine } from '@shared/types';
import './CompletionPage.css';

interface CompletionPageProps {
  routine: Routine;
  onGoHome: () => void;
}

export function CompletionPage({ routine, onGoHome }: CompletionPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 紙吹雪アニメーション
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ff3366', '#00ffff', '#ffe066', '#00ff66', '#ff00ff', '#63b3ed', '#a78bfa', '#f472b6'];
    const confettiCount = 100;

    interface Confetti {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      vx: number;
      vy: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }

    const confetti: Confetti[] = [];

    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let animationId: number;

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      let activeCount = 0;
      confetti.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotationSpeed;
        c.vy += 0.05;

        if (c.y > canvas!.height) {
          c.opacity -= 0.02;
        }

        if (c.opacity > 0) {
          activeCount++;
          ctx!.save();
          ctx!.translate(c.x, c.y);
          ctx!.rotate((c.rotation * Math.PI) / 180);
          ctx!.globalAlpha = c.opacity;
          ctx!.fillStyle = c.color;
          ctx!.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
          ctx!.restore();
        }
      });

      if (activeCount > 0) {
        animationId = requestAnimationFrame(animate);
      }
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="completion-page" data-theme={routine.theme}>
      <canvas ref={canvasRef} className="confetti-canvas" />

      <div className="completion-content fade-in">
        <div className="completion-icon">🎉</div>
        <h1 className="completion-title">おつかれさま！</h1>
        <p className="completion-routine-name">{routine.name}</p>
        <p className="completion-message">すべてのタスクが完了しました</p>

        <button
          className="btn btn-primary completion-home-btn"
          onClick={onGoHome}
          id="go-home-btn"
        >
          ホームへ戻る
        </button>
      </div>
    </div>
  );
}
