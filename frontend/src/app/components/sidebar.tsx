import { motion } from "motion/react";
import { Home, Settings, Target, Flame, Star, User } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface SidebarProps {
  streak: number;
  level: number;
  totalXP: number;
  dailyGoal: number;
  completedLessons: number;
  totalLessons: number;
}

export function Sidebar({ streak, level, totalXP, dailyGoal, completedLessons, totalLessons }: SidebarProps) {
  const levelProgress = (totalXP % 100);
  const dailyGoalProgress = Math.min((dailyGoal / 50) * 100, 100);

  return (
    <motion.div
      className="fixed left-0 top-0 h-screen w-80 bg-slate-900 border-r border-slate-800 z-40 flex flex-col"
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      {/* Profile */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-700">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">Learner</h3>
          <p className="text-xs text-slate-400">Level {level} · {totalXP} XP</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 border-b border-slate-800">
        <Button
          variant="default"
          className="w-full justify-start gap-3 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Learn</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Button>
      </nav>

      {/* Stats Cards - Level, Streak, Daily Goal grouped together */}
      <div className="flex-1 p-6 space-y-4">
        {/* Level & XP */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-slate-200">Level {level}</span>
            </div>
            <span className="text-xs text-slate-400">{totalXP} XP</span>
          </div>
          <Progress value={levelProgress} className="h-2 bg-slate-800" />
          <p className="text-xs text-slate-400 mt-1.5">{100 - levelProgress} XP to next level</p>
        </div>

        {/* Streak */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-semibold text-slate-200">{streak} Day Streak</span>
            </div>
            <span className="text-xs text-orange-400 font-bold">🔥</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Keep it up! Don't break the chain</p>
        </div>

        {/* Daily Goal */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-slate-200">Daily Goal</span>
            </div>
            <span className="text-xs font-bold text-blue-400">{dailyGoal} / 50 XP</span>
          </div>
          <Progress value={dailyGoalProgress} className="h-2 bg-slate-800 mb-2" />
          <p className="text-xs text-slate-400">
            {dailyGoal >= 50 ? "🎉 Completed!" : `${50 - dailyGoal} XP remaining`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
