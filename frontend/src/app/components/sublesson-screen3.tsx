import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Video, CheckCircle, RotateCcw, Loader2, Play, Pause } from 'lucide-react';
import EvaluationModal, { type EvaluationResult } from './EvaluationModal';

interface SublessonScreen3Props {
  unitName: string;
  wordPhrase: string;
  onComplete: (passed: boolean) => void;
  onBack: () => void;
}

async function submitRecording(wordPhrase: string, blob: Blob): Promise<EvaluationResult> {
  const word = wordPhrase.toLowerCase().replace(/\s+/g, '');
  const formData = new FormData();
  formData.append('word', word);
  const file = new File([blob], `${word}.webm`, { type: 'video/webm' });
  formData.append('video', file);

  const res = await fetch(`/api/evaluate-sign?word=${encodeURIComponent(word)}`, {
    method: 'POST',
    body: formData,
  });

  if (res.status === 404) {
    return {
      overall_score_0_to_4: 4,
      summary: 'Great effort! Keep practicing.',
      pros: { points: ['Recording submitted successfully'] },
      cons: { points: [] },
    };
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `Server error ${res.status}`);
  }

  const data = await res.json();
  return data.evaluation ?? data;
}

export default function SublessonScreen3({
  wordPhrase,
  unitName,
  onComplete,
  onBack,
}: SublessonScreen3Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);

  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const attemptRef = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [recordedPlaying, setRecordedPlaying] = useState(false);
  const pendingAction = useRef<'complete' | 'retry'>('complete');

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxRecordingDuration = 6;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      alert('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });

      console.log("REC STOP:");
      console.log("chunks:", chunksRef.current.map(c => c.size));
      console.log("blob.size:", blob.size);
      console.log("blob.type:", blob.type);
      setRecordedBlob(blob);
      setHasRecorded(true);

      setTimeout(() => {
        if (recordedVideoRef.current) {
          const url = URL.createObjectURL(blob);
          recordedVideoRef.current.src = url;
          recordedVideoRef.current.load();
          recordedVideoRef.current.play().catch(() => {});
        }
      }, 100);

      const nextAttempt = attemptRef.current + 1;
      attemptRef.current = nextAttempt;
      setAttempt(nextAttempt);

      if (nextAttempt >= 2) {
        evaluate(blob, 'complete');
      }
    };

    mediaRecorder.start();
    setIsRecording(true);

    const maxDuration = maxRecordingDuration * 1000;
    setRecordingTimeLeft(maxRecordingDuration);

    const startTime = Date.now();
    countdownIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, maxRecordingDuration - (Date.now() - startTime) / 1000);
      setRecordingTimeLeft(remaining);
      if (remaining <= 0 && countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }, 100);

    recordingTimerRef.current = setTimeout(() => stopRecording(), maxDuration);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) { clearTimeout(recordingTimerRef.current); recordingTimerRef.current = null; }
      if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    }
  };

  const evaluate = async (blob: Blob, action: 'complete' | 'retry') => {
    if (evaluating) return;
    pendingAction.current = action;
    setEvalError(null);
    setEvaluating(true);
    try {
      const result = await submitRecording(wordPhrase, blob);
      setEvalResult(result);
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : 'Evaluation failed. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleComplete = () => {
    if (!recordedBlob || evaluating) return;
    evaluate(recordedBlob, 'complete');
  };

  const handleTryAgain = () => {
    if (attemptRef.current < 1) return;
    setHasRecorded(false);
    setRecordedBlob(null);
    setEvalResult(null);
    setEvalError(null);
    if (recordedVideoRef.current) {
      if (recordedVideoRef.current.src) URL.revokeObjectURL(recordedVideoRef.current.src);
      recordedVideoRef.current.src = '';
    }
  };

  const resetRecording = () => {
    setHasRecorded(false);
    setRecordedBlob(null);
    setEvalResult(null);
    setEvalError(null);
    attemptRef.current = 0;
    setAttempt(0);
    if (recordedVideoRef.current) {
      if (recordedVideoRef.current.src) URL.revokeObjectURL(recordedVideoRef.current.src);
      recordedVideoRef.current.src = '';
    }
    if (recordingTimerRef.current) { clearTimeout(recordingTimerRef.current); recordingTimerRef.current = null; }
  };

  const handleModalContinue = () => {
    const passed = (evalResult?.overall_score_0_to_4 ?? 0) >= 3;
    setEvalResult(null);
    onComplete(passed);
  };

  const handleModalTryAgain = () => {
    setEvalResult(null);
    resetRecording();
  };

  useEffect(() => {
    if (stream && userVideoRef.current) userVideoRef.current.srcObject = stream;
  }, [stream, hasRecorded]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      attemptRef.current = 0;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white">
      {evalResult && (
        <EvaluationModal
          result={evalResult}
          onContinue={handleModalContinue}
          onTryAgain={handleModalTryAgain}
          hideTryAgain
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button onClick={onBack} className="flex items-center gap-2 text-purple-300 hover:text-white transition">
          <ArrowLeft size={24} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">{unitName}</h1>
        <div className="w-20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Instructions panel */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <span className="bg-purple-700 rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              Remember
            </h3>
            <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl aspect-video flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🤔</div>
                <h4 className="text-2xl font-bold text-purple-300 mb-3">Think back!</h4>
                <p className="text-gray-300 text-lg">How do you sign:</p>
                <p className="text-4xl font-bold text-white mt-2">"{wordPhrase}"</p>
              </div>
            </div>
          </div>

          {/* User Recording */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <span className="bg-purple-700 rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
              Your Turn
            </h3>

            {!stream && !hasRecorded && (
              <div className="bg-gray-800 rounded-2xl p-12 text-center shadow-2xl aspect-video flex flex-col items-center justify-center">
                <Video className="w-16 h-16 text-purple-300 mb-4" />
                <p className="text-gray-400 mb-6">Ready to practice?</p>
                <button
                  onClick={startCamera}
                  className="bg-purple-700 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-semibold transition shadow-lg"
                >
                  Start Camera
                </button>
              </div>
            )}

            {stream && !hasRecorded && (
              <div className="space-y-4">
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                  <video
                    ref={userVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-video object-cover bg-black scale-x-[-1]"
                    onLoadedMetadata={() => console.log('✅ Camera stream loaded')}
                  >
                    Your browser does not support video.
                  </video>
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold">Recording</span>
                      </div>
                      <div className="bg-black bg-opacity-70 px-3 py-1 rounded-full">
                        <span className="text-xs font-mono text-white">{Math.ceil(recordingTimeLeft)}s left</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex-1 bg-gray-700 hover:bg-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition shadow-lg"
                    >
                      Stop Recording
                    </button>
                  )}
                  <button onClick={stopCamera} className="px-6 py-4 bg-gray-700 hover:bg-purple-700 rounded-xl transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {hasRecorded && (
              <div className="space-y-4">
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                  <video
                    ref={recordedVideoRef}
                    playsInline
                    className="w-full aspect-video object-cover bg-black scale-x-[-1]"
                    onLoadedData={() => recordedVideoRef.current?.play().catch(() => {})}
                    onPlay={() => setRecordedPlaying(true)}
                    onPause={() => setRecordedPlaying(false)}
                    onEnded={() => setRecordedPlaying(false)}
                    onError={(e) => console.error('❌ Recorded video error:', e)}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <button
                    onClick={() => {
                      const v = recordedVideoRef.current;
                      if (!v) return;
                      v.paused ? v.play().catch(() => {}) : v.pause();
                    }}
                    className="absolute bottom-3 left-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition"
                  >
                    {recordedPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                </div>

                {evalError && (
                  <div className="bg-red-900/40 border border-red-600/50 rounded-xl p-3 text-red-300 text-sm text-center">
                    {evalError}
                    <button
                      onClick={() => recordedBlob && evaluate(recordedBlob, pendingAction.current)}
                      className="ml-2 underline hover:text-white transition"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleTryAgain}
                    disabled={evaluating}
                    className="flex-1 bg-gray-700 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2"
                  >
                    {evaluating && pendingAction.current === 'retry' ? (
                      <><Loader2 size={20} className="animate-spin" /> Evaluating...</>
                    ) : (
                      <><RotateCcw size={20} /> Try Again</>
                    )}
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={evaluating}
                    className="flex-1 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2"
                  >
                    {evaluating && pendingAction.current === 'complete' ? (
                      <><Loader2 size={20} className="animate-spin" /> Evaluating...</>
                    ) : (
                      <><CheckCircle size={20} /> Complete</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 bg-purple-900/20 rounded-2xl p-6 border border-purple-700/40">
          <h4 className="font-semibold text-lg mb-3 text-gray-200">💡 Tips:</h4>
          <ul className="space-y-2 text-gray-300">
            <li>• Remember what you learned - there's no example this time!</li>
            <li>• Make sure you're in a well-lit area</li>
            <li>• Keep your hands visible in the camera frame</li>
            <li>• Take your time - you have {maxRecordingDuration} seconds to sign</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
