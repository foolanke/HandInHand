import { useState, useCallback, useRef, useEffect } from "react";
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
  updateMastery,
} from "../lib/lesson-algorithm";
import { Sparkles, Star, Zap } from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  description: string;
  type: "lesson" | "checkpoint" | "achievement";
  xp: number;
  unit: number;
}

const lessons: Lesson[] = [
  { id: 1, title: "Lesson 1", description: "Greetings", type: "lesson", xp: 10, unit: 1 },
  { id: 2, title: "Lesson 2", description: "Polite Expressions", type: "lesson", xp: 10, unit: 1 },
  { id: 3, title: "Lesson 3", description: "Politeness Markers", type: "lesson", xp: 15, unit: 1 },
  { id: 4, title: "Unit 1 Test", description: "Test your skills", type: "checkpoint", xp: 25, unit: 1 },

  // Unit 2 (Family)
  { id: 5, title: "Lesson 4", description: "Family: Kids", type: "lesson", xp: 15, unit: 2 },
  { id: 6, title: "Lesson 5", description: "Family: Adults", type: "lesson", xp: 15, unit: 2 },
  { id: 7, title: "Lesson 6", description: "Family: Parents", type: "lesson", xp: 20, unit: 2 },
  { id: 8, title: "Unit 2 Test", description: "Test your skills", type: "checkpoint", xp: 50, unit: 2 },

  { id: 10, title: "Lesson 7", description: "Siblings", type: "lesson", xp: 20, unit: 3 },
  { id: 11, title: "Lesson 8", description: "School Roles", type: "lesson", xp: 20, unit: 3 },
  { id: 12, title: "Lesson 9", description: "Social Bonds", type: "lesson", xp: 25, unit: 3 },
  { id: 13, title: "Unit 3 Test", description: "Checkpoint", type: "checkpoint", xp: 30, unit: 3 },

  { id: 14, title: "Lesson 11", description: "Places & Locations", type: "lesson", xp: 25, unit: 4 },
  { id: 15, title: "Lesson 12", description: "Travel", type: "lesson", xp: 25, unit: 4 },
  { id: 16, title: "Lesson 13", description: "Shopping", type: "lesson", xp: 30, unit: 4 },
  { id: 17, title: "Lesson 14", description: "Weather", type: "lesson", xp: 30, unit: 4 },
  { id: 18, title: "Lesson 15", description: "Time & Dates", type: "lesson", xp: 30, unit: 4 },
  { id: 19, title: "Final Test", description: "You did it!", type: "achievement", xp: 100, unit: 4 },
];

// Words for each lesson (keyed by lesson id)
const lessonWords: Record<number, LessonWord[]> = {
  1: [
    {
      word: "Hello",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson1-hello.mp4`,
      correctAnswer: "Hello",
      wrongAnswers: ["Goodbye", "Thank You", "Please", "Sorry"],
    },
    {
      word: "Goodbye",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson1-goodbye.mp4`,
      correctAnswer: "Goodbye",
      wrongAnswers: ["Hello", "Thank You", "Please", "Sorry"],
    },
  ],
  2: [
    {
      word: "Please",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson1-please.mp4`,
      correctAnswer: "Please",
      wrongAnswers: ["Thank You", "Hello", "Sorry", "Goodbye"],
    },
    {
      word: "Thank You",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson1-thank-you.mp4`,
      correctAnswer: "Thank You",
      wrongAnswers: ["Please", "Hello", "Sorry", "Goodbye"],
    },
  ],
  3: [
    {
      word: "Nice To Meet You",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson1-nice-to-meet-you.mp4`,
      correctAnswer: "Nice To Meet You",
      wrongAnswers: ["Sorry", "Hello", "Please", "Goodbye"],
    },
    {
      word: "Sorry",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson1-sorry.mp4`,
      correctAnswer: "Sorry",
      wrongAnswers: ["Nice To Meet You", "Hello", "Please", "Goodbye"],
    },
  ],

  // Unit 2 lessons
  5: [
    {
      word: "Boy",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson2-boy.mp4`,
      correctAnswer: "Boy",
      wrongAnswers: ["Girl", "Man", "Woman", "Father"],
    },
    {
      word: "Girl",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson2-girl.mp4`,
      correctAnswer: "Girl",
      wrongAnswers: ["Boy", "Woman", "Man", "Mother"],
    },
  ],
  6: [
    {
      word: "Man",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson2-man.mp4`,
      correctAnswer: "Man",
      wrongAnswers: ["Woman", "Boy", "Girl", "Father"],
    },
    {
      word: "Woman",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson2-woman.mp4`,
      correctAnswer: "Woman",
      wrongAnswers: ["Man", "Girl", "Boy", "Mother"],
    },
  ],
  7: [
    {
      word: "Father",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson2-father.mp4`,
      correctAnswer: "Father",
      wrongAnswers: ["Mother", "Man", "Boy", "Girl"],
    },
    {
      word: "Mother",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson2-mother.mp4`,
      correctAnswer: "Mother",
      wrongAnswers: ["Father", "Woman", "Girl", "Boy"],
    },
  ],

  // Unit 3 lessons
  10: [
    {
      word: "Brother",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson3-brother.mp4`,
      correctAnswer: "Brother",
      wrongAnswers: ["Sister", "Father", "Friend", "Student"],
    },
    {
      word: "Sister",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson3-sister.mp4`,
      correctAnswer: "Sister",
      wrongAnswers: ["Brother", "Mother", "Friend", "Teacher"],
    },
  ],
  11: [
    {
      word: "Student",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson3-student.mp4`,
      correctAnswer: "Student",
      wrongAnswers: ["Teacher", "Brother", "Friend", "Father"],
    },
    {
      word: "Teacher",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson3-teacher.mp4`,
      correctAnswer: "Teacher",
      wrongAnswers: ["Student", "Sister", "Mother", "Friend"],
    },
  ],
  12: [
    {
      word: "Family",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson3-family.mp4`,
      correctAnswer: "Family",
      wrongAnswers: ["Friend", "Brother", "Teacher", "Mother"],
    },
    {
      word: "Friend",
      videoPath: `${import.meta.env.BASE_URL}videos/lesson3-friend.mp4`,
      correctAnswer: "Friend",
      wrongAnswers: ["Family", "Sister", "Student", "Father"],
    },
  ],
};

// Lesson IDs belonging to each unit (used to build the unit test word pool)
const unitLessons: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [5, 6, 7],
  3: [10, 11, 12],
  4: [14, 15, 16, 17, 18],
};

const positions: ("left" | "center" | "right")[] = [
  "center", "right", "left", "center",
  "left", "right", "center", "left", "center",
  "right", "left", "center", "center",
  "left", "right", "center", "left", "right", "center",
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Cumulative XP required to reach each level (index = level - 1)
const LEVEL_THRESHOLDS = [0, 20, 50, 95, 160, 250, 375, 550, 790, 1120, 1570];

function getLevelInfo(xp: number) {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 500;
  const xpIntoLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return {
    level,
    xpForNextLevel: nextThreshold - xp,
    levelProgress: Math.round((xpIntoLevel / xpNeeded) * 100),
  };
}

export function LessonPath() {
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    () => new Set<number>(loadFromStorage<number[]>("asl_completedLessons", []))
  );

  const [totalXP, setTotalXP] = useState<number>(() => loadFromStorage("asl_totalXP", 0));

  const [dailyGoal, setDailyGoal] = useState<number>(() => loadFromStorage("asl_dailyGoal", 0));
  const [streak, setStreak] = useState<number>(() => loadFromStorage("asl_streak", 3));

  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  // Persist state
  useEffect(() => {
    localStorage.setItem("asl_completedLessons", JSON.stringify(Array.from(completedLessons)));
  }, [completedLessons]);

  useEffect(() => {
    localStorage.setItem("asl_totalXP", JSON.stringify(totalXP));
  }, [totalXP]);

  useEffect(() => {
    localStorage.setItem("asl_dailyGoal", JSON.stringify(dailyGoal));
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem("asl_streak", JSON.stringify(streak));
  }, [streak]);

  // Slot-based lesson state
  const [activeView, setActiveView] = useState<"path" | "sublesson">("path");
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[]>([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);

  const masteryMap = useRef<MasteryMap>(loadFromStorage("asl_masteryMap", {}));
  const sessionResults = useRef<{ word: string; slotIndex: number; wasCorrect: boolean }[]>([]);

  const isUnitTest = useRef(false);
  const isSkipAttempt = useRef(false);
  const isReviewSession = useRef(false);
  const unitTestCorrectCount = useRef(0);
  const currentUnitWords = useRef<LessonWord[]>([]);
  const lessonStartTime = useRef<number>(0);
  const [lessonDuration, setLessonDuration] = useState<number>(0);
  const [showSkipFailModal, setShowSkipFailModal] = useState(false);
  const [isReviewModal, setIsReviewModal] = useState(false);

  const { level, xpForNextLevel, levelProgress } = getLevelInfo(totalXP);

  // Refs for measuring star positions for connecting paths
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pathLines, setPathLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  useEffect(() => {
    // Delay measurement so the browser has time to lay out nodes
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      // Get each node's center relative to the container using offset-based traversal
      function getOffsetRelativeTo(el: HTMLElement, ancestor: HTMLElement) {
        let x = 0, y = 0;
        let current: HTMLElement | null = el;
        while (current && current !== ancestor) {
          x += current.offsetLeft;
          y += current.offsetTop;
          current = current.offsetParent as HTMLElement | null;
        }
        return { x, y };
      }

      const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
      for (let i = 0; i < lessons.length - 1; i++) {
        const a = nodeRefs.current[i];
        const b = nodeRefs.current[i + 1];
        if (!a || !b) continue;
        const aPos = getOffsetRelativeTo(a, container);
        const bPos = getOffsetRelativeTo(b, container);
        lines.push({
          x1: aPos.x + a.offsetWidth / 2,
          y1: aPos.y + a.offsetHeight / 2,
          x2: bPos.x + b.offsetWidth / 2,
          y2: bPos.y + b.offsetHeight / 2,
        });
      }
      setPathLines(lines);
    }, 300);
    return () => clearTimeout(timer);
  }, [completedLessons, activeView]);

  const completeLesson = useCallback((lessonIndex: number) => {
    const lesson = lessons[lessonIndex];

    // If this was a skip attempt, check pass rate (≥70% SS2 correct)
    if (isSkipAttempt.current) {
      const ss2Results = sessionResults.current;
      const correct = ss2Results.filter((r) => r.wasCorrect).length;
      const total = ss2Results.length;
      const passed = total > 0 && correct / total >= 0.7;

      setActiveView("path");
      setLessonSlots([]);
      setCurrentSlotIndex(0);
      sessionResults.current = [];
      isUnitTest.current = false;
      isSkipAttempt.current = false;
      currentUnitWords.current = [];

      if (passed) {
        // Mark all lessons in this unit as complete
        const unitLessonIndices = lessons
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => l.unit === lesson.unit)
          .map(({ i }) => i);
        setCompletedLessons((prev) => {
          const newSet = new Set(prev);
          unitLessonIndices.forEach((i) => newSet.add(i));
          return newSet;
        });
        setTotalXP((prev) => prev + lesson.xp);
        setDailyGoal((prev) => prev + lesson.xp);
        setLessonDuration(Math.round((Date.now() - lessonStartTime.current) / 1000));
        setShowConfetti(true);
        setShowModal(true);
      } else {
        setShowSkipFailModal(true);
      }
      return;
    }

    const review = isReviewSession.current;

    if (!review) {
      setCompletedLessons((prev) => {
        const newSet = new Set(prev);
        newSet.add(lessonIndex);
        return newSet;
      });
      setTotalXP((prev) => prev + lesson.xp);
      setDailyGoal((prev) => prev + lesson.xp);
    }

    setLessonDuration(Math.round((Date.now() - lessonStartTime.current) / 1000));
    setIsReviewModal(review);
    setShowConfetti(!review);
    setShowModal(true);

    setActiveView("path");
    setLessonSlots([]);
    setCurrentSlotIndex(0);

    sessionResults.current = [];
    isUnitTest.current = false;
    isSkipAttempt.current = false;
    isReviewSession.current = false;
    unitTestCorrectCount.current = 0;
    currentUnitWords.current = [];
  }, []);

  const handleLessonClick = useCallback(
    (lessonIndex: number) => {
      const lesson = lessons[lessonIndex];
      setCurrentLesson(lesson);
      lessonStartTime.current = Date.now();
      sessionResults.current = [];

      if (lesson.type === "checkpoint") {
        // Unit Test: gather all words from this unit's lessons
        const unitWords = (unitLessons[lesson.unit] ?? []).flatMap((id) => lessonWords[id] ?? []);
        if (unitWords.length > 0) {
          for (const w of unitWords) {
            if (!masteryMap.current[w.word]) masteryMap.current[w.word] = defaultWordStats();
          }

          isUnitTest.current = true;
          unitTestCorrectCount.current = 0;
          currentUnitWords.current = unitWords;

          setLessonSlots(generateUnitTestSlots(unitWords, masteryMap.current));
          setCurrentSlotIndex(0);
          setActiveView("sublesson");
        } else {
          completeLesson(lessonIndex);
        }
        return;
      }

      if (lesson.type === "achievement") {
        completeLesson(lessonIndex);
        return;
      }

      const words = lessonWords[lesson.id];
      if (lesson.type === "lesson" && words) {
        for (const w of words) {
          if (!masteryMap.current[w.word]) masteryMap.current[w.word] = defaultWordStats();
        }

        isUnitTest.current = false;
        isReviewSession.current = completedLessons.has(lessonIndex);
        currentUnitWords.current = [];

        setLessonSlots(generateSlots(words, masteryMap.current));
        setCurrentSlotIndex(0);
        setActiveView("sublesson");
      } else {
        completeLesson(lessonIndex);
      }
    },
    [completeLesson]
  );

  const handleSkipToTest = useCallback(
    (unitNumber: number) => {
      const checkpoint = lessons.find((l) => l.unit === unitNumber && l.type === "checkpoint");
      if (!checkpoint) return;
      const unitWords = (unitLessons[unitNumber] ?? []).flatMap((id) => lessonWords[id] ?? []);
      if (unitWords.length === 0) return;
      for (const w of unitWords) {
        if (!masteryMap.current[w.word]) masteryMap.current[w.word] = defaultWordStats();
      }
      setCurrentLesson(checkpoint);
      lessonStartTime.current = Date.now();
      sessionResults.current = [];
      isUnitTest.current = true;
      isSkipAttempt.current = true;
      unitTestCorrectCount.current = 0;
      currentUnitWords.current = unitWords;
      setLessonSlots(generateUnitTestSlots(unitWords, masteryMap.current));
      setCurrentSlotIndex(0);
      setActiveView("sublesson");
    },
    []
  );

  const handleSlotComplete = useCallback(
    (wasCorrect?: boolean) => {
      const slot = lessonSlots[currentSlotIndex];
      if (!slot) return;

      const words = isUnitTest.current
        ? currentUnitWords.current
        : (lessonWords[currentLesson!.id] ?? []);

      // update mastery + persist
      masteryMap.current = updateMastery(masteryMap.current, slot, currentSlotIndex, wasCorrect);
      localStorage.setItem("asl_masteryMap", JSON.stringify(masteryMap.current));

      // track ss2 results
      if (slot.type === "ss2") {
        sessionResults.current.push({
          word: slot.word,
          slotIndex: currentSlotIndex,
          wasCorrect: wasCorrect ?? true,
        });
      }

      // runtime overrides
      let updatedSlots = lessonSlots;

      if (isUnitTest.current) {
        if (slot.type === "ss2") {
          if (wasCorrect) {
            unitTestCorrectCount.current += 1;
            // Reached 12 correct — complete
            if (unitTestCorrectCount.current >= 12) {
              completeLesson(lessons.findIndex((l) => l.id === currentLesson!.id));
              return;
            }
          } else {
            // Wrong — append a new SS2 for this word at the end
            const wordData = words.find((w) => w.word === slot.word);
            if (wordData) {
              updatedSlots = [
                ...lessonSlots,
                { type: "ss2" as const, word: wordData.word, videoPath: wordData.videoPath, correctAnswer: wordData.correctAnswer, wrongAnswers: wordData.wrongAnswers },
              ];
              setLessonSlots(updatedSlots);
            }
          }
        }
      } else {
        // IMPORTANT: overrideSlot3 is meant to run after the first SS2 slot (index 2)
        if (currentSlotIndex === 2) {
          updatedSlots = overrideSlot3(lessonSlots, words, slot.word, wasCorrect ?? true);
          setLessonSlots(updatedSlots);
        } else if (currentSlotIndex === 4) {
          updatedSlots = overrideSlot5(lessonSlots, words, sessionResults.current, masteryMap.current);
          setLessonSlots(updatedSlots);
        }
      }

      // advance
      const nextIndex = currentSlotIndex + 1;
      if (nextIndex < updatedSlots.length) {
        setCurrentSlotIndex(nextIndex);
      } else {
        completeLesson(lessons.findIndex((l) => l.id === currentLesson!.id));
      }
    },
    [lessonSlots, currentSlotIndex, currentLesson, completeLesson]
  );

  const handleBack = useCallback(() => {
    setActiveView("path");
    setLessonSlots([]);
    setCurrentSlotIndex(0);
    sessionResults.current = [];
    isUnitTest.current = false;
    currentUnitWords.current = [];
    setCurrentLesson(null);
  }, []);

  // NOTE: completedLessons stores lesson *index*, and you pass `index` into getLessonStatus.
  const getLessonStatus = (lessonIndex: number): "locked" | "unlocked" | "completed" => {
    if (completedLessons.has(lessonIndex)) return "completed";
    if (lessonIndex === 0) return "unlocked";
    const previousCompleted = completedLessons.has(lessonIndex - 1);
    return previousCompleted ? "unlocked" : "locked";
  };


  // Render active sublesson slot
  if (activeView === "sublesson" && lessonSlots.length > 0) {
    const slot = lessonSlots[currentSlotIndex];
    const slotKey = `${currentSlotIndex}-${slot.type}-${slot.word}`;

    const unitNames = ['Greetings & Basics', 'Family', 'Daily Life', 'Out & About'];
    const unitName = unitNames[(currentLesson?.unit ?? 1) - 1] ?? 'ASL';

    if (slot.type === "ss1") {
      return (
        <SublessonScreen
          key={slotKey}
          wordPhrase={slot.word}
          videoPath={slot.videoPath}
          unitName={unitName}
          onComplete={() => handleSlotComplete()}
          onBack={handleBack}
        />
      );
    }
    if (slot.type === "ss2") {
      return (
        <SublessonScreen2
          key={slotKey}
          wordPhrase={slot.word}
          videoPath={slot.videoPath}
          correctAnswer={slot.correctAnswer}
          wrongAnswers={slot.wrongAnswers}
          unitName={unitName}
          onComplete={(correct) => handleSlotComplete(correct)}
          onBack={handleBack}
        />
      );
    }
    if (slot.type === "ss3") {
      return (
        <SublessonScreen3
          key={slotKey}
          wordPhrase={slot.word}
          unitName={unitName}
          onComplete={() => handleSlotComplete()}
          onBack={handleBack}
        />
      );
    }
  }

  // Otherwise, show the main lesson path
  const unitStarts = [0, 4, 8, 12];

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <Sidebar
        streak={streak}
        level={level}
        totalXP={totalXP}
        levelProgress={levelProgress}
        xpForNextLevel={xpForNextLevel}
        dailyGoal={dailyGoal}
        completedLessons={completedLessons.size}
        totalLessons={lessons.length}
        dictionary={Array.from(completedLessons).flatMap((index) => lessonWords[lessons[index]?.id] ?? [])}
      />

      <div className="flex-1 ml-80 flex flex-col h-screen relative">
        <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

        {currentLesson && (
          <LessonCompleteModal
            isOpen={showModal}
            xpEarned={isReviewModal ? 0 : currentLesson.xp}
            lessonTitle={currentLesson.title}
            duration={lessonDuration}
            isReview={isReviewModal}
            onContinue={() => {
              setShowModal(false);
              setCurrentLesson(null);
              setIsReviewModal(false);
            }}
          />
        )}

        {showSkipFailModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
            <motion.div
              className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Not quite yet!</h2>
              <p className="text-slate-400 mb-6">Work through the lessons to build up your skills, then try the unit test again.</p>
              <button
                onClick={() => { setShowSkipFailModal(false); setCurrentLesson(null); }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 text-lg font-bold rounded-xl shadow-lg transition"
              >
                Keep Practicing
              </button>
            </motion.div>
          </div>
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Douling</h1>
        </motion.div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <PathDecorations totalLessons={lessons.length} />

          <div className="relative max-w-2xl mx-auto py-16 px-8" ref={containerRef}>
            {/* Connecting paths between stars */}
            {pathLines.length > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 1 }}
              >
                <defs>
                  <linearGradient id="pathLit" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                  <linearGradient id="pathDim" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                  <filter id="pathGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {pathLines.map((line, index) => {
                  const isLit = getLessonStatus(index) === 'completed';
                  const midY = (line.y1 + line.y2) / 2;
                  const pathD = `M ${line.x1} ${line.y1} C ${line.x1} ${midY}, ${line.x2} ${midY}, ${line.x2} ${line.y2}`;

                  return (
                    <motion.path
                      key={`path-${index}`}
                      d={pathD}
                      stroke={isLit ? "url(#pathLit)" : "url(#pathDim)"}
                      strokeWidth={isLit ? 3 : 2}
                      fill="none"
                      strokeLinecap="round"
                      filter={isLit ? "url(#pathGlow)" : undefined}
                      opacity={isLit ? 0.8 : 0.3}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.6, ease: "easeOut" }}
                    />
                  );
                })}
              </svg>
            )}

            <div className="relative flex flex-col gap-16" style={{ zIndex: 2 }}>
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
                        <div className="inline-flex flex-col items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl px-8 py-4 shadow-2xl border-4 border-slate-800">
                          <div className="flex items-center gap-3">
                            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                            <h2 className="text-2xl font-bold text-white">Unit {unitNumber}</h2>
                            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                          </div>
                          <p className="text-sm text-blue-200 font-medium">
                            {(['Greetings & Basics', 'Family', 'Daily Life', 'Out & About'] as const)[unitNumber - 1]}
                          </p>
                          <button
                            onClick={() => handleSkipToTest(unitNumber)}
                            className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full transition shadow"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Jump to Unit Test
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <div ref={(el) => { nodeRefs.current[index] = el; }}>
                      <LessonNode
                        lesson={lesson}
                        status={getLessonStatus(index)}
                        position={positions[index % positions.length]}
                        onClick={() => handleLessonClick(index)}
                        index={index}
                      />
                    </div>
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