import { motion } from "motion/react";
import { Star, Sparkles, Clock } from "lucide-react";
import { Button } from "./ui/button";

interface LessonCompleteModalProps {
  isOpen: boolean;
  xpEarned: number;
  lessonTitle: string;
  duration: number;
  isReview?: boolean;
  onContinue: () => void;
}

export function LessonCompleteModal({ isOpen, xpEarned, lessonTitle, duration, isReview = false, onContinue }: LessonCompleteModalProps) {
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
      <motion.div
        className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ delay: 0.2, type: "spring", duration: 0.8 }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-14 h-14 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-2">{isReview ? 'Review Complete!' : 'Lesson Complete!'}</h2>
          <p className="text-slate-400 mb-6">{lessonTitle}</p>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-6">
            {isReview ? (
              <p className="text-slate-300 text-lg font-medium">Great practice! No XP for reviews.</p>
            ) : (
              <div className="flex items-center justify-center gap-3 mb-3">
                <Star className="w-6 h-6 text-yellow-400" fill="currentColor" />
                <span className="text-4xl font-bold text-yellow-300">+{xpEarned} XP</span>
                <Star className="w-6 h-6 text-yellow-400" fill="currentColor" />
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-3 bg-slate-800/60 rounded-lg px-4 py-2.5">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-xl font-semibold text-slate-200">{timeStr}</span>
            </div>
          </div>

          <Button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-6 text-lg font-bold rounded-xl shadow-lg"
          >
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
