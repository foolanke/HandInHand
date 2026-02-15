import { motion } from "motion/react";

interface PathDecorationsProps {
  totalLessons: number;
}

export function PathDecorations({ totalLessons }: PathDecorationsProps) {
  // Fireflies - tiny glowing dots that drift and pulse
  const fireflies = Array.from({ length: 18 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 4,
    driftX: (Math.random() - 0.5) * 40,
    driftY: (Math.random() - 0.5) * 30,
    duration: Math.random() * 4 + 5,
  }));

  // Falling leaves
  const leaves = Array.from({ length: 10 }, (_, i) => ({
    startX: Math.random() * 100,
    size: Math.random() * 14 + 10,
    delay: Math.random() * 8,
    duration: Math.random() * 6 + 8,
    rotation: Math.random() * 360,
    swayAmount: Math.random() * 80 + 30,
  }));

  // Little mushrooms scattered on the ground areas
  const mushrooms = [
    { x: '8%', y: '22%', size: 18, flip: false },
    { x: '88%', y: '38%', size: 14, flip: true },
    { x: '12%', y: '55%', size: 16, flip: false },
    { x: '92%', y: '72%', size: 12, flip: true },
    { x: '6%', y: '85%', size: 15, flip: false },
  ];

  // Dandelion seeds floating
  const seeds = Array.from({ length: 6 }, (_, i) => ({
    startX: Math.random() * 80 + 10,
    startY: Math.random() * 80 + 10,
    delay: Math.random() * 6,
    duration: Math.random() * 8 + 10,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Ambient forest light — soft green glow patches */}
      <motion.div
        className="absolute top-[15%] left-[5%] w-72 h-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(164,194,165,0.12) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[50%] right-[8%] w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(86,98,70,0.1) 0%, transparent 70%)' }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[10%] left-[20%] w-64 h-64 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(164,194,165,0.08) 0%, transparent 70%)' }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Fireflies */}
      {fireflies.map((fly, i) => (
        <motion.div
          key={`firefly-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${fly.x}%`,
            top: `${fly.y}%`,
            width: fly.size,
            height: fly.size,
            background: 'radial-gradient(circle, rgba(220,230,140,0.9) 0%, rgba(164,194,165,0.4) 50%, transparent 70%)',
            boxShadow: '0 0 6px 2px rgba(220,230,140,0.3)',
          }}
          animate={{
            x: [0, fly.driftX, -fly.driftX * 0.5, 0],
            y: [0, fly.driftY, -fly.driftY * 0.7, 0],
            opacity: [0, 0.8, 1, 0.6, 0],
            scale: [0.5, 1.2, 1, 1.3, 0.5],
          }}
          transition={{
            duration: fly.duration,
            repeat: Infinity,
            delay: fly.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Falling leaves */}
      {leaves.map((leaf, i) => (
        <motion.div
          key={`leaf-${i}`}
          className="absolute"
          style={{
            left: `${leaf.startX}%`,
            top: -20,
            width: leaf.size,
            height: leaf.size * 0.7,
          }}
          animate={{
            y: [0, window.innerHeight + 100],
            x: [0, leaf.swayAmount, -leaf.swayAmount * 0.6, leaf.swayAmount * 0.3],
            rotate: [0, leaf.rotation, leaf.rotation * 2, leaf.rotation * 3],
            opacity: [0, 0.7, 0.6, 0],
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            delay: leaf.delay,
            ease: "easeInOut",
          }}
        >
          <svg viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 14C4 8 10 2 22 2C22 2 18 6 16 10C14 14 10 16 2 14Z"
              fill={i % 3 === 0 ? '#A4C2A5' : i % 3 === 1 ? '#566246' : '#8aab6e'}
              opacity="0.6"
            />
            <path
              d="M2 14C8 10 14 6 22 2"
              stroke={i % 2 === 0 ? '#566246' : '#4A4A48'}
              strokeWidth="0.5"
              opacity="0.4"
            />
          </svg>
        </motion.div>
      ))}

      {/* Mushrooms */}
      {mushrooms.map((mush, i) => (
        <motion.div
          key={`mush-${i}`}
          className="absolute"
          style={{
            left: mush.x,
            top: mush.y,
            transform: mush.flip ? 'scaleX(-1)' : 'none',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ delay: i * 0.4 + 1, duration: 0.8, type: "spring" }}
        >
          <svg width={mush.size} height={mush.size} viewBox="0 0 24 24" fill="none">
            {/* Stem */}
            <rect x="9" y="14" width="6" height="8" rx="2" fill="#D8DAD3" opacity="0.7" />
            {/* Cap */}
            <ellipse cx="12" cy="14" rx="10" ry="7" fill="#A4C2A5" opacity="0.6" />
            {/* Spots */}
            <circle cx="8" cy="12" r="1.5" fill="#F1F2EB" opacity="0.5" />
            <circle cx="14" cy="10" r="1" fill="#F1F2EB" opacity="0.5" />
            <circle cx="11" cy="13" r="0.8" fill="#F1F2EB" opacity="0.4" />
          </svg>
        </motion.div>
      ))}

      {/* Dandelion seeds floating */}
      {seeds.map((seed, i) => (
        <motion.div
          key={`seed-${i}`}
          className="absolute"
          style={{
            left: `${seed.startX}%`,
            top: `${seed.startY}%`,
          }}
          animate={{
            x: [0, 30, -20, 40, 0],
            y: [0, -40, -80, -60, -120],
            opacity: [0, 0.4, 0.5, 0.3, 0],
            rotate: [0, 45, -30, 60, 0],
          }}
          transition={{
            duration: seed.duration,
            repeat: Infinity,
            delay: seed.delay,
            ease: "easeInOut",
          }}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <line x1="6" y1="16" x2="6" y2="6" stroke="#D8DAD3" strokeWidth="0.5" opacity="0.5" />
            <circle cx="6" cy="5" r="1" fill="#D8DAD3" opacity="0.4" />
            {/* Fluff lines */}
            <line x1="6" y1="5" x2="2" y2="1" stroke="#D8DAD3" strokeWidth="0.3" opacity="0.3" />
            <line x1="6" y1="5" x2="10" y2="1" stroke="#D8DAD3" strokeWidth="0.3" opacity="0.3" />
            <line x1="6" y1="5" x2="6" y2="0" stroke="#D8DAD3" strokeWidth="0.3" opacity="0.3" />
            <line x1="6" y1="5" x2="3" y2="3" stroke="#D8DAD3" strokeWidth="0.3" opacity="0.3" />
            <line x1="6" y1="5" x2="9" y2="3" stroke="#D8DAD3" strokeWidth="0.3" opacity="0.3" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
