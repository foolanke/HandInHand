import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Video, CheckCircle, RotateCcw, Loader2, Play, Pause } from 'lucide-react';
import EvaluationModal, { type EvaluationResult } from './EvaluationModal';
import { submitRecording } from '../lib/api';

interface SublessonScreen3Props {
  unitName: string;
  wordPhrase: string;
  onComplete: (passed: boolean) => void;
  onBack: () => void;
  fireAndForget?: boolean;
  onRecordingSubmitted?: (blob: Blob) => void;
}

export default function SublessonScreen3({
  wordPhrase,
  unitName,
  onComplete,
  onBack,
  fireAndForget = false,
  onRecordingSubmitted,
}: SublessonScreen3Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const attemptRef = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [recordedPlaying, setRecordedPlaying] = useState(false);
  const [hasRerecorded, setHasRerecorded] = useState(false);
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

      if (!fireAndForget && nextAttempt >= 2) {
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
    setHasRerecorded(true);
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

  const handleFireAndForgetSubmit = () => {
    if (!recordedBlob) return;
    onRecordingSubmitted?.(recordedBlob);
    setSubmitted(true);
    setTimeout(() => {
      onComplete(true);
    }, 1000);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {!fireAndForget && evalResult && (
        <EvaluationModal
          result={evalResult}
          onContinue={handleModalContinue}
          onTryAgain={handleModalTryAgain}
          hideTryAgain
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-300 hover:text-white transition">
          <ArrowLeft size={24} />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">{unitName}</h1>
        <div className="w-20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Instructions panel */}
          <div className="space-y-6 bg-slate-900/50 rounded-3xl p-6 border-2 border-slate-700 shadow-2xl">
            <h3 className="text-2xl font-bold text-white flex items-center gap-4">
              <span className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-lg border-2 border-purple-400">1</span>
              Remember
            </h3>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl aspect-video flex flex-col items-center justify-center border-2 border-slate-700">
              <div className="text-center">
                <div className="text-7xl mb-6">🤔</div>
                <h4 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-4">Think back!</h4>
                <p className="text-slate-200 text-xl mb-2">Now sign the word:</p>
                <p className="text-5xl font-bold text-white mt-3">"{wordPhrase}"</p>
              </div>
            </div>
          </div>

          {/* User Recording */}
          <div className="space-y-6 bg-slate-900/50 rounded-3xl p-6 border-2 border-slate-700 shadow-2xl">
            <h3 className="text-2xl font-bold text-white flex items-center gap-4">
              <span className="bg-gradient-to-br from-purple-600 to-purple-900 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-lg border-2 border-purple-400">2</span>
              Your Turn
            </h3>

            {!stream && !hasRecorded && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 text-center shadow-2xl aspect-video flex flex-col items-center justify-center border-2 border-slate-700">
                <Video className="w-20 h-20 text-purple-400 mb-6" />
                <p className="text-xl text-slate-200 mb-8 font-medium">Ready to practice?</p>
                <button
                  onClick={startCamera}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-12 py-5 rounded-xl font-bold text-lg transition shadow-2xl transform hover:scale-105 border-2 border-purple-400"
                >
                  Start Camera
                </button>
              </div>
            )}

            {stream && !hasRecorded && (
              <div className="space-y-4">
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-purple-500/20">
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
                      <div className="flex items-center gap-2 bg-red-600 px-5 py-3 rounded-xl shadow-lg border-2 border-red-400">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        <span className="text-base font-bold">Recording</span>
                      </div>
                      <div className="bg-black/80 px-4 py-2 rounded-xl border border-slate-600">
                        <span className="text-sm font-mono text-white font-bold">{Math.ceil(recordingTimeLeft)}s left</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-5 rounded-xl font-bold text-lg transition shadow-2xl flex items-center justify-center gap-3 border-2 border-red-400 transform hover:scale-105"
                    >
                      <div className="w-5 h-5 bg-white rounded-full"></div>
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-5 rounded-xl font-bold text-lg transition shadow-lg border-2 border-slate-600"
                    >
                      Stop Recording
                    </button>
                  )}
                  <button onClick={stopCamera} className="px-6 py-5 bg-slate-700 hover:bg-slate-600 rounded-xl transition border-2 border-slate-600 font-bold">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {hasRecorded && (
              <div className="space-y-4">
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-purple-500/20">
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
                    className="absolute bottom-4 left-4 bg-black/70 hover:bg-black/90 text-white rounded-full p-3 transition border border-slate-500"
                  >
                    {recordedPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                </div>

                {!fireAndForget && evalError && (
                  <div className="bg-red-900/50 border-2 border-red-600 rounded-xl p-4 text-red-200 text-base text-center font-medium shadow-lg">
                    {evalError}
                    <button
                      onClick={() => recordedBlob && evaluate(recordedBlob, pendingAction.current)}
                      className="ml-2 underline hover:text-white transition font-bold"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {fireAndForget ? (
                  submitted ? (
                    <div className="bg-green-900/50 border-2 border-green-600 rounded-2xl p-8 text-center shadow-2xl">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
                      <h3 className="text-2xl font-bold text-green-300">Submitted!</h3>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {!hasRerecorded && (
                        <button
                          onClick={handleTryAgain}
                          className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-5 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2 border-2 border-slate-600"
                        >
                          <RotateCcw size={22} /> Re-record
                        </button>
                      )}
                      <button
                        onClick={handleFireAndForgetSubmit}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-6 py-5 rounded-xl font-bold text-lg transition shadow-2xl flex items-center justify-center gap-2 border-2 border-purple-400 transform hover:scale-105"
                      >
                        <CheckCircle size={22} /> Submit Recording
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex gap-3">
                    {!hasRerecorded && (
                      <button
                        onClick={handleTryAgain}
                        disabled={evaluating}
                        className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-5 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2 border-2 border-slate-600"
                      >
                        {evaluating && pendingAction.current === 'retry' ? (
                          <><Loader2 size={22} className="animate-spin" /> Evaluating...</>
                        ) : (
                          <><RotateCcw size={22} /> Try Again</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleComplete}
                      disabled={evaluating}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-5 rounded-xl font-bold text-lg transition shadow-2xl flex items-center justify-center gap-2 border-2 border-purple-400 transform hover:scale-105"
                    >
                      {evaluating && pendingAction.current === 'complete' ? (
                        <><Loader2 size={22} className="animate-spin" /> Evaluating...</>
                      ) : (
                        <><CheckCircle size={22} /> Complete</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <h4 className="font-bold text-2xl mb-6 text-white flex items-center gap-3">
            <span className="text-3xl">💡</span>
            Tips for Success
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border-2 border-slate-700 shadow-lg hover:border-purple-500/50 transition">
              <p className="text-slate-100 font-medium text-base">Remember what you learned - there's no example this time!</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border-2 border-slate-700 shadow-lg hover:border-purple-500/50 transition">
              <p className="text-slate-100 font-medium text-base">Make sure you're in a well-lit area</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border-2 border-slate-700 shadow-lg hover:border-purple-500/50 transition">
              <p className="text-slate-100 font-medium text-base">Keep your hands visible in the camera frame</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border-2 border-slate-700 shadow-lg hover:border-purple-500/50 transition">
              <p className="text-slate-100 font-medium text-base">Take your time - you have {maxRecordingDuration} seconds to sign</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
