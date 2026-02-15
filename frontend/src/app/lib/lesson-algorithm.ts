// ─── Types ───────────────────────────────────────────────────────────────────

export type SlotType = 'ss1' | 'ss2' | 'ss3';

export interface LessonWord {
  word: string;
  videoPath: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

export interface LessonSlot {
  type: SlotType;
  word: string;
  videoPath: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

export interface WordStats {
  introduced: boolean;
  recognitionCorrect: number;
  recognitionAttempts: number;
  lastMissedSlot: number;  // slot index of most recent wrong answer; -1 if none
  lastSeenSlot: number;    // slot index of last appearance; -1 if never
}

export type MasteryMap = Record<string, WordStats>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function defaultWordStats(): WordStats {
  return {
    introduced: false,
    recognitionCorrect: 0,
    recognitionAttempts: 0,
    lastMissedSlot: -1,
    lastSeenSlot: -1,
  };
}

/** Laplace-smoothed recognition rate — avoids divide-by-zero and prevents
 *  a single lucky answer from looking like mastery. */
function recognitionRate(stats: WordStats): number {
  return (stats.recognitionCorrect + 1) / (stats.recognitionAttempts + 2);
}

/** Return words sorted weakest-first.
 *  Tie-break 1: most recently missed (higher lastMissedSlot = more recent).
 *  Tie-break 2: least recently seen (lower lastSeenSlot). */
function sortByWeakest(words: LessonWord[], masteryMap: MasteryMap): LessonWord[] {
  return [...words].sort((a, b) => {
    const rA = recognitionRate(masteryMap[a.word] ?? defaultWordStats());
    const rB = recognitionRate(masteryMap[b.word] ?? defaultWordStats());
    if (rA !== rB) return rA - rB;  // lower rate = weaker

    const mA = masteryMap[a.word]?.lastMissedSlot ?? -1;
    const mB = masteryMap[b.word]?.lastMissedSlot ?? -1;
    if (mA !== mB) return mB - mA;  // more recent miss = weaker

    const sA = masteryMap[a.word]?.lastSeenSlot ?? -1;
    const sB = masteryMap[b.word]?.lastSeenSlot ?? -1;
    return sA - sB;  // less recently seen = weaker
  });
}

function makeSlot(type: SlotType, word: LessonWord): LessonSlot {
  return {
    type,
    word: word.word,
    videoPath: word.videoPath,
    correctAnswer: word.correctAnswer,
    wrongAnswers: word.wrongAnswers,
  };
}

// ─── Main Algorithm ───────────────────────────────────────────────────────────

/**
 * Pre-generate 6 lesson slots using the interleaved template.
 * No two consecutive slots share the same type.
 * Slots 3 and 5 may be overridden at runtime.
 *
 * Template (interleaved — no consecutive same types):
 *   Slot 0 – SS1(A)   introduce weakest
 *   Slot 1 – SS2(A)   recognize A  (SS1 prerequisite met)
 *   Slot 2 – SS1(B)   introduce other
 *   Slot 3 – SS2(B)   recognize B  ← runtime override after slot 1 result
 *   Slot 4 – SS3(weakest)  production
 *   Slot 5 – SS2(review)   remedial/review SS2  ← runtime override after slot 4
 */
export function generateSlots(words: LessonWord[], masteryMap: MasteryMap): LessonSlot[] {
  const [weak, other] = sortByWeakest(words, masteryMap);

  return [
    makeSlot('ss1', weak),   // 0
    makeSlot('ss2', weak),   // 1  — may be overridden
    makeSlot('ss1', other),  // 2
    makeSlot('ss2', other),  // 3  — may be overridden
    makeSlot('ss3', weak),   // 4
    makeSlot('ss2', other),  // 5  — review/remedial, may be overridden
  ];
}

// ─── Runtime Overrides ────────────────────────────────────────────────────────

interface SessionResult {
  word: string;
  slotIndex: number;
  wasCorrect: boolean;
}

/** Count how many times a word appears in the current slots array. */
function countAppearances(slots: LessonSlot[], word: string): number {
  return slots.filter(s => s.word === word).length;
}

/** Ensure a slot at index N doesn't share its type with the slot at N-1.
 *  If it would, try the other word first; if that still repeats type, flip
 *  the type (ss2 ↔ ss3, never touching ss1 prerequisites). */
function noConsecutiveType(
  slots: LessonSlot[],
  index: number,
  words: LessonWord[],
): LessonSlot[] {
  if (index === 0) return slots;
  const updated = [...slots];
  const prev = updated[index - 1];
  const curr = updated[index];
  if (prev.type !== curr.type) return slots;  // already fine

  // Try the other word with the same type
  const otherWord = words.find(w => w.word !== curr.word);
  if (otherWord && otherWord.word !== prev.word) {
    updated[index] = makeSlot(curr.type, otherWord);
    return updated;
  }

  // Flip type (ss2 ↔ ss3), keeping prerequisites valid
  if (curr.type === 'ss2') {
    updated[index] = makeSlot('ss3', words.find(w => w.word === curr.word)!);
  } else if (curr.type === 'ss3') {
    updated[index] = makeSlot('ss2', words.find(w => w.word === curr.word)!);
  }
  return updated;
}

/**
 * Called after slot 1 (index 1, first SS2) completes.
 * If wrong: override slot 3 (next SS2) to remediate that word.
 * Applies no-consecutive-type guard after any change.
 */
export function overrideSlot3(
  slots: LessonSlot[],
  words: LessonWord[],
  slot1Word: string,
  wasCorrect: boolean,
): LessonSlot[] {
  if (wasCorrect) return slots;

  const updated = [...slots];
  const appearances = countAppearances(slots, slot1Word);
  const wordData = words.find(w => w.word === slot1Word)!;

  if (appearances > 2) {
    updated[3] = makeSlot('ss1', wordData);
  } else {
    updated[3] = makeSlot('ss2', wordData);
  }

  // Ensure no consecutive type with slot 2
  return noConsecutiveType(updated, 3, words);
}

/**
 * Called after slot 4 (index 4, SS3) completes.
 * Decides slot 5 (review SS2) based on overall session results.
 * Applies no-consecutive-type guard after any change.
 */
export function overrideSlot5(
  slots: LessonSlot[],
  words: LessonWord[],
  sessionResults: SessionResult[],
  masteryMap: MasteryMap,
): LessonSlot[] {
  const updated = [...slots];

  // Count correct SS2 answers per word in this session
  const correctCountByWord: Record<string, number> = {};
  const missedWords = new Set<string>();
  for (const r of sessionResults) {
    const slot = slots[r.slotIndex];
    if (slot?.type === 'ss2') {
      if (r.wasCorrect) {
        correctCountByWord[r.word] = (correctCountByWord[r.word] ?? 0) + 1;
      } else {
        missedWords.add(r.word);
      }
    }
  }

  // Words that are still weak (not correctly answered twice in this session)
  const stillWeak = words.filter(w => (correctCountByWord[w.word] ?? 0) < 2);

  if (stillWeak.length > 0) {
    const [mostMissed] = sortByWeakest(stillWeak, masteryMap);
    const slot3WasRepeat = slots[3].word === mostMissed.word && slots[3].type === 'ss2';
    const appearances = countAppearances(slots, mostMissed.word);

    if (missedWords.has(mostMissed.word) && appearances <= 2) {
      updated[5] = makeSlot('ss2', mostMissed);
    } else if (slot3WasRepeat && appearances >= 3) {
      const otherWord = words.find(w => w.word !== mostMissed.word);
      if (otherWord) updated[5] = makeSlot('ss2', otherWord);
    }
  }
  // else both words strong — keep default ss2(other) at slot 5

  // Ensure no consecutive type with slot 4 (which is always ss3)
  return noConsecutiveType(updated, 5, words);
}

// ─── Unit Test Algorithm ──────────────────────────────────────────────────────

/**
 * Generate 10 slots for a Unit Test.
 * Pool = all words from the unit's lessons (no prerequisites needed).
 *
 * Type mix (no consecutive same types, last 2 are ss3):
 *   ss2, ss3, ss1, ss2, ss3, ss2, ss3, ss1, ss2, ss3
 *   → 2×ss1, 4×ss2, 4×ss3
 *
 * Word distribution:
 *   Weaker words (lowest recognition rate) appear up to 2× first.
 *   Pool is filled weakest-first until 10 slots are covered.
 *   No back-to-back same word.
 */
export function generateUnitTestSlots(
  unitWords: LessonWord[],
  masteryMap: MasteryMap,
): LessonSlot[] {
  const TOTAL = 12;
  const typeSequence: SlotType[] = [
    'ss2', 'ss3', 'ss1', 'ss2', 'ss3',
    'ss2', 'ss3', 'ss1', 'ss2', 'ss3',
    'ss2', 'ss3',
  ];

  const ranked = sortByWeakest(unitWords, masteryMap);
  const maxPerWord = Math.max(2, Math.ceil(TOTAL / ranked.length));

  // Build pool: fill weakest-first, each word up to maxPerWord times
  const pool: LessonWord[] = [];
  const appearances: Record<string, number> = {};
  while (pool.length < TOTAL) {
    let added = false;
    for (const w of ranked) {
      if (pool.length >= TOTAL) break;
      if ((appearances[w.word] ?? 0) < maxPerWord) {
        pool.push(w);
        appearances[w.word] = (appearances[w.word] ?? 0) + 1;
        added = true;
      }
    }
    if (!added) break; // all words at cap (safety)
  }

  // Pair pool words with type sequence, enforcing no-back-to-back word
  const slots: LessonSlot[] = [];
  const available = [...pool];

  for (let i = 0; i < typeSequence.length && available.length > 0; i++) {
    const type = typeSequence[i];
    const prevWord = slots[i - 1]?.word ?? null;

    // Pick first available word that isn't back-to-back with previous
    const idx = available.findIndex(w => w.word !== prevWord);
    const pick = idx >= 0 ? available.splice(idx, 1)[0] : available.splice(0, 1)[0];
    slots.push(makeSlot(type, pick));
  }

  return slots;
}

/**
 * Called during a unit test when an SS2 slot is answered wrong.
 * Schedules a remediation slot for the missed word 2 positions ahead
 * (gives one slot of breathing room before the retry).
 * Avoids consecutive type with the preceding slot.
 */
export function overrideUnitTestAfterMiss(
  slots: LessonSlot[],
  currentIndex: number,
  missedWord: string,
  words: LessonWord[],
): LessonSlot[] {
  const remediateAt = currentIndex + 2;
  if (remediateAt >= slots.length) return slots;

  const wordData = words.find(w => w.word === missedWord);
  if (!wordData) return slots;

  const updated = [...slots];
  const prevType = updated[remediateAt - 1]?.type;
  // Prefer ss2 retry; if that would be consecutive with previous, use ss1 refresher
  const remedialType: SlotType = prevType === 'ss2' ? 'ss1' : 'ss2';
  updated[remediateAt] = makeSlot(remedialType, wordData);
  return updated;
}

// ─── Phased Lesson Plan ──────────────────────────────────────────────────────

export interface PhasedLessonPlan {
  motionSlots: LessonSlot[];
  mcqSlots: LessonSlot[];
}

/**
 * Generate a phased lesson plan: all motion slots (SS1/SS3) first, then MCQ (SS2).
 * Motion: SS1(weak), SS1(other), SS3(weak) — 3 slots
 * MCQ:    SS2(weak), SS2(other), SS2(other) — 3 slots
 */
export function generatePhasedSlots(
  words: LessonWord[],
  masteryMap: MasteryMap,
): PhasedLessonPlan {
  const [weak, other] = sortByWeakest(words, masteryMap);

  return {
    motionSlots: [
      makeSlot('ss1', weak),
      makeSlot('ss1', other),
      makeSlot('ss3', weak),
    ],
    mcqSlots: [
      makeSlot('ss2', weak),
      makeSlot('ss2', other),
      makeSlot('ss2', other),
    ],
  };
}

/**
 * Generate a phased unit test plan: group motion and MCQ slots separately.
 * Uses the same word-ranking logic as generateUnitTestSlots.
 */
export function generatePhasedUnitTestSlots(
  unitWords: LessonWord[],
  masteryMap: MasteryMap,
): PhasedLessonPlan {
  const ranked = sortByWeakest(unitWords, masteryMap);

  // Motion slots: 2×SS1 + 4×SS3 = 6 motion slots
  const motionTypes: SlotType[] = ['ss1', 'ss3', 'ss3', 'ss1', 'ss3', 'ss3'];
  // MCQ slots: 6×SS2
  const mcqCount = 6;
  const TOTAL = motionTypes.length + mcqCount;

  const maxPerWord = Math.max(2, Math.ceil(TOTAL / ranked.length));

  // Build pool weakest-first
  const pool: LessonWord[] = [];
  const appearances: Record<string, number> = {};
  while (pool.length < TOTAL) {
    let added = false;
    for (const w of ranked) {
      if (pool.length >= TOTAL) break;
      if ((appearances[w.word] ?? 0) < maxPerWord) {
        pool.push(w);
        appearances[w.word] = (appearances[w.word] ?? 0) + 1;
        added = true;
      }
    }
    if (!added) break;
  }

  // Split pool: first half for motion, second for MCQ
  const motionPool = pool.slice(0, motionTypes.length);
  const mcqPool = pool.slice(motionTypes.length);

  const motionSlots: LessonSlot[] = motionTypes.map((type, i) =>
    makeSlot(type, motionPool[i])
  );
  const mcqSlots: LessonSlot[] = mcqPool.map(w => makeSlot('ss2', w));

  return { motionSlots, mcqSlots };
}

/**
 * Update masteryMap for a completed slot.
 * SS1: marks introduced, updates lastSeenSlot only.
 * SS2: records wasCorrect result.
 * SS3: updates lastSeenSlot only (no auto-grader).
 */
export function updateMastery(
  masteryMap: MasteryMap,
  slot: LessonSlot,
  slotIndex: number,
  wasCorrect?: boolean,
): MasteryMap {
  const prev = masteryMap[slot.word] ?? defaultWordStats();
  const updated: WordStats = { ...prev, lastSeenSlot: slotIndex };

  if (slot.type === 'ss1') {
    updated.introduced = true;
  } else if (slot.type === 'ss2') {
    updated.recognitionAttempts += 1;
    if (wasCorrect) {
      updated.recognitionCorrect += 1;
    } else {
      updated.lastMissedSlot = slotIndex;
    }
  }
  // ss3: only lastSeenSlot updated (already done above)

  return { ...masteryMap, [slot.word]: updated };
}
