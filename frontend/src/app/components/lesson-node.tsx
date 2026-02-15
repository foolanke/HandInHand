import { motion } from "motion/react";
import { Lock, Check, BookOpen, Crown, Target, Star } from "lucide-react";

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

const iconMap = {
  lesson: BookOpen,
  checkpoint: Target,
  achievement: Crown,
};

const typeColors = {
  lesson: {
    completed: 'bg-gradient-to-br from-blue-500 to-purple-600',
    unlocked: 'bg-gradient-to-br from-blue-600 to-purple-700',
    locked: 'bg-gradient-to-br from-slate-700 to-slate-800',
  },
  checkpoint: {
    completed: 'bg-gradient-to-br from-blue-500 to-purple-600',
    unlocked: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    locked: 'bg-gradient-to-br from-slate-700 to-slate-800',
  },
  achievement: {
    completed: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    unlocked: 'bg-gradient-to-br from-yellow-400 to-orange-400',
    locked: 'bg-gradient-to-br from-slate-700 to-slate-800',
  },
};

export function LessonNode({ lesson, status, position, onClick, index }: LessonNodeProps) {
  const Icon = iconMap[lesson.type];

  const isClickable = status === 'unlocked' || status === 'completed';

  const getColor = () => {
    return typeColors[lesson.type][status];
  };

  const positionMap = {
    left: { offsetX: -120, align: 'items-start' },
    center: { offsetX: 0, align: 'items-center' },
    right: { offsetX: 120, align: 'items-end' },
  };

  const { offsetX, align } = positionMap[position];

  const getBorderGlow = () => {
    if (status === 'unlocked' && lesson.type === 'checkpoint') {
      return 'shadow-[0_0_25px_rgba(234,179,8,0.4)]';
    }
    if (status === 'unlocked' && lesson.type === 'achievement') {
      return 'shadow-[0_0_25px_rgba(251,146,60,0.4)]';
    }
    if (status === 'completed') {
      return 'shadow-[0_0_20px_rgba(139,92,246,0.4)]';
    }
    return 'shadow-xl';
  };

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
        className={`
          relative w-28 h-28 rounded-full
          ${getColor()}
          ${getBorderGlow()}
          flex items-center justify-center
          border-[6px] border-slate-700/50
          ${isClickable ? 'cursor-pointer' : 'cursor-default opacity-60'}
          transition-all duration-200
        `}
        whileHover={isClickable ? { scale: 1.15, rotate: 5 } : {}}
        whileTap={isClickable ? { scale: 0.9 } : {}}
        disabled={!isClickable}
        animate={status === 'unlocked' ? {
          y: [0, -10, 0],
        } : {}}
        transition={{
          y: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      >
        {/* Outer glow ring for unlocked lessons */}
        {status === 'unlocked' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: lesson.type === 'achievement'
                ? 'radial-gradient(circle, rgba(251,146,60,0.25) 0%, transparent 70%)'
                : lesson.type === 'checkpoint'
                ? 'radial-gradient(circle, rgba(234,179,8,0.25) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <Icon className="w-14 h-14 text-white drop-shadow-lg" strokeWidth={2.5} />

        {status === 'completed' && (
          <motion.div
            className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Check className="w-7 h-7 text-white" strokeWidth={3} />
          </motion.div>
        )}

        {status === 'locked' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-full backdrop-blur-sm">
            <Lock className="w-12 h-12 text-slate-400/50 drop-shadow-lg" />
          </div>
        )}

        {/* XP Badge */}
        {status !== 'locked' && (
          <motion.div
            className="absolute -bottom-3 bg-slate-900 rounded-full px-4 py-1.5 shadow-xl border-2 border-purple-500/40"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.08 + 0.3 }}
          >
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400" fill={status === 'completed' ? 'currentColor' : 'none'} />
              <span className="text-sm font-bold text-yellow-300">{lesson.xp}</span>
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
