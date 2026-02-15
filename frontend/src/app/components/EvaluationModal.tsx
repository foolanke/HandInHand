import { CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

export interface EvaluationResult {
  overall_score_0_to_4: number;
  summary: string;
  pros: { points: string[] };
  cons: { points: string[] };
}

interface EvaluationModalProps {
  result: EvaluationResult;
  onContinue: () => void;
  onTryAgain: () => void;
  hideTryAgain?: boolean;
}

export default function EvaluationModal({ result, onContinue, onTryAgain, hideTryAgain = false }: EvaluationModalProps) {
  const score = result.overall_score_0_to_4;
  const passed = score >= 3;

  const scoreColor = passed ? 'text-green-400' : 'text-red-400';
  const scoreBg = passed
    ? 'from-green-900/60 to-green-800/40 border-green-600/50'
    : 'from-red-900/60 to-red-800/40 border-red-600/50';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Score header */}
        <div className={`bg-gradient-to-br ${scoreBg} border-b border-gray-700 rounded-t-2xl p-6 text-center`}>
          <div className={`text-5xl font-bold ${scoreColor} mb-1`}>{passed ? 'Pass' : 'Fail'}</div>
          <div className="text-gray-300 text-sm font-medium uppercase tracking-wider mb-3">Result</div>
          <p className="text-white text-base leading-relaxed">{result.summary}</p>
        </div>

        {/* Feedback columns */}
        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-700">
          {/* Successes */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="font-semibold text-green-400 text-sm">Successes</span>
            </div>
            {result.pros.points.length > 0 ? (
              <ul className="space-y-2">
                {result.pros.points.map((point, i) => (
                  <li key={i} className="text-gray-300 text-sm leading-snug flex gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">None noted</p>
            )}
          </div>

          {/* Improvements */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <span className="font-semibold text-orange-400 text-sm">Improvements</span>
            </div>
            {result.cons.points.length > 0 ? (
              <ul className="space-y-2">
                {result.cons.points.map((point, i) => (
                  <li key={i} className="text-gray-300 text-sm leading-snug flex gap-2">
                    <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">None noted</p>
            )}
          </div>
        </div>

        {/* XP notice */}
        <div className={`mx-5 mb-4 px-4 py-2 rounded-lg text-sm text-center ${passed ? 'bg-green-900/30 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
          {passed ? '✨ XP awarded for this attempt!' : 'No XP this time — keep practicing!'}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-5 pt-0">
          {!passed && !hideTryAgain && (
            <button
              onClick={onTryAgain}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-semibold transition"
            >
              <RotateCcw size={18} />
              Try Again
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
