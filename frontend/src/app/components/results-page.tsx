import { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Video, MessageSquare, Trophy, RotateCcw, ArrowRight } from 'lucide-react';
import type { EvaluationResult } from './EvaluationModal';

export interface QuestionResult {
  index: number;
  type: 'motion' | 'mcq';
  word: string;
  passed: boolean;
  videoPath?: string;
  // Motion-specific
  evalResult?: EvaluationResult | null;
  evalError?: string | null;
  // MCQ-specific
  selectedAnswer?: string;
  correctAnswer?: string;
}

interface ResultsPageProps {
  questions: QuestionResult[];
  totalCorrect: number;
  totalQuestions: number;
  passed: boolean;
  xpEarned: number;
  lessonTitle: string;
  duration: number;
  onContinue: () => void;
  onRetry: () => void;
}

function MotionDetail({ result }: { result: QuestionResult }) {
  const [expanded, setExpanded] = useState(false);
  const evalResult = result.evalResult;

  if (result.evalError) {
    return (
      <div className="mt-3 bg-red-900/30 rounded-xl p-4 border border-red-700/50">
        <p className="text-red-300 text-sm">Evaluation failed: {result.evalError}</p>
      </div>
    );
  }

  if (!evalResult) return null;

  const score = evalResult.overall_score_0_to_4;
  const scorePassed = score >= 3;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
      >
        <span className={`font-bold ${scorePassed ? 'text-green-400' : 'text-red-400'}`}>
          Score: {score}/4
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">{evalResult.summary}</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="mt-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3">
          {evalResult.pros.points.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-semibold">Successes</span>
              </div>
              <ul className="space-y-1">
                {evalResult.pros.points.map((point, i) => (
                  <li key={i} className="text-slate-300 text-sm flex gap-2">
                    <span className="text-green-500">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {evalResult.cons.points.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 text-sm font-semibold">Improvements</span>
              </div>
              <ul className="space-y-1">
                {evalResult.cons.points.map((point, i) => (
                  <li key={i} className="text-slate-300 text-sm flex gap-2">
                    <span className="text-orange-500">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage({
  questions,
  totalCorrect,
  totalQuestions,
  passed,
  xpEarned,
  lessonTitle,
  duration,
  onContinue,
  onRetry,
}: ResultsPageProps) {
  const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          {passed ? (
            <>
              <div className="text-7xl mb-4">
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
                Lesson Complete!
              </h1>
              <p className="text-xl text-slate-300">{lessonTitle}</p>
            </>
          ) : (
            <>
              <div className="text-7xl mb-4">
                <RotateCcw className="w-20 h-20 text-slate-400 mx-auto" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
                Keep Practicing!
              </h1>
              <p className="text-xl text-slate-300">{lessonTitle}</p>
            </>
          )}
        </div>

        {/* Score Ring */}
        <div className="flex justify-center mb-10">
          <div className={`relative w-36 h-36 rounded-full border-4 ${passed ? 'border-green-500' : 'border-red-500'} flex items-center justify-center bg-slate-900/50`}>
            <div className="text-center">
              <div className={`text-4xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>{percentage}%</div>
              <div className="text-sm text-slate-400">{totalCorrect}/{totalQuestions} correct</div>
            </div>
          </div>
        </div>

        {/* XP + Duration */}
        <div className="flex justify-center gap-6 mb-10">
          {xpEarned > 0 && (
            <div className="bg-green-900/30 border border-green-700/50 rounded-xl px-5 py-3 text-center">
              <div className="text-2xl font-bold text-green-400">+{xpEarned} XP</div>
            </div>
          )}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-3 text-center">
            <div className="text-lg font-medium text-slate-300">{minutes}m {seconds}s</div>
            <div className="text-xs text-slate-500">Duration</div>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-4 mb-10">
          <h3 className="text-xl font-bold text-white mb-4">Question Breakdown</h3>
          {questions.map((q) => (
            <div
              key={q.index}
              className={`bg-slate-900/50 rounded-2xl p-5 border-2 ${
                q.passed ? 'border-green-700/30' : 'border-red-700/30'
              } shadow-lg`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-800 text-slate-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border border-slate-700">
                    {q.index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {q.type === 'motion' ? (
                        <span className="bg-purple-900/50 text-purple-300 text-xs font-bold px-2 py-1 rounded-lg border border-purple-700/50 flex items-center gap-1">
                          <Video size={12} /> Recording
                        </span>
                      ) : (
                        <span className="bg-blue-900/50 text-blue-300 text-xs font-bold px-2 py-1 rounded-lg border border-blue-700/50 flex items-center gap-1">
                          <MessageSquare size={12} /> Multiple Choice
                        </span>
                      )}
                    </div>
                    <p className="text-white font-semibold text-lg">"{q.word}"</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {q.passed ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400" />
                  )}
                </div>
              </div>

              {/* Reference video */}
              {q.videoPath && (
                <div className="mt-3">
                  <video
                    src={q.videoPath}
                    controls
                    className="w-full max-w-sm rounded-xl border-2 border-slate-700 bg-black"
                    preload="metadata"
                    playsInline
                  />
                </div>
              )}

              {/* MCQ detail */}
              {q.type === 'mcq' && !q.passed && q.selectedAnswer && (
                <div className="mt-3 text-sm space-y-1">
                  <p className="text-red-300">Your answer: <span className="font-medium">{q.selectedAnswer}</span></p>
                  <p className="text-green-300">Correct answer: <span className="font-medium">{q.correctAnswer}</span></p>
                </div>
              )}

              {/* Motion detail */}
              {q.type === 'motion' && <MotionDetail result={q} />}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!passed && (
            <button
              onClick={onRetry}
              className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-5 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2 border-2 border-slate-600"
            >
              <RotateCcw size={22} /> Try Again
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-8 py-5 rounded-xl font-bold text-lg transition shadow-2xl flex items-center justify-center gap-2 border-2 border-purple-400 transform hover:scale-105"
          >
            Continue <ArrowRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
