import { motion } from "motion/react";
import { useState } from "react";
import { Home, Settings, Target, Flame, Star, User, BookOpen, ChevronLeft, ChevronRight, X, Check, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { AvatarPreview, DEFAULT_AVATAR } from "./avatar-preview";
import { AvatarBuilder } from "./avatar-builder";
import type { AvatarConfig } from "./avatar-preview";

interface SidebarProps {
  streak: number;
  level: number;
  totalXP: number;
  levelProgress: number;
  xpForNextLevel: number;
  dailyGoal: number;
  completedLessons: number;
  totalLessons: number;
  dictionary: { word: string; videoPath: string }[];
}

function loadProfile(): { name: string; avatar: AvatarConfig } {
  try {
    const raw = localStorage.getItem("asl_profile");
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration: old format had avatarIndex, new has avatar object
      if (parsed.avatar && typeof parsed.avatar === "object") {
        return { name: parsed.name || "Learner", avatar: { ...DEFAULT_AVATAR, ...parsed.avatar } };
      }
      return { name: parsed.name || "Learner", avatar: DEFAULT_AVATAR };
    }
  } catch { /* ignore */ }
  return { name: "Learner", avatar: DEFAULT_AVATAR };
}

export function Sidebar({ streak, level, totalXP, levelProgress, xpForNextLevel, dailyGoal, completedLessons, totalLessons, dictionary }: SidebarProps) {
  const [dailyGoalTarget, setLocalDailyGoalTarget] = useState(() => {
    try {
      const saved = localStorage.getItem("asl_dailyGoalTarget");
      return saved ? parseInt(saved, 10) : 50;
    } catch {
      return 50;
    }
  });
  const dailyGoalProgress = Math.min((dailyGoal / dailyGoalTarget) * 100, 100);
  const [dictIndex, setDictIndex] = useState(0);
  const [isDictOpen, setIsDictOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<'level' | 'streak' | 'goal' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'editProfile' | 'editDailyGoal'>('main');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Profile state
  const [profile, setProfile] = useState(loadProfile);
  const [editName, setEditName] = useState(profile.name);
  const [editAvatar, setEditAvatar] = useState<AvatarConfig>(profile.avatar);

  function saveProfile(name: string, avatar: AvatarConfig) {
    const newProfile = { name: name.trim() || "Learner", avatar };
    localStorage.setItem("asl_profile", JSON.stringify(newProfile));
    setProfile(newProfile);
  }

  function openEditProfile() {
    setEditName(profile.name);
    setEditAvatar(profile.avatar);
    setSettingsView('editProfile');
  }

  function resetProgress() {
    // Clear all progress-related localStorage
    localStorage.removeItem("asl_completedLessons");
    localStorage.removeItem("asl_totalXP");
    localStorage.removeItem("asl_dailyGoal");
    localStorage.removeItem("asl_streak");
    localStorage.removeItem("asl_masteryMap");

    // Reload the page to reset state
    window.location.reload();
  }

  return (
    <>
    <motion.div
      className="fixed left-0 top-0 h-screen w-80 bg-slate-900 border-r border-slate-700 z-40 flex flex-col"
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      {/* Decorative vine along top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      {/* Brand */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-800 flex items-center gap-3">
        <img src="/logo.png" alt="HandInHand" className="w-10 h-10 rounded-lg" />
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">HandInHand</h1>
      </div>

      {/* Profile */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border-3 border-slate-700 overflow-hidden">
            <AvatarPreview config={profile.avatar} size={72} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-100">{profile.name}</h3>
            <p className="text-sm text-slate-400">Level {level} · {totalXP} XP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 border-b border-slate-800">
        <Button
          variant="default"
          className="w-full justify-start gap-4 h-14 text-base bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 text-white shadow-lg border border-purple-400/30 hover:from-purple-600 hover:via-purple-500 hover:to-purple-400 transition-all"
        >
          <Home className="w-6 h-6" />
          <span className="font-medium">Learn</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 h-14 text-base text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          onClick={() => { setDictIndex(-1); setIsDictOpen(true); }}
        >
          <BookOpen className="w-6 h-6" />
          <span className="font-medium">Dictionary</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 h-14 text-base text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="w-6 h-6" />
          <span className="font-medium">Settings</span>
        </Button>
      </nav>

      {/* Stats Cards - fill remaining space evenly */}
      <div className="p-4 flex-1 min-h-0 flex flex-col gap-2.5">
        {/* Level & XP */}
        <motion.div
          className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-3 border border-yellow-500/20 cursor-pointer flex flex-col justify-center flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpandedCard('level')}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-slate-100">Level {level}</span>
            </div>
            <span className="text-xs text-slate-400">{totalXP} XP</span>
          </div>
          <Progress value={levelProgress} className="h-2 bg-slate-800" />
          <p className="text-xs text-slate-400 mt-1">{xpForNextLevel} XP to next level</p>
        </motion.div>

        {/* Streak */}
        <motion.div
          className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-3 border border-orange-500/20 cursor-pointer flex flex-col justify-center flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpandedCard('streak')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-semibold text-slate-100">{streak} Day Streak</span>
            </div>
            <span className="text-xs text-orange-400 font-bold">~</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Keep it up!</p>
        </motion.div>

        {/* Daily Goal */}
        <motion.div
          className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-3 border border-slate-800 cursor-pointer flex flex-col justify-center flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpandedCard('goal')}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-slate-100">Daily Goal</span>
            </div>
            <span className="text-xs font-bold text-blue-400">{dailyGoal} / {dailyGoalTarget} XP</span>
          </div>
          <Progress value={dailyGoalProgress} className="h-2 mb-1" />
          <p className="text-xs text-slate-400">
            {dailyGoal >= dailyGoalTarget ? "Daily goal reached!" : `${dailyGoalTarget - dailyGoal} XP remaining`}
          </p>
        </motion.div>
      </div>

      {/* Decorative bottom vine */}
      <div className="h-1 bg-gradient-to-r from-transparent via-purple-600/30 to-transparent" />
    </motion.div>

    {/* Dictionary Overlay */}
    {isDictOpen && (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[85vh] mx-4 p-8 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-slate-100">Dictionary</h2>
              <span className="text-sm text-slate-500 ml-2">{dictionary.length} words</span>
            </div>
            <button
              onClick={() => { setIsDictOpen(false); setDictIndex(-1); }}
              className="text-slate-500 hover:text-slate-100 transition p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {dictionary.length === 0 ? (
            <p className="text-slate-500 text-center py-12">
              Complete lessons to add words here!
            </p>
          ) : dictIndex >= 0 ? (
            <>
              <button
                onClick={() => setDictIndex(-1)}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-100 transition mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to all words
              </button>

              <div className="bg-slate-800 rounded-xl overflow-hidden mb-6">
                <video
                  key={dictIndex}
                  src={dictionary[dictIndex].videoPath}
                  controls
                  autoPlay
                  playsInline
                  className="w-full aspect-video object-cover"
                />
              </div>

              <p className="text-center text-3xl font-bold text-blue-400 mb-6">
                {dictionary[dictIndex].word}
              </p>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setDictIndex(i => (i - 1 + dictionary.length) % dictionary.length)}
                  className="text-slate-500 hover:text-slate-100 transition p-2 rounded-lg hover:bg-slate-800"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-sm text-slate-500">
                  {dictIndex + 1} / {dictionary.length}
                </span>
                <button
                  onClick={() => setDictIndex(i => (i + 1) % dictionary.length)}
                  className="text-slate-500 hover:text-slate-100 transition p-2 rounded-lg hover:bg-slate-800"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </>
          ) : (
            <div className="overflow-y-auto flex-1 -mx-2">
              <div className="grid grid-cols-3 gap-3 px-2">
                {dictionary.map((entry, i) => (
                  <button
                    key={i}
                    onClick={() => setDictIndex(i)}
                    className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition text-left"
                  >
                    <p className="text-base font-semibold text-blue-400">{entry.word}</p>
                    <p className="text-xs text-slate-500 mt-1">Tap to review</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Settings Overlay */}
    {isSettingsOpen && (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <motion.div
          className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl mx-4 p-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {settingsView === 'editDailyGoal' ? (
            <>
              {/* Edit Daily Goal Header */}
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSettingsView('main')}
                    className="text-slate-400 hover:text-slate-100 transition p-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-100">Daily Goal</h2>
                </div>
                <button
                  onClick={() => { setIsSettingsOpen(false); setSettingsView('main'); }}
                  className="text-slate-500 hover:text-slate-100 transition p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Goal Options */}
              <div className="mb-8">
                <p className="text-sm text-slate-400 mb-4">Choose your daily XP goal</p>
                <div className="space-y-3">
                  {[10, 20, 30, 50, 75, 100].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setLocalDailyGoalTarget(goal)}
                      className={`w-full p-4 rounded-lg border transition-all ${
                        dailyGoalTarget === goal
                          ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/50'
                          : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className={`w-5 h-5 ${dailyGoalTarget === goal ? 'text-blue-400' : 'text-slate-500'}`} />
                          <span className={`text-base font-semibold ${dailyGoalTarget === goal ? 'text-slate-100' : 'text-slate-300'}`}>
                            {goal} XP
                          </span>
                        </div>
                        {dailyGoalTarget === goal && (
                          <Check className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <p className={`text-xs mt-1 text-left ml-8 ${dailyGoalTarget === goal ? 'text-slate-400' : 'text-slate-500'}`}>
                        {goal <= 20 ? 'Light practice' : goal <= 50 ? 'Regular practice' : 'Intensive practice'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSettingsView('main')}
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("asl_dailyGoalTarget", dailyGoalTarget.toString());
                    setSettingsView('main');
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </>
          ) : settingsView === 'editProfile' ? (
            <>
              {/* Edit Profile Header */}
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSettingsView('main')}
                    className="text-slate-400 hover:text-slate-100 transition p-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-100">Edit Profile</h2>
                </div>
                <button
                  onClick={() => { setIsSettingsOpen(false); setSettingsView('main'); }}
                  className="text-slate-500 hover:text-slate-100 transition p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Avatar Builder */}
              <AvatarBuilder value={editAvatar} onChange={setEditAvatar} />

              {/* Display Name */}
              <div className="mb-8">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="Enter your name"
                />
                <p className="text-xs text-slate-500 mt-1">{editName.length}/20 characters</p>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSettingsView('main')}
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    saveProfile(editName, editAvatar);
                    setSettingsView('main');
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Main Settings View */}
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-7 h-7 text-blue-400" />
                  <h2 className="text-2xl font-bold text-slate-100">Settings</h2>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-500 hover:text-slate-100 transition p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    Account
                  </h3>
                  <div className="space-y-3 ml-7">
                    <div
                      className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                      onClick={openEditProfile}
                    >
                      <span className="text-sm text-slate-300">Edit Profile</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    Learning Preferences
                  </h3>
                  <div className="space-y-3 ml-7">
                    <div
                      className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                      onClick={() => setSettingsView('editDailyGoal')}
                    >
                      <span className="text-sm text-slate-300">Daily Goal</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-400 font-semibold">{dailyGoalTarget} XP</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    Advanced
                  </h3>
                  <div className="space-y-3 ml-7">
                    <div
                      className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition cursor-pointer"
                      onClick={() => setShowResetConfirm(true)}
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400 font-medium">Reset Progress</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-red-400" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    )}

    {/* Stats Card Overlay */}
    {expandedCard && (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <motion.div
          className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md mx-4 p-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setExpandedCard(null)}
              className="text-slate-500 hover:text-slate-100 transition p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {expandedCard === 'level' && (
            <div className="text-center">
              <Star className="w-16 h-16 text-yellow-400 fill-none stroke-yellow-400 stroke-2 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-100 mb-2">Level {level}</h2>
              <p className="text-lg text-slate-400 mb-6">{totalXP} Total XP</p>
              <Progress value={levelProgress} className="h-4 bg-slate-800 mb-3" />
              <p className="text-sm text-slate-400">{xpForNextLevel} XP to reach Level {level + 1}</p>
            </div>
          )}

          {expandedCard === 'streak' && (
            <div className="text-center">
              <Flame className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-100 mb-2">{streak} Day Streak</h2>
              <p className="text-lg text-slate-400 mb-6">Keep your streak going!</p>
              <div className="flex justify-center gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                      i < streak
                        ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                        : 'bg-slate-800/40 border border-slate-700 text-slate-600'
                    }`}
                  >
                    {i < streak ? <Star className="w-4 h-4" /> : i + 1}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4">Last 7 days</p>
            </div>
          )}

          {expandedCard === 'goal' && (
            <div className="text-center">
              <Target className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-100 mb-2">Daily Goal</h2>
              <p className="text-lg text-slate-400 mb-6">{dailyGoal} / {dailyGoalTarget} XP today</p>
              <Progress value={dailyGoalProgress} className="h-4 mb-3" />
              <p className="text-sm text-slate-400">
                {dailyGoal >= dailyGoalTarget
                  ? "Daily goal reached! Well done!"
                  : `${dailyGoalTarget - dailyGoal} XP remaining — keep going!`}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    )}

    {/* Reset Confirmation Modal */}
    {showResetConfirm && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          className="bg-slate-900 rounded-2xl border border-red-500/30 shadow-2xl w-full max-w-md p-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Reset All Progress?</h2>
            <p className="text-slate-400 mb-6">
              This will permanently delete all your progress, including completed lessons, XP, streak, and mastery data. This action cannot be undone.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  resetProgress();
                }}
                className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition shadow-lg"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
    </>
  );
}
