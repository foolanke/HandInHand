import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Confetti } from "./confetti";
import { LessonCompleteModal } from "./lesson-complete-modal";
import { Sidebar } from "./sidebar";
import { LearningPath, type PathLesson } from "./learning-path";
import type { LessonStatus } from "./lesson-node";
import SublessonScreen from "./sublesson-screen1";
import SublessonScreen2 from "./sublesson-screen2";
import SublessonScreen3 from "./sublesson-screen3";
import AnalyzingScreen from "./analyzing-screen";
import ResultsPage, { type QuestionResult } from "./results-page";
import { submitRecording } from "../lib/api";
import type { EvaluationResult } from "./EvaluationModal";
import {
  type LessonWord,
  type LessonSlot,
  type MasteryMap,
  type PhasedLessonPlan,
  defaultWordStats,
  generatePhasedSlots,
  generatePhasedUnitTestSlots,
  updateMastery,
} from "../lib/lesson-algorithm";
import { Zap } from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  description: string;
  type: "lesson" | "checkpoint" | "achievement";
  xp: number;
  unit: number;
  position: { x: number; y: number };
}

const lessons: Lesson[] = [
  // Unit 1: Greetings & Basics
  { id: 1, title: "Lesson 1", description: "Greetings", type: "lesson", xp: 10, unit: 1, position: { x: 280, y: 240 } },
  { id: 2, title: "Lesson 2", description: "Polite Expressions", type: "lesson", xp: 10, unit: 1, position: { x: 400, y: 520 } },
  { id: 3, title: "Lesson 3", description: "Politeness Markers", type: "lesson", xp: 15, unit: 1, position: { x: 200, y: 800 } },
  { id: 4, title: "Unit 1 Test", description: "Test your skills", type: "checkpoint", xp: 25, unit: 1, position: { x: 340, y: 1080 } },

  // Unit 2 (Family)
  { id: 5, title: "Lesson 4", description: "Family: Kids", type: "lesson", xp: 15, unit: 2, position: { x: 200, y: 1580 } },
  { id: 6, title: "Lesson 5", description: "Family: Adults", type: "lesson", xp: 15, unit: 2, position: { x: 380, y: 1860 } },
  { id: 7, title: "Lesson 6", description: "Family: Parents", type: "lesson", xp: 20, unit: 2, position: { x: 220, y: 2140 } },
  { id: 8, title: "Unit 2 Test", description: "Test your skills", type: "checkpoint", xp: 50, unit: 2, position: { x: 360, y: 2420 } },

  // Unit 3 (Daily Life)
  { id: 10, title: "Lesson 7", description: "Siblings", type: "lesson", xp: 20, unit: 3, position: { x: 190, y: 2840 } },
  { id: 11, title: "Lesson 8", description: "School Roles", type: "lesson", xp: 20, unit: 3, position: { x: 390, y: 3120 } },
  { id: 12, title: "Lesson 9", description: "Social Bonds", type: "lesson", xp: 25, unit: 3, position: { x: 210, y: 3400 } },
  { id: 13, title: "Unit 3 Test", description: "Checkpoint", type: "checkpoint", xp: 30, unit: 3, position: { x: 350, y: 3680 } },

  // Unit 4 (Out & About)
  { id: 14, title: "Lesson 11", description: "Places & Locations", type: "lesson", xp: 25, unit: 4, position: { x: 180, y: 4100 } },
  { id: 15, title: "Lesson 12", description: "Travel", type: "lesson", xp: 25, unit: 4, position: { x: 380, y: 4380 } },
  { id: 16, title: "Lesson 13", description: "Shopping", type: "lesson", xp: 30, unit: 4, position: { x: 220, y: 4660 } },
  { id: 17, title: "Lesson 14", description: "Weather", type: "lesson", xp: 30, unit: 4, position: { x: 400, y: 4940 } },
  { id: 18, title: "Lesson 15", description: "Time & Dates", type: "lesson", xp: 30, unit: 4, position: { x: 200, y: 5220 } },
  { id: 19, title: "Final Test", description: "You did it!", type: "achievement", xp: 100, unit: 4, position: { x: 300, y: 5540 } },
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

// Build a lesson id → index lookup
const lessonIdToIndex = new Map<number, number>();
lessons.forEach((l, i) => lessonIdToIndex.set(l.id, i));

type LessonPhase = 'motion' | 'mcq' | 'analyzing' | 'results';

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

  // ── Phase-based lesson state ──────────────────────────────────────────────
  const [activeView, setActiveView] = useState<"path" | "sublesson">("path");
  const [lessonPhase, setLessonPhase] = useState<LessonPhase>('motion');
  const [motionSlotIndex, setMotionSlotIndex] = useState(0);
  const [mcqSlotIndex, setMcqSlotIndex] = useState(0);
  const [phasedPlan, setPhasedPlan] = useState<PhasedLessonPlan | null>(null);
  const [resolvedApiCount, setResolvedApiCount] = useState(0);

  // API results storage
  const motionApiResults = useRef<(EvaluationResult | null)[]>([]);
  const motionApiErrors = useRef<(string | null)[]>([]);
  const mcqResultsStore = useRef<{ word: string; selectedAnswer: string; correctAnswer: string; wasCorrect: boolean }[]>([]);

  const masteryMap = useRef<MasteryMap>(loadFromStorage("asl_masteryMap", {}));
  const isUnitTest = useRef(false);
  const isSkipAttempt = useRef(false);
  const isReviewSession = useRef(false);

  const lessonStartTime = useRef<number>(0);
  const [lessonDuration, setLessonDuration] = useState<number>(0);
  const [failReason, setFailReason] = useState<'skip' | 'lesson' | 'unit-test' | null>(null);
  const [isReviewModal, setIsReviewModal] = useState(false);

  // Results page data
  const [resultsData, setResultsData] = useState<{
    questions: QuestionResult[];
    totalCorrect: number;
    totalQuestions: number;
    passed: boolean;
    xpEarned: number;
  } | null>(null);

  const { level, xpForNextLevel, levelProgress } = getLevelInfo(totalXP);

  // Refs for measuring star positions for connecting paths
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pathLines, setPathLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

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

  // ── Transition from analyzing → results when all API calls resolved ───────
  useEffect(() => {
    if (lessonPhase === 'analyzing' && phasedPlan) {
      const totalMotion = phasedPlan.motionSlots.length;
      if (resolvedApiCount >= totalMotion) {
        buildAndShowResults();
      }
    }
  }, [resolvedApiCount, lessonPhase]);

  const resetSessionState = useCallback(() => {
    setActiveView("path");
    setPhasedPlan(null);
    setLessonPhase('motion');
    setMotionSlotIndex(0);
    setMcqSlotIndex(0);
    setResolvedApiCount(0);
    motionApiResults.current = [];
    motionApiErrors.current = [];
    mcqResultsStore.current = [];
    isUnitTest.current = false;
    isSkipAttempt.current = false;
    isReviewSession.current = false;
    setResultsData(null);
  }, []);

  const buildAndShowResults = useCallback(() => {
    if (!phasedPlan || !currentLesson) return;

    const questions: QuestionResult[] = [];
    let globalIndex = 0;

    // Motion questions
    phasedPlan.motionSlots.forEach((slot, i) => {
      const evalResult = motionApiResults.current[i] ?? null;
      const evalError = motionApiErrors.current[i] ?? null;
      const passed = evalError ? false : (evalResult?.overall_score_0_to_4 ?? 0) >= 3;

      questions.push({
        index: globalIndex++,
        type: 'motion',
        word: slot.word,
        passed,
        videoPath: slot.videoPath,
        evalResult,
        evalError,
      });
    });

    // MCQ questions
    phasedPlan.mcqSlots.forEach((slot, i) => {
      const mcq = mcqResultsStore.current[i];
      if (!mcq) return;
      questions.push({
        index: globalIndex++,
        type: 'mcq',
        word: mcq.word,
        passed: mcq.wasCorrect,
        videoPath: slot.videoPath,
        selectedAnswer: mcq.selectedAnswer,
        correctAnswer: mcq.correctAnswer,
      });
    });

    const totalCorrect = questions.filter(q => q.passed).length;
    const totalQuestions = questions.length;
    const passThreshold = Math.ceil(totalQuestions * 0.75);
    const passed = totalCorrect >= passThreshold;

    const review = isReviewSession.current;
    const xpEarned = (!review && passed) ? currentLesson.xp : 0;

    setResultsData({ questions, totalCorrect, totalQuestions, passed, xpEarned });
    setLessonPhase('results');
  }, [phasedPlan, currentLesson]);

  // ── Handle results page actions ───────────────────────────────────────────
  const handleResultsContinue = useCallback(() => {
    if (!currentLesson || !resultsData) return;
    const lessonIndex = lessons.findIndex(l => l.id === currentLesson.id);
    const review = isReviewSession.current;

    if (resultsData.passed) {
      if (!review) {
        setCompletedLessons(prev => {
          const s = new Set(prev);
          s.add(lessonIndex);
          return s;
        });

        if (resultsData.xpEarned > 0) {
          setTotalXP(prev => prev + resultsData.xpEarned);
          setDailyGoal(prev => prev + resultsData.xpEarned);
        }
      }

      // Update mastery for all completed slots
      if (phasedPlan) {
        phasedPlan.motionSlots.forEach((slot, i) => {
          const evalResult = motionApiResults.current[i];
          const passed = evalResult ? evalResult.overall_score_0_to_4 >= 3 : false;
          masteryMap.current = updateMastery(masteryMap.current, slot, i, passed);
        });
        phasedPlan.mcqSlots.forEach((slot, i) => {
          const mcq = mcqResultsStore.current[i];
          masteryMap.current = updateMastery(masteryMap.current, slot, phasedPlan.motionSlots.length + i, mcq?.wasCorrect);
        });
        localStorage.setItem("asl_masteryMap", JSON.stringify(masteryMap.current));
      }

      setLessonDuration(Math.round((Date.now() - lessonStartTime.current) / 1000));
      setIsReviewModal(review);
      setShowConfetti(!review && resultsData.xpEarned > 0);
      setShowModal(true);
    }

    resetSessionState();
  }, [currentLesson, resultsData, phasedPlan, resetSessionState]);

  const handleResultsRetry = useCallback(() => {
    if (!currentLesson) return;
    const lessonIndex = lessons.findIndex(l => l.id === currentLesson.id);
    resetSessionState();
    // Re-start the same lesson
    setTimeout(() => handleLessonClick(lessonIndex), 0);
  }, [currentLesson, resetSessionState]);

  // ── Lesson initialization ─────────────────────────────────────────────────
  const handleLessonClick = useCallback(
    (lessonIndex: number) => {
      const lesson = lessons[lessonIndex];
      setCurrentLesson(lesson);

      lessonStartTime.current = Date.now();
      motionApiResults.current = [];
      motionApiErrors.current = [];
      mcqResultsStore.current = [];
      setResolvedApiCount(0);
      setResultsData(null);

      if (lesson.type === "achievement") {
        // Auto-complete achievements
        setCompletedLessons(prev => { const s = new Set(prev); s.add(lessonIndex); return s; });
        setTotalXP(prev => prev + lesson.xp);
        setDailyGoal(prev => prev + lesson.xp);
        setLessonDuration(0);
        setShowConfetti(true);
        setShowModal(true);
        return;
      }

      let plan: PhasedLessonPlan;

      if (lesson.type === "checkpoint") {
        const unitWords = (unitLessons[lesson.unit] ?? []).flatMap(id => lessonWords[id] ?? []);
        if (unitWords.length === 0) return;

        for (const w of unitWords) {
          if (!masteryMap.current[w.word]) masteryMap.current[w.word] = defaultWordStats();
        }

        isUnitTest.current = true;
        plan = generatePhasedUnitTestSlots(unitWords, masteryMap.current);
      } else {
        const words = lessonWords[lesson.id];
        if (!words) return;

        for (const w of words) {
          if (!masteryMap.current[w.word]) masteryMap.current[w.word] = defaultWordStats();
        }

        isUnitTest.current = false;
        isReviewSession.current = completedLessons.has(lessonIndex);
        plan = generatePhasedSlots(words, masteryMap.current);
      }

      setPhasedPlan(plan);
      setMotionSlotIndex(0);
      setMcqSlotIndex(0);
      setLessonPhase('motion');
      setActiveView("sublesson");
    },
    [completedLessons]
  );

  const handleSkipToTest = useCallback(
    (unitNumber: number) => {
      const checkpoint = lessons.find(l => l.unit === unitNumber && l.type === "checkpoint");
      if (!checkpoint) return;

      const unitWords = (unitLessons[unitNumber] ?? []).flatMap(id => lessonWords[id] ?? []);
      if (unitWords.length === 0) return;

      for (const w of unitWords) {
        if (!masteryMap.current[w.word]) masteryMap.current[w.word] = defaultWordStats();
      }

      setCurrentLesson(checkpoint);
      lessonStartTime.current = Date.now();
      motionApiResults.current = [];
      motionApiErrors.current = [];
      mcqResultsStore.current = [];
      setResolvedApiCount(0);
      setResultsData(null);

      isUnitTest.current = true;
      isSkipAttempt.current = true;

      const plan = generatePhasedUnitTestSlots(unitWords, masteryMap.current);
      setPhasedPlan(plan);
      setMotionSlotIndex(0);
      setMcqSlotIndex(0);
      setLessonPhase('motion');
      setActiveView("sublesson");
    },
    []
  );

  // ── Phase callbacks ───────────────────────────────────────────────────────
  const handleMotionRecordingSubmitted = useCallback(
    (slotIndex: number, blob: Blob, wordPhrase: string) => {
      // Fire API call in background
      const promise = submitRecording(wordPhrase, blob);
      promise
        .then(result => {
          motionApiResults.current[slotIndex] = result;
          setResolvedApiCount(prev => prev + 1);
        })
        .catch(err => {
          motionApiErrors.current[slotIndex] = err instanceof Error ? err.message : 'Evaluation failed';
          setResolvedApiCount(prev => prev + 1);
        });
    },
    []
  );

  const handleMotionComplete = useCallback(() => {
    if (!phasedPlan) return;
    const nextIndex = motionSlotIndex + 1;
    if (nextIndex < phasedPlan.motionSlots.length) {
      setMotionSlotIndex(nextIndex);
    } else {
      // Transition to MCQ phase (or analyzing if no MCQs)
      if (phasedPlan.mcqSlots.length > 0) {
        setMcqSlotIndex(0);
        setLessonPhase('mcq');
      } else {
        setLessonPhase('analyzing');
      }
    }
  }, [phasedPlan, motionSlotIndex]);

  const handleMcqComplete = useCallback(
    (wasCorrect: boolean, selectedAnswer: string) => {
      if (!phasedPlan) return;
      const slot = phasedPlan.mcqSlots[mcqSlotIndex];

      mcqResultsStore.current.push({
        word: slot.word,
        selectedAnswer,
        correctAnswer: slot.correctAnswer,
        wasCorrect,
      });

      const nextIndex = mcqSlotIndex + 1;
      if (nextIndex < phasedPlan.mcqSlots.length) {
        setMcqSlotIndex(nextIndex);
      } else {
        // All MCQs done — check if API calls are still pending
        const totalMotion = phasedPlan.motionSlots.length;
        if (resolvedApiCount >= totalMotion) {
          buildAndShowResults();
        } else {
          setLessonPhase('analyzing');
        }
      }
    },
    [phasedPlan, mcqSlotIndex, resolvedApiCount, buildAndShowResults]
  );

  const handleBack = useCallback(() => {
    resetSessionState();
    setCurrentLesson(null);
  }, [resetSessionState]);

  const getLessonStatus = (lessonIndex: number): "locked" | "unlocked" | "completed" => {
    if (completedLessons.has(lessonIndex)) return "completed";
    if (lessonIndex === 0) return "unlocked";
    const previousCompleted = completedLessons.has(lessonIndex - 1);
    return previousCompleted ? "unlocked" : "locked";
  };

  // Build enriched lessons with status for the path component
  const pathLessons: PathLesson[] = useMemo(() => {
    let firstUnlockedIndex = -1;
    for (let i = 0; i < lessons.length; i++) {
      if (!completedLessons.has(i)) {
        if (i === 0 || completedLessons.has(i - 1)) {
          firstUnlockedIndex = i;
          break;
        }
      }
    }

    return lessons.map((lesson, index) => {
      let status: LessonStatus;
      if (completedLessons.has(index)) {
        status = "completed";
      } else if (index === firstUnlockedIndex) {
        status = "current";
      } else if (index === 0 || completedLessons.has(index - 1)) {
        status = "available";
      } else {
        status = "locked";
      }

      return {
        ...lesson,
        status,
      };
    });
  }, [completedLessons]);

  // Handle click from the LearningPath component (receives lesson id, need to convert to index)
  const handlePathLessonClick = useCallback(
    (lessonId: number) => {
      const index = lessonIdToIndex.get(lessonId);
      if (index !== undefined) {
        handleLessonClick(index);
      }
    },
    [handleLessonClick]
  );

  const unitNames = ["Greetings & Basics", "Family", "Daily Life", "Out & About"];
  const unitName = unitNames[(currentLesson?.unit ?? 1) - 1] ?? "ASL";

  // ── Render active phased lesson ───────────────────────────────────────────
  if (activeView === "sublesson" && phasedPlan) {
    const totalQuestions = phasedPlan.motionSlots.length + phasedPlan.mcqSlots.length;
    const completedQuestions =
      lessonPhase === 'motion' ? motionSlotIndex :
      lessonPhase === 'mcq' ? phasedPlan.motionSlots.length + mcqSlotIndex :
      totalQuestions;

    // Progress bar wrapper for motion and MCQ phases
    const ProgressHeader = () => (
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400 font-medium">
              {currentLesson?.title} - {currentLesson?.description}
            </span>
            <span className="text-sm text-slate-400 font-medium">
              Question {Math.min(completedQuestions + 1, totalQuestions)} of {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedQuestions / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );

    // Phase 1: Motion recording
    if (lessonPhase === 'motion') {
      const slot = phasedPlan.motionSlots[motionSlotIndex];
      const slotKey = `motion-${motionSlotIndex}-${slot.type}-${slot.word}`;

      if (slot.type === 'ss1') {
        return (
          <div>
            <ProgressHeader />
            <SublessonScreen
              key={slotKey}
              wordPhrase={slot.word}
              videoPath={slot.videoPath}
              unitName={unitName}
              fireAndForget
              onRecordingSubmitted={(blob) => handleMotionRecordingSubmitted(motionSlotIndex, blob, slot.word)}
              onComplete={() => handleMotionComplete()}
              onBack={handleBack}
            />
          </div>
        );
      }
      if (slot.type === 'ss3') {
        return (
          <div>
            <ProgressHeader />
            <SublessonScreen3
              key={slotKey}
              wordPhrase={slot.word}
              unitName={unitName}
              fireAndForget
              onRecordingSubmitted={(blob) => handleMotionRecordingSubmitted(motionSlotIndex, blob, slot.word)}
              onComplete={() => handleMotionComplete()}
              onBack={handleBack}
            />
          </div>
        );
      }
    }

    // Phase 2: MCQ
    if (lessonPhase === 'mcq') {
      const slot = phasedPlan.mcqSlots[mcqSlotIndex];
      const slotKey = `mcq-${mcqSlotIndex}-${slot.word}`;

      return (
        <div>
          <ProgressHeader />
          <McqWrapper
            key={slotKey}
            slot={slot}
            unitName={unitName}
            onComplete={handleMcqComplete}
            onBack={handleBack}
          />
        </div>
      );
    }

    // Phase 3: Analyzing
    if (lessonPhase === 'analyzing') {
      return (
        <AnalyzingScreen
          totalQuestions={phasedPlan.motionSlots.length}
          resolvedCount={resolvedApiCount}
        />
      );
    }

    // Phase 4: Results
    if (lessonPhase === 'results' && resultsData) {
      return (
        <ResultsPage
          questions={resultsData.questions}
          totalCorrect={resultsData.totalCorrect}
          totalQuestions={resultsData.totalQuestions}
          passed={resultsData.passed}
          xpEarned={resultsData.xpEarned}
          lessonTitle={`${currentLesson?.title ?? 'Lesson'} - ${currentLesson?.description ?? ''}`}
          duration={Math.round((Date.now() - lessonStartTime.current) / 1000)}
          onContinue={handleResultsContinue}
          onRetry={handleResultsRetry}
        />
      );
    }
  }

  // ── Otherwise, show the main lesson path ──────────────────────────────────
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
            xpEarned={isReviewModal ? 0 : (currentLesson.xp)}
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

        {failReason !== null && (
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
              <p className="text-slate-400 mb-6">
                {failReason === 'lesson'
                  ? 'You need to pass at least 5 out of 6 sublessons to complete this lesson. Give it another try!'
                  : failReason === 'unit-test'
                  ? 'You need to pass at least 10 out of 12 questions to pass the unit test. Keep practicing and try again!'
                  : 'Work through the lessons to build up your skills, then try the unit test again.'}
              </p>
              <button
                onClick={() => {
                  setFailReason(null);
                  setCurrentLesson(null);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 text-lg font-bold rounded-xl shadow-lg transition"
              >
                Keep Practicing
              </button>
            </motion.div>
          </div>
        )}

        <div className="flex-1 overflow-x-hidden overflow-y-auto scroll-container relative" style={{ background: '#05050f' }}>
          {/* Full-width space background */}
          <div className="absolute inset-0 pointer-events-none" style={{ height: '5800px' }}>
            {/* Deep space gradient */}
            <div className="absolute inset-0 h-full" style={{
              background: 'linear-gradient(180deg, #0a0a1a 0%, #0d0820 20%, #05050f 40%, #0a0618 60%, #0d0820 80%, #05050f 100%)',
            }} />

            {/* Pixelated star field */}
            <svg className="absolute inset-0 w-full pointer-events-none pixelated" style={{ height: '5800px', imageRendering: 'pixelated' }} preserveAspectRatio="none" viewBox="0 0 1000 5800">
              {/* Tiny dim stars */}
              {Array.from({ length: 200 }, (_, i) => {
                const x = ((i * 137 + 29) % 980) + 10;
                const y = ((i * 251 + 73) % 5400) + 50;
                const size = (i % 3 === 0) ? 2 : 1;
                const opacity = 0.2 + (i % 5) * 0.08;
                return <rect key={`s1-${i}`} x={x} y={y} width={size} height={size} fill="white" opacity={opacity} />;
              })}
              {/* Medium bright stars */}
              {Array.from({ length: 100 }, (_, i) => {
                const x = ((i * 193 + 47) % 960) + 20;
                const y = ((i * 317 + 113) % 5300) + 100;
                const opacity = 0.4 + (i % 4) * 0.1;
                return <rect key={`s2-${i}`} x={x} y={y} width={2} height={2} fill="white" opacity={opacity} />;
              })}
              {/* Bright stars with cross glow */}
              {Array.from({ length: 40 }, (_, i) => {
                const x = ((i * 277 + 83) % 940) + 30;
                const y = ((i * 439 + 157) % 5200) + 150;
                const colors = ['#ffffff', '#a5b4fc', '#c4b5fd', '#93c5fd', '#fde68a'];
                const color = colors[i % colors.length];
                return (
                  <g key={`s3-${i}`}>
                    <rect x={x} y={y} width={2} height={2} fill={color} opacity="0.9" />
                    <rect x={x - 2} y={y} width={1} height={2} fill={color} opacity="0.3" />
                    <rect x={x + 2} y={y} width={1} height={2} fill={color} opacity="0.3" />
                    <rect x={x} y={y - 2} width={2} height={1} fill={color} opacity="0.3" />
                    <rect x={x} y={y + 2} width={2} height={1} fill={color} opacity="0.3" />
                  </g>
                );
              })}
            </svg>

            {/* Pixel planet - top right */}
            <svg className="absolute top-16 right-16 pointer-events-none pixelated" width="48" height="48" style={{ imageRendering: 'pixelated' }}>
              <rect x="16" y="4" width="16" height="4" fill="#6366f1" />
              <rect x="8" y="8" width="32" height="4" fill="#818cf8" />
              <rect x="4" y="12" width="40" height="8" fill="#6366f1" />
              <rect x="4" y="20" width="40" height="8" fill="#4f46e5" />
              <rect x="8" y="28" width="32" height="4" fill="#4338ca" />
              <rect x="4" y="32" width="40" height="4" fill="#3730a3" />
              <rect x="8" y="36" width="32" height="4" fill="#4338ca" />
              <rect x="16" y="40" width="16" height="4" fill="#3730a3" />
              <rect x="0" y="22" width="4" height="2" fill="#a5b4fc" opacity="0.6" />
              <rect x="44" y="22" width="4" height="2" fill="#a5b4fc" opacity="0.6" />
              <rect x="0" y="24" width="8" height="2" fill="#818cf8" opacity="0.4" />
              <rect x="40" y="24" width="8" height="2" fill="#818cf8" opacity="0.4" />
              <rect x="12" y="12" width="8" height="4" fill="#a5b4fc" opacity="0.3" />
            </svg>

            {/* Small pixel moon - top left */}
            <svg className="absolute top-[100px] left-12 pointer-events-none pixelated" width="28" height="28" style={{ imageRendering: 'pixelated' }}>
              <rect x="8" y="0" width="12" height="4" fill="#e2e8f0" />
              <rect x="4" y="4" width="20" height="4" fill="#cbd5e1" />
              <rect x="4" y="8" width="20" height="4" fill="#e2e8f0" />
              <rect x="4" y="12" width="20" height="4" fill="#94a3b8" />
              <rect x="4" y="16" width="20" height="4" fill="#cbd5e1" />
              <rect x="8" y="20" width="12" height="4" fill="#94a3b8" />
              <rect x="8" y="8" width="4" height="4" fill="#94a3b8" opacity="0.5" />
              <rect x="16" y="14" width="3" height="3" fill="#94a3b8" opacity="0.4" />
            </svg>

            {/* Distant pixel galaxy */}
            <svg className="absolute top-[300px] right-[15%] pointer-events-none pixelated opacity-40" width="40" height="20" style={{ imageRendering: 'pixelated' }}>
              <rect x="16" y="8" width="8" height="4" fill="#c4b5fd" />
              <rect x="8" y="8" width="8" height="2" fill="#a78bfa" />
              <rect x="24" y="10" width="8" height="2" fill="#a78bfa" />
              <rect x="4" y="10" width="4" height="2" fill="#7c3aed" opacity="0.5" />
              <rect x="32" y="8" width="4" height="2" fill="#7c3aed" opacity="0.5" />
            </svg>

            {/* Extra decorations for wider area */}
            <svg className="absolute top-[600px] left-[8%] pointer-events-none pixelated opacity-30" width="32" height="32" style={{ imageRendering: 'pixelated' }}>
              <rect x="12" y="0" width="8" height="4" fill="#f0abfc" />
              <rect x="8" y="4" width="16" height="4" fill="#d946ef" />
              <rect x="4" y="8" width="24" height="8" fill="#c026d3" />
              <rect x="8" y="16" width="16" height="4" fill="#a21caf" />
              <rect x="12" y="20" width="8" height="4" fill="#86198f" />
            </svg>

            <svg className="absolute top-[1200px] right-[10%] pointer-events-none pixelated opacity-25" width="36" height="36" style={{ imageRendering: 'pixelated' }}>
              <rect x="14" y="2" width="8" height="4" fill="#67e8f9" />
              <rect x="6" y="6" width="24" height="4" fill="#22d3ee" />
              <rect x="2" y="10" width="32" height="8" fill="#06b6d4" />
              <rect x="6" y="18" width="24" height="4" fill="#0891b2" />
              <rect x="14" y="22" width="8" height="4" fill="#0e7490" />
              <rect x="0" y="16" width="4" height="2" fill="#67e8f9" opacity="0.5" />
              <rect x="32" y="16" width="4" height="2" fill="#67e8f9" opacity="0.5" />
            </svg>

            <svg className="absolute top-[2400px] left-[5%] pointer-events-none pixelated opacity-20" width="24" height="24" style={{ imageRendering: 'pixelated' }}>
              <rect x="8" y="0" width="8" height="4" fill="#fde68a" />
              <rect x="4" y="4" width="16" height="4" fill="#fbbf24" />
              <rect x="4" y="8" width="16" height="8" fill="#f59e0b" />
              <rect x="8" y="16" width="8" height="4" fill="#d97706" />
            </svg>

            <svg className="absolute top-[3600px] right-[8%] pointer-events-none pixelated opacity-30" width="28" height="28" style={{ imageRendering: 'pixelated' }}>
              <rect x="10" y="0" width="8" height="4" fill="#a5b4fc" />
              <rect x="6" y="4" width="16" height="4" fill="#818cf8" />
              <rect x="2" y="8" width="24" height="8" fill="#6366f1" />
              <rect x="6" y="16" width="16" height="4" fill="#4f46e5" />
              <rect x="10" y="20" width="8" height="4" fill="#4338ca" />
            </svg>
          </div>

          {/* Centered path content */}
          <div className="relative min-h-[5800px] mx-auto" style={{ width: 'min(720px, 100vw)', maxWidth: '720px' }}>
            <LearningPath lessons={pathLessons} onLessonClick={handlePathLessonClick} onSkipToTest={handleSkipToTest} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper for MCQ that captures the selected answer before calling onComplete.
 * The original SublessonScreen2 only passes wasCorrect — we need the actual answer.
 */
function McqWrapper({
  slot,
  unitName,
  onComplete,
  onBack,
}: {
  slot: LessonSlot;
  unitName: string;
  onComplete: (wasCorrect: boolean, selectedAnswer: string) => void;
  onBack: () => void;
}) {
  const selectedAnswerRef = useRef<string>('');

  return (
    <div
      onClick={(e) => {
        // Capture the clicked answer text from button elements
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (button) {
          const span = button.querySelector('span');
          if (span) selectedAnswerRef.current = span.textContent ?? '';
        }
      }}
    >
      <SublessonScreen2
        wordPhrase={slot.word}
        videoPath={slot.videoPath}
        correctAnswer={slot.correctAnswer}
        wrongAnswers={slot.wrongAnswers}
        unitName={unitName}
        onComplete={(wasCorrect) => {
          onComplete(wasCorrect, selectedAnswerRef.current);
        }}
        onBack={onBack}
      />
    </div>
  );
}
