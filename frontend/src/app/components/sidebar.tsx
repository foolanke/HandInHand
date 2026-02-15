import { motion } from "motion/react";
import { useState } from "react";
import { Home, Settings, Target, Flame, Star, User, BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
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
  const dailyGoalProgress = Math.min((dailyGoal / 50) * 100, 100);
  const [dictIndex, setDictIndex] = useState(0);
  const [isDictOpen, setIsDictOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<'level' | 'streak' | 'goal' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'editProfile'>('main');

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
          className="w-full justify-start gap-4 h-14 text-base bg-gradient-to-r from-blue-600 to-purple-600 text-slate-100 shadow-lg border border-blue-500/20"
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
      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        {/* Level & XP */}
        <motion.div
          className="flex-1 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-5 border border-yellow-500/20 cursor-pointer flex flex-col justify-center"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpandedCard('level')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              <span className="text-base font-semibold text-slate-100">Level {level}</span>
            </div>
            <span className="text-sm text-slate-400">{totalXP} XP</span>
          </div>
          <Progress value={levelProgress} className="h-2.5 bg-slate-800" />
          <p className="text-sm text-slate-400 mt-2">{xpForNextLevel} XP to next level</p>
        </motion.div>

        {/* Streak */}
        <motion.div
          className="flex-1 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-5 border border-orange-500/20 cursor-pointer flex flex-col justify-center"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpandedCard('streak')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-400" />
              <span className="text-base font-semibold text-slate-100">{streak} Day Streak</span>
            </div>
            <span className="text-sm text-orange-400 font-bold">~</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">Keep it up!</p>
        </motion.div>

        {/* Daily Goal */}
        <motion.div
          className="flex-1 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-5 border border-slate-800 cursor-pointer flex flex-col justify-center"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpandedCard('goal')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-blue-400" />
              <span className="text-base font-semibold text-slate-100">Daily Goal</span>
            </div>
            <span className="text-sm font-bold text-blue-400">{dailyGoal} / 50 XP</span>
          </div>
          <Progress value={dailyGoalProgress} className="h-2.5 mb-2" />
          <p className="text-sm text-slate-400">
            {dailyGoal >= 50 ? "Daily goal reached!" : `${50 - dailyGoal} XP remaining`}
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
          {settingsView === 'editProfile' ? (
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
                    <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg hover:bg-slate-700 transition cursor-pointer">
                      <span className="text-sm text-slate-300">Change Password</span>
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
                    <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
                      <span className="text-sm text-slate-300">Daily Goal</span>
                      <span className="text-sm text-blue-400 font-semibold">50 XP</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
                      <span className="text-sm text-slate-300">Reminder Notifications</span>
                      <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-400" />
                    Appearance
                  </h3>
                  <div className="space-y-3 ml-7">
                    <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg hover:bg-slate-700 transition cursor-pointer">
                      <span className="text-sm text-slate-300">Theme</span>
                      <span className="text-sm text-slate-500">Dark</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg hover:bg-slate-700 transition cursor-pointer">
                      <span className="text-sm text-slate-300">Language</span>
                      <span className="text-sm text-slate-500">English</span>
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
              <Star className="w-16 h-16 text-yellow-400 fill-yellow-400 mx-auto mb-4" />
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
              <p className="text-lg text-slate-400 mb-6">{dailyGoal} / 50 XP today</p>
              <Progress value={dailyGoalProgress} className="h-4 mb-3" />
              <p className="text-sm text-slate-400">
                {dailyGoal >= 50
                  ? "Daily goal reached! Well done!"
                  : `${50 - dailyGoal} XP remaining — keep going!`}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    )}
    </>
  );
}
