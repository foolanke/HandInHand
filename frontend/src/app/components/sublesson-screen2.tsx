import { useState, useRef } from 'react';
import { ArrowLeft, CheckCircle, X } from 'lucide-react';

interface MultipleChoiceQuizProps {
  unitName: string;
  wordPhrase: string;
  videoPath: string;
  correctAnswer: string;
  wrongAnswers: string[];
  onComplete: (wasCorrect: boolean) => void;
  onBack: () => void;
}

export default function MultipleChoiceQuiz({
  wordPhrase,
  videoPath,
  correctAnswer,
  wrongAnswers,
  unitName,
  onComplete,
  onBack
}: MultipleChoiceQuizProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Shuffle answers
  const [options] = useState(() => {
    const allOptions = [correctAnswer, ...wrongAnswers];
    return allOptions.sort(() => Math.random() - 0.5);
  });

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAnswerClick = (answer: string) => {
    if (hasAnswered) return;

    setSelectedAnswer(answer);
    const correct = answer === correctAnswer;
    setIsCorrect(correct);
    setHasAnswered(true);

    if (correct) {
      setTimeout(() => {
        onComplete(true);
      }, 1500);
    } else {
      // Single attempt — show correct answer and move on
      setTimeout(() => {
        onComplete(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={24} />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">{unitName}</h1>
        <div className="w-20"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        {/* Title */}
        <div className="text-center mb-12 mt-8">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-4">What sign is this?</h2>
          <p className="text-xl text-slate-200">Watch the video and select the correct answer</p>
        </div>

        {/* Video Section */}
        <div className="mb-10">
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-2xl max-w-2xl mx-auto ring-2 ring-purple-500/20 border-2 border-slate-800">
            <video
              ref={videoRef}
              src={videoPath}
              controls
              className="w-full aspect-video object-cover bg-black"
              preload="auto"
              playsInline
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={() => console.log('Video loaded')}
              onError={(e) => console.error('Video error:', e)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-4 max-w-2xl mx-auto">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const showCorrect = hasAnswered && option === correctAnswer && !isCorrect;
            const showWrong = hasAnswered && isSelected && !isCorrect;

            let buttonClass = "w-full px-8 py-5 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-between ";

            if (showCorrect) {
              buttonClass += "bg-gradient-to-r from-green-600 to-green-700 text-white border-2 border-green-400";
            } else if (showWrong) {
              buttonClass += "bg-gradient-to-r from-red-600 to-red-700 text-white border-2 border-red-400";
            } else if (isSelected) {
              buttonClass += "bg-gradient-to-r from-purple-600 to-purple-700 text-white border-2 border-purple-400";
            } else {
              buttonClass += "bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border-2 border-slate-700 hover:border-slate-600";
            }

            if (hasAnswered) {
              buttonClass += " cursor-default";
            } else {
              buttonClass += " cursor-pointer hover:scale-102";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerClick(option)}
                className={buttonClass}
                disabled={hasAnswered}
              >
                <span>{option}</span>
                {showCorrect && <CheckCircle className="w-7 h-7" />}
                {showWrong && <X className="w-7 h-7" />}
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {hasAnswered && (
          <div className="mt-10 max-w-2xl mx-auto">
            {isCorrect ? (
              <div className="bg-green-900/50 border-2 border-green-600 rounded-2xl p-8 text-center shadow-2xl">
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-green-300 mb-3">Correct!</h3>
                <p className="text-xl text-slate-200">Great job! Moving on...</p>
              </div>
            ) : (
              <div className="bg-red-900/50 border-2 border-red-600 rounded-2xl p-8 text-center shadow-2xl">
                <X className="w-20 h-20 text-red-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-red-300 mb-3">Not quite!</h3>
                <p className="text-xl text-slate-200">The correct answer is "{correctAnswer}"</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-2 border-slate-700 shadow-lg">
            <h4 className="font-bold text-xl mb-3 text-white flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Tip:
            </h4>
            <p className="text-slate-200 text-base font-medium">You only get one chance — watch carefully before selecting your answer!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
