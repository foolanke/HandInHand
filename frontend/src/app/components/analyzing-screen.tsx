import { Loader2 } from 'lucide-react';

interface AnalyzingScreenProps {
  totalQuestions: number;
  resolvedCount: number;
}

export default function AnalyzingScreen({ totalQuestions, resolvedCount }: AnalyzingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="bg-slate-900/50 rounded-3xl p-12 border-2 border-slate-700 shadow-2xl">
          <Loader2 className="w-20 h-20 text-purple-400 mx-auto mb-8 animate-spin" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Analyzing your signing...
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Our AI is reviewing your recordings
          </p>
          <div className="w-full bg-slate-800 rounded-full h-3 mb-4 border border-slate-700">
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalQuestions > 0 ? (resolvedCount / totalQuestions) * 100 : 0}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 font-medium">
            Processed {resolvedCount} of {totalQuestions} recordings
          </p>
        </div>
      </div>
    </div>
  );
}
