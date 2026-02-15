import { useState, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { LessonNode } from "./lesson-node";
import { Confetti } from "./confetti";
import { LessonCompleteModal } from "./lesson-complete-modal";
import { Sidebar } from "./sidebar";
import { PathDecorations } from "./path-decorations";
import SublessonScreen from "./sublesson-screen1";
import SublessonScreen2 from "./sublesson-screen2";
import SublessonScreen3 from "./sublesson-screen3";
import {
  type LessonWord,
  type LessonSlot,
  type MasteryMap,
  defaultWordStats,
  generateSlots,
  overrideSlot3,
  overrideSlot5,
  generateUnitTestSlots,
  overrideUnitTestAfterMiss,
  updateMastery,
} from "../lib/lesson-algorithm";
import { Flame, Star, TrendingUp, Settings, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface Lesson {
  id: number;
  title: string;
  description: string;
  type: 'lesson' | 'checkpoint' | 'achievement';
  xp: number;
  unit: number;
}

const lessons: Lesson[] = [
  { id: 1, title: "Lesson 1", description: "Greetings", type: 'lesson', xp: 10, unit: 1 },
  { id: 2, title: "Lesson 2", description: "Polite Expressions", type: 'lesson', xp: 10, unit: 1 },
  { id: 3, title: "Lesson 3", description: "Politeness Markers", type: 'lesson', xp: 15, unit: 1 },
  { id: 4, title: "Unit 1 Test", description: "Test your skills", type: 'checkpoint', xp: 25, unit: 1 },
  
  { id: 5, title: "Lesson 4", description: "Numbers & Counting", type: 'lesson', xp: 15, unit: 2 },
  { id: 6, title: "Lesson 5", description: "Colors", type: 'lesson', xp: 15, unit: 2 },
  { id: 7, title: "Lesson 6", description: "Food & Drinks", type: 'lesson', xp: 20, unit: 2 },
  { id: 8, title: "Lesson 7", description: "Animals", type: 'lesson', xp: 20, unit: 2 },
  { id: 9, title: "Unit Master", description: "Unit 2 Complete!", type: 'achievement', xp: 50, unit: 2 },
  
  { id: 10, title: "Lesson 8", description: "Family Members", type: 'lesson', xp: 20, unit: 3 },
  { id: 11, title: "Lesson 9", description: "Body Parts", type: 'lesson', xp: 20, unit: 3 },
  { id: 12, title: "Lesson 10", description: "Emotions", type: 'lesson', xp: 25, unit: 3 },
  { id: 13, title: "Unit 3 Test", description: "Checkpoint", type: 'checkpoint', xp: 30, unit: 3 },
  
  { id: 14, title: "Lesson 11", description: "Places & Locations", type: 'lesson', xp: 25, unit: 4 },
  { id: 15, title: "Lesson 12", description: "Travel", type: 'lesson', xp: 25, unit: 4 },
  { id: 16, title: "Lesson 13", description: "Shopping", type: 'lesson', xp: 30, unit: 4 },
  { id: 17, title: "Lesson 14", description: "Weather", type: 'lesson', xp: 30, unit: 4 },
  { id: 18, title: "Lesson 15", description: "Time & Dates", type: 'lesson', xp: 30, unit: 4 },
  { id: 19, title: "Final Test", description: "You did it!", type: 'achievement', xp: 100, unit: 4 },
];

// Words for each lesson (keyed by lesson id)
const lessonWords: Record<number, LessonWord[]> = {
  1: [
    { word: "Hello",   videoPath: `${import.meta.env.BASE_URL}videos/lesson1-hello.mp4`,   correctAnswer: "Hello",   wrongAnswers: ["Goodbye", "Thank You", "Please", "Sorry"] },
    { word: "Goodbye", videoPath: `${import.meta.env.BASE_URL}videos/lesson1-goodbye.mp4`, correctAnswer: "Goodbye", wrongAnswers: ["Hello",   "Thank You", "Please", "Sorry"] },
  ],
  2: [
    { word: "Please",   videoPath: `${import.meta.env.BASE_URL}videos/lesson1-please.mp4`,    correctAnswer: "Please",   wrongAnswers: ["Thank You", "Hello", "Sorry", "Goodbye"] },
    { word: "Thank You", videoPath: `${import.meta.env.BASE_URL}videos/lesson1-thank-you.mp4`, correctAnswer: "Thank You", wrongAnswers: ["Please",    "Hello", "Sorry", "Goodbye"] },
  ],
  3: [
    { word: "Nice To Meet You", videoPath: `${import.meta.env.BASE_URL}videos/lesson1-nice-to-meet-you.mp4`, correctAnswer: "Nice To Meet You", wrongAnswers: ["Sorry", "Hello", "Please", "Goodbye"] },
    { word: "Sorry",            videoPath: `${import.meta.env.BASE_URL}videos/lesson1-sorry.mp4`,            correctAnswer: "Sorry",            wrongAnswers: ["Nice To Meet You", "Hello", "Please", "Goodbye"] },
  ],
};

// Lesson IDs belonging to each unit (used to build the unit test word pool)
const unitLessons: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [5, 6, 7, 8],
  3: [10, 11, 12],
  4: [14, 15, 16, 17, 18],
};

const positions: ('left' | 'center' | 'right')[] = [
  'center', 'right', 'left', 'center', 
  'left', 'right', 'center', 'left', 'center',
  'right', 'left', 'center', 'center',
  'left', 'right', 'center', 'left', 'right', 'center'
];

export function LessonPath() {
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [totalXP, setTotalXP] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [streak, setStreak] = useState(3);
  
  // Slot-based lesson state
  const [activeView, setActiveView] = useState<'path' | 'sublesson'>('path');
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[]>([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const masteryMap = useRef<MasteryMap>({});
  const sessionResults = useRef<{ word: string; slotIndex: number; wasCorrect: boolean }[]>([]);
  const isUnitTest = useRef(false);
  const currentUnitWords = useRef<LessonWord[]>([]);

  const level = Math.floor(totalXP / 100) + 1;
  const xpForNextLevel = (level * 100) - totalXP;
  const levelProgress = (totalXP % 100);

  const completeLesson = useCallback((lessonIndex: number) => {
    const lesson = lessons[lessonIndex];
    setCompletedLessons((prev) => {
      const newSet = new Set(prev);
      newSet.add(lessonIndex);
      return newSet;
    });
    setTotalXP((prev) => prev + lesson.xp);
    setDailyGoal((prev) => prev + lesson.xp);
    setShowConfetti(true);
    setShowModal(true);
    setActiveView('path');
    setLessonSlots([]);
    setCurrentSlotIndex(0);
    sessionResults.current = [];
  }, []);

  const handleLessonClick = useCallback((lessonIndex: number) => {
    const lesson = lessons[lessonIndex];
    setCurrentLesson(lesson);
    sessionResults.current = [];

    if (lesson.type === 'checkpoint' || lesson.type === 'achievement') {
      // Unit Test: gather all words from this unit's lessons
      const unitWords = (unitLessons[lesson.unit] ?? []).flatMap(id => lessonWords[id] ?? []);
      if (unitWords.length > 0) {
        for (const w of unitWords) {
          if (!masteryMap.current[w.word]) masteryMap.current[w.word] = defaultWordStats();
        }
        isUnitTest.current = true;
        currentUnitWords.current = unitWords;
        setLessonSlots(generateUnitTestSlots(unitWords, masteryMap.current));
        setCurrentSlotIndex(0);
        setActiveView('sublesson');
      } else {
        completeLesson(lessonIndex);
      }
      return;
    }

    const words = lessonWords[lesson.id];
    if (lesson.type === 'lesson' && words) {
      for (const w of words) {
        if (!masteryMap.current[w.word]) masteryMap.current[w.word] = defaultWordStats();
      }
      isUnitTest.current = false;
      setLessonSlots(generateSlots(words, masteryMap.current));
      setCurrentSlotIndex(0);
      setActiveView('sublesson');
    } else {
      completeLesson(lessonIndex);
    }
  }, [completeLesson]);

  // Unified handler: called when any sublesson screen completes
  const handleSlotComplete = useCallback((wasCorrect?: boolean) => {
    const slot = lessonSlots[currentSlotIndex];
    if (!slot) return;

    const words = isUnitTest.current ? currentUnitWords.current : (lessonWords[currentLesson!.id] ?? []);

    // 1. Update mastery
    masteryMap.current = updateMastery(masteryMap.current, slot, currentSlotIndex, wasCorrect);

    // 2. Record SS2 result for session-level overrides
    if (slot.type === 'ss2') {
      sessionResults.current.push({ word: slot.word, slotIndex: currentSlotIndex, wasCorrect: wasCorrect ?? true });
    }

    // 3. Apply runtime overrides
    let updatedSlots = lessonSlots;
    if (isUnitTest.current) {
      // Unit test: after any wrong SS2, remediate 2 slots ahead
      if (slot.type === 'ss2' && wasCorrect === false) {
        updatedSlots = overrideUnitTestAfterMiss(lessonSlots, currentSlotIndex, slot.word, words);
        setLessonSlots(updatedSlots);
      }
    } else {
      // Regular lesson overrides
      if (currentSlotIndex === 1) {
        updatedSlots = overrideSlot3(lessonSlots, words, slot.word, wasCorrect ?? true);
        setLessonSlots(updatedSlots);
      } else if (currentSlotIndex === 4) {
        updatedSlots = overrideSlot5(lessonSlots, words, sessionResults.current, masteryMap.current);
        setLessonSlots(updatedSlots);
      }
    }

    // 4. Advance
    const nextIndex = currentSlotIndex + 1;
    if (nextIndex < updatedSlots.length) {
      setCurrentSlotIndex(nextIndex);
    } else {
      completeLesson(lessons.findIndex(l => l.id === currentLesson!.id));
    }
  }, [lessonSlots, currentSlotIndex, currentLesson, completeLesson]);

  const handleBack = useCallback(() => {
    setActiveView('path');
    setLessonSlots([]);
    setCurrentSlotIndex(0);
    sessionResults.current = [];
    isUnitTest.current = false;
    currentUnitWords.current = [];
    setCurrentLesson(null);
  }, []);

  const getLessonStatus = (lessonId: number): 'locked' | 'unlocked' | 'completed' => {
    if (completedLessons.has(lessonId)) return 'completed';
    if (lessonId === 0) return 'unlocked';
    const previousCompleted = completedLessons.has(lessonId - 1);
    return previousCompleted ? 'unlocked' : 'locked';
  };

  // Render active sublesson slot
  if (activeView === 'sublesson' && lessonSlots.length > 0) {
    const slot = lessonSlots[currentSlotIndex];
    const slotKey = `${currentSlotIndex}-${slot.type}-${slot.word}`;
    if (slot.type === 'ss1') {
      return (
        <SublessonScreen
          key={slotKey}
          wordPhrase={slot.word}
          videoPath={slot.videoPath}
          onComplete={() => handleSlotComplete()}
          onBack={handleBack}
        />
      );
    }
    if (slot.type === 'ss2') {
      return (
        <SublessonScreen2
          key={slotKey}
          wordPhrase={slot.word}
          videoPath={slot.videoPath}
          correctAnswer={slot.correctAnswer}
          wrongAnswers={slot.wrongAnswers}
          onComplete={(wasCorrect) => handleSlotComplete(wasCorrect)}
          onBack={handleBack}
        />
      );
    }
    if (slot.type === 'ss3') {
      return (
        <SublessonScreen3
          key={slotKey}
          wordPhrase={slot.word}
          onComplete={() => handleSlotComplete()}
          onBack={handleBack}
        />
      );
    }
  }

  // Otherwise, show the main lesson path
  const progress = (completedLessons.size / lessons.length) * 100;
  const dailyGoalProgress = Math.min((dailyGoal / 50) * 100, 100);
  const unitStarts = [0, 4, 9, 13];

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        streak={streak}
        level={level}
        totalXP={totalXP}
        dailyGoal={dailyGoal}
        completedLessons={completedLessons.size}
        totalLessons={lessons.length}
        dictionary={
          Array.from(completedLessons).flatMap(index => lessonWords[lessons[index]?.id] ?? [])
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-80 flex flex-col h-screen relative">
        <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
        
        {currentLesson && (
          <LessonCompleteModal
            isOpen={showModal}
            xpEarned={currentLesson.xp}
            lessonTitle={currentLesson.title}
            onContinue={() => { setShowModal(false); setCurrentLesson(null); }}
          />
        )}

        {/* Floating Logo */}
        <motion.div
          className="absolute top-6 left-8 z-30 flex items-center gap-3 bg-slate-900/60 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/50"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            LearnQuest
          </h1>
        </motion.div>

        {/* Scrollable Path Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <PathDecorations totalLessons={lessons.length} />
          
          <div className="relative max-w-2xl mx-auto py-16 px-8">
            {/* Cartoon Path Background - Fixed size */}
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[280px]" style={{ zIndex: 1 }}>
              <svg 
                className="w-full h-full"
                viewBox="0 0 280 2200"
                preserveAspectRatio="xMidYMin meet"
              >
                <defs>
                  <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e40af" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#db2777" stopOpacity="0.5" />
                  </linearGradient>
                  
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Shadow path */}
                <motion.path
                  d="M 140 0 
                     C 140 50, 160 80, 180 100
                     C 200 120, 180 160, 140 180
                     C 100 200, 80 240, 100 280
                     C 120 320, 160 320, 180 360
                     C 200 400, 180 440, 140 460
                     C 100 480, 60 520, 80 580
                     C 100 640, 160 660, 180 700
                     C 200 740, 180 780, 140 820
                     C 100 860, 80 900, 100 940
                     C 120 980, 160 1000, 180 1040
                     C 200 1080, 180 1120, 140 1160
                     C 100 1200, 60 1240, 100 1300
                     C 140 1360, 200 1360, 200 1420
                     C 200 1480, 160 1520, 140 1560
                     C 120 1600, 100 1640, 120 1680
                     C 140 1720, 180 1740, 180 1780
                     C 180 1820, 160 1860, 140 1900
                     C 120 1940, 100 1980, 140 2020
                     L 140 2200"
                  stroke="#0f172a"
                  strokeWidth="95"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />

                {/* Main glowing path */}
                <motion.path
                  d="M 140 0 
                     C 140 50, 160 80, 180 100
                     C 200 120, 180 160, 140 180
                     C 100 200, 80 240, 100 280
                     C 120 320, 160 320, 180 360
                     C 200 400, 180 440, 140 460
                     C 100 480, 60 520, 80 580
                     C 100 640, 160 660, 180 700
                     C 200 740, 180 780, 140 820
                     C 100 860, 80 900, 100 940
                     C 120 980, 160 1000, 180 1040
                     C 200 1080, 180 1120, 140 1160
                     C 100 1200, 60 1240, 100 1300
                     C 140 1360, 200 1360, 200 1420
                     C 200 1480, 160 1520, 140 1560
                     C 120 1600, 100 1640, 120 1680
                     C 140 1720, 180 1740, 180 1780
                     C 180 1820, 160 1860, 140 1900
                     C 120 1940, 100 1980, 140 2020
                     L 140 2200"
                  stroke="url(#pathGradient)"
                  strokeWidth="85"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.9"
                  filter="url(#glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </svg>
            </div>

            {/* Lessons */}
            <div className="relative flex flex-col gap-16" style={{ zIndex: 10 }}>
              {lessons.map((lesson, index) => {
                const isUnitStart = unitStarts.includes(index);
                const unitNumber = unitStarts.indexOf(index) + 1;

                return (
                  <div key={lesson.id} className="relative">
                    {isUnitStart && (
                      <motion.div
                        className="mb-10 text-center relative z-20"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, type: "spring" }}
                      >
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl px-8 py-4 shadow-2xl border-4 border-slate-800">
                          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                          <h2 className="text-2xl font-bold text-white">
                            Unit {unitNumber}
                          </h2>
                          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        </div>
                      </motion.div>
                    )}
                    
                    <LessonNode
                      lesson={lesson}
                      status={getLessonStatus(index)}
                      position={positions[index % positions.length]}
                      onClick={() => handleLessonClick(index)}
                      index={index}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}