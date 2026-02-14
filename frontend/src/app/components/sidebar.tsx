import { motion } from "motion/react";
import { useState } from "react";
import { Home, Settings, Target, Flame, Star, User, BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface SidebarProps {
  streak: number;
  level: number;
  totalXP: number;
  dailyGoal: number;
  completedLessons: number;
  totalLessons: number;
  dictionary: { word: string; videoPath: string }[];
}

export function Sidebar({ streak, level, totalXP, dailyGoal, completedLessons, totalLessons, dictionary }: SidebarProps) {
  const levelProgress = (totalXP % 100);
  const dailyGoalProgress = Math.min((dailyGoal / 50) * 100, 100);
  const [dictIndex, setDictIndex] = useState(0);
  const [isDictOpen, setIsDictOpen] = useState(false);

  return (
    <>
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
      <nav className="p-4 space-y-3 border-b border-slate-800">
        <Button
          variant="default"
          className="w-full justify-start gap-4 h-14 text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
        >
          <Home className="w-6 h-6" />
          <span className="font-medium">Learn</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 h-14 text-base text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          onClick={() => { setDictIndex(-1); setIsDictOpen(true); }}
        >
          <BookOpen className="w-6 h-6" />
          <span className="font-medium">Dictionary</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 h-14 text-base text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <Settings className="w-6 h-6" />
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

    {/* Dictionary Overlay - fixed to cover the entire screen */}
    {isDictOpen && (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[85vh] mx-4 p-8 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-slate-100">Dictionary</h2>
              <span className="text-sm text-slate-500 ml-2">{dictionary.length} words</span>
            </div>
            <button
              onClick={() => { setIsDictOpen(false); setDictIndex(-1); }}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {dictionary.length === 0 ? (
            <p className="text-slate-500 text-center py-12">
              Complete lessons to add words here!
            </p>
          ) : dictIndex >= 0 ? (
            /* Expanded view — showing one word's video */
            <>
              <button
                onClick={() => setDictIndex(-1)}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to all words
              </button>

              <div className="bg-black rounded-xl overflow-hidden mb-6">
                <video
                  key={dictIndex}
                  src={dictionary[dictIndex].videoPath}
                  controls
                  autoPlay
                  playsInline
                  className="w-full aspect-video object-cover"
                />
              </div>

              <p className="text-center text-3xl font-bold text-green-300 mb-6">
                {dictionary[dictIndex].word}
              </p>

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setDictIndex(i => (i - 1 + dictionary.length) % dictionary.length)}
                  className="text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-slate-800"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-sm text-slate-400">
                  {dictIndex + 1} / {dictionary.length}
                </span>
                <button
                  onClick={() => setDictIndex(i => (i + 1) % dictionary.length)}
                  className="text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-slate-800"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </>
          ) : (
            /* Grid view — scrollable list of all words */
            <div className="overflow-y-auto flex-1 -mx-2">
              <div className="grid grid-cols-3 gap-3 px-2">
                {dictionary.map((entry, i) => (
                  <button
                    key={i}
                    onClick={() => setDictIndex(i)}
                    className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20 hover:border-green-400/50 transition text-left"
                  >
                    <p className="text-base font-semibold text-green-300">{entry.word}</p>
                    <p className="text-xs text-slate-500 mt-1">Tap to review</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
