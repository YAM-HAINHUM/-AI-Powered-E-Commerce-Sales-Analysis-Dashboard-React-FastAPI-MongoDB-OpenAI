import React, { useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../components/theme-provider';

/**
 * AnimatedBubblesBackground
 * Premium SaaS-style background with glowing bubbles that float upward.
 * Features:
 * - 30+ floating gradient particles.
 * - Upward drift with horizontal sine-wave movement.
 * - Mouse repel interaction.
 * - High-performance requestAnimationFrame loop.
 */

const BUBBLE_COUNT = 120;
const COLORS = [
  'from-purple-500 to-violet-600',
  'from-blue-500 to-indigo-600',
  'from-cyan-400 to-teal-500',
  'from-pink-500 to-rose-600',
];

interface BubbleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  parallaxFactor: number;
  opacity: number;
  phase: number;
  // blur uses a CSS class string (e.g. "blur-md")
  blur: string;


}

export const AnimatedBubblesBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Generate initial bubbles distributed across the screen
  const initialBubbles = useMemo(() => {
    const bubbles: BubbleState[] = [];
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const sizeType = Math.random();
      let size, parallax, opacity;

      let blurClass = 'blur-md';
      if (sizeType < 0.7) {
        // Small (6-12px)
        size = Math.random() * 6 + 6;
        parallax = 1.6;
        opacity = 0.6;
        blurClass = 'blur-md';
      } else {
        // Medium (14-26px)
        size = Math.random() * 12 + 14;
        parallax = 1.1;
        opacity = 0.45;
        blurClass = 'blur-lg';
      }

      bubbles.push({

        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.04,
        vy: -(Math.random() * 0.1 + 0.05), // Even faster
        size,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        parallaxFactor: parallax,
        opacity: isDark ? opacity : opacity * 0.8,
        phase: Math.random() * Math.PI * 2,
        blur: blurClass,
      });

    }
    return bubbles;
  }, [isDark]);

  const bubblesRef = useRef<BubbleState[]>(initialBubbles);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mouseRef.current = { x, y, active: true };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let animationFrameId: number;
    const update = () => {
      const bubbleElements = container.querySelectorAll('.bubble-item') as NodeListOf<HTMLDivElement>;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const bubbles = bubblesRef.current;
      
      if (!bubbleElements.length || !bubbles.length) {
        animationFrameId = requestAnimationFrame(update);
        return;
      }

      for (let i = 0; i < bubbles.length; i++) {
        const bubble = bubbles[i];
        const el = bubbleElements[i];
        if (!el) continue;

        // 1. Natural Drift (Upward + Sine Wave)
        bubble.y += bubble.vy * bubble.parallaxFactor;
        bubble.x += bubble.vx + Math.sin(Date.now() * 0.001 + bubble.phase) * 0.02;

        // 2. Mouse Repel (Subtle)
        if (mouseRef.current.active) {
          const dx = bubble.x - mouseRef.current.x;
          const dy = bubble.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const repelRadius = 12; // Slightly smaller radius for higher density

          if (distance < repelRadius) {
            const force = (repelRadius - distance) / repelRadius;
            const angle = Math.atan2(dy, dx);
            const push = force * 1.0 * bubble.parallaxFactor;
            
            bubble.x += Math.cos(angle) * push;
            bubble.y += Math.sin(angle) * push;
          }
        }

        // 3. Reset when out of bounds (top)
        if (bubble.y < -15) {
          bubble.y = 115;
          bubble.x = Math.random() * 100;
        }
        
        // Horizontal Wrap
        if (bubble.x < -10) bubble.x = 110;
        if (bubble.x > 110) bubble.x = -10;

        // 4. Direct DOM Update
        el.style.transform = `translate3d(${(bubble.x * w) / 100}px, ${(bubble.y * h) / 100}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10" />

      {/* Bubble Particles */}
      {initialBubbles.map((bubble, i) => (
        <div
          key={i}
          className={`bubble-item absolute rounded-full bg-gradient-to-br ${bubble.color} ${bubble.blur} shadow-[0_0_40px_rgba(124,58,237,0.3)] transition-opacity duration-1000`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            opacity: bubble.opacity,
            left: 0,
            top: 0,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
};
