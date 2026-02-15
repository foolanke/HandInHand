import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface ConfettiProps {
  show: boolean;
  onComplete: () => void;
}

export function Confetti({ show, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; rotation: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      const forestColors = ['#A4C2A5', '#566246', '#8aab6e', '#c9a96e', '#D8DAD3', '#6b7a55'];
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * -100 - 50,
        rotation: Math.random() * 360,
        color: forestColors[Math.floor(Math.random() * forestColors.length)],
      }));
      setParticles(newParticles);

      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute top-1/2 left-1/2"
          style={{
            width: particle.id % 3 === 0 ? 12 : 10,
            height: particle.id % 3 === 0 ? 8 : 10,
            backgroundColor: particle.color,
            borderRadius: particle.id % 3 === 0 ? '40% 60% 60% 40%' : '2px',
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: particle.x * 8,
            y: particle.y * 8 + 800,
            opacity: 0,
            rotate: particle.rotation * 4,
          }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
