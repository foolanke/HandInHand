import { motion } from "motion/react";
import { Star } from "lucide-react";

interface LessonNodeProps {
  lesson: {
    id: number;
    title: string;
    description: string;
    type: 'lesson' | 'checkpoint' | 'achievement';
    xp: number;
  };
  status: 'locked' | 'unlocked' | 'completed';
  position: 'left' | 'center' | 'right';
  onClick: () => void;
  index: number;
}

// Rounder 5-pointed star with softer inner radius, in a 140x140 viewBox
// Outer radius 65, inner radius 35, centered at 70,70
const STAR_PATH = (() => {
  const cx = 70, cy = 70, outerR = 62, innerR = 34, points = 5;
  const angle = Math.PI / points;
  let d = "";
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * angle - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  return d + "Z";
})();

const starColors = {
  locked: { fill: "#1e293b", stroke: "#334155", glow: "none" },
  unlocked: { fill: "#7c3aed", stroke: "#a78bfa", glow: "0 0 30px rgba(139,92,246,0.6)" },
  completed: { fill: "#facc15", stroke: "#fde68a", glow: "0 0 35px rgba(250,204,21,0.6)" },
};

const checkpointColors = {
  locked: starColors.locked,
  unlocked: { fill: "#d97706", stroke: "#fbbf24", glow: "0 0 30px rgba(217,119,6,0.6)" },
  completed: { fill: "#facc15", stroke: "#fde68a", glow: "0 0 35px rgba(250,204,21,0.6)" },
};

export function LessonNode({ lesson, status, position, onClick, index }: LessonNodeProps) {
  const isClickable = status === 'unlocked' || status === 'completed';
  const colors = lesson.type === 'checkpoint' || lesson.type === 'achievement'
    ? checkpointColors[status]
    : starColors[status];

  const positionMap = {
    left: { offsetX: -120, align: 'items-start' },
    center: { offsetX: 0, align: 'items-center' },
    right: { offsetX: 120, align: 'items-end' },
  };

  const { offsetX, align } = positionMap[position];

  return (
    <motion.div
      className={`flex flex-col ${align} gap-3 relative z-10`}
      style={{ marginLeft: offsetX }}
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 260, damping: 20 }}
    >
      <motion.button
        onClick={isClickable ? onClick : undefined}
        className={`relative w-36 h-36 flex items-center justify-center ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        whileHover={isClickable ? { scale: 1.12 } : {}}
        whileTap={isClickable ? { scale: 0.92 } : {}}
        disabled={!isClickable}
        animate={status === 'unlocked' ? { y: [0, -8, 0] } : {}}
        transition={{ y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
        style={{ filter: colors.glow !== "none" ? `drop-shadow(${colors.glow})` : undefined }}
      >
        {/* Pulsing glow aura */}
        {status !== 'locked' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="140" height="140" viewBox="0 0 140 140">
              <path
                d={STAR_PATH}
                fill={status === 'completed' ? "rgba(250,204,21,0.3)" : "rgba(139,92,246,0.3)"}
                stroke="none"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}

        {/* The star */}
        <svg width="140" height="140" viewBox="0 0 140 140" className="absolute inset-0">
          <defs>
            <linearGradient id={`starGrad-${lesson.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.fill} />
              <stop offset="100%" stopColor={colors.stroke} />
            </linearGradient>
          </defs>
          <path
            d={STAR_PATH}
            fill={`url(#starGrad-${lesson.id})`}
            stroke={colors.stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* XP Badge */}
        {status !== 'locked' && (
          <motion.div
            className="absolute -bottom-2 bg-slate-900 rounded-full px-3 py-1 shadow-xl border border-yellow-500/40"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.08 + 0.3 }}
          >
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-yellow-300">{lesson.xp} XP</span>
            </div>
          </motion.div>
        )}
      </motion.button>

      <motion.div
        className="text-center max-w-[150px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.08 + 0.2 }}
      >
        <h3 className="font-bold text-base text-white mb-1">{lesson.title}</h3>
        <p className="text-xs text-slate-400">{lesson.description}</p>
      </motion.div>
    </motion.div>
  );
}
