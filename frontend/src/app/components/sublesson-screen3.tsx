import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Video, CheckCircle, RotateCcw } from 'lucide-react';

interface SublessonScreen3Props {
  unitName: string;
  wordPhrase: string;
  onComplete: () => void;
  onBack: () => void;
}

export default function SublessonScreen3({
  wordPhrase,
  unitName,
  onComplete,
  onBack
}: SublessonScreen3Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
  const [reRecordCount, setReRecordCount] = useState(0);
  
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fixed duration for recording (6 seconds - 3x a typical 2-second sign)
  const maxRecordingDuration = 6;

  // Start camera access
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      console.log('✅ Camera access granted');
      setStream(mediaStream);
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      alert('Could not access camera. Please allow camera permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Start recording
  const startRecording = () => {
    if (!stream) {
      console.error('❌ No stream available');
      return;
    }
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      console.log('📼 MediaRecorder stopped, processing chunks...');
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      console.log('📦 Blob created, size:', blob.size, 'bytes');
      setRecordedBlob(blob);
      setHasRecorded(true);
      
      setTimeout(() => {
        if (recordedVideoRef.current) {
          const url = URL.createObjectURL(blob);
          recordedVideoRef.current.src = url;
          recordedVideoRef.current.load();
          console.log('✅ Recording saved and loaded, URL:', url);
          
          recordedVideoRef.current.play().catch(err => {
            console.log('Auto-play blocked:', err);
          });
        } else {
          console.error('❌ recordedVideoRef.current is null!');
        }
        
        // If this is the second recording, auto-submit
        if (reRecordCount >= 1) {
          console.log('🎯 Second recording complete - auto-submitting in 2 seconds...');
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      }, 100);
    };

    mediaRecorder.start();
    setIsRecording(true);
    console.log('🔴 Recording started');

    // Auto-stop after fixed duration
    const maxDuration = maxRecordingDuration * 1000;
    setRecordingTimeLeft(maxRecordingDuration);
    console.log(`⏱️ Max recording duration: ${maxRecordingDuration} seconds`);
    
    // Countdown timer
    const startTime = Date.now();
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, maxRecordingDuration - elapsed);
      setRecordingTimeLeft(remaining);
      
      if (remaining <= 0 && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }, 100);
    
    recordingTimerRef.current = setTimeout(() => {
      console.log('⏹️ Auto-stopping recording (max duration reached)');
      stopRecording();
    }, maxDuration);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('⏹️ Stopping recording');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      console.log('📹 Camera stream kept active for potential re-record');
    }
  };

  // Reset and try again
  const resetRecording = () => {
    const newCount = reRecordCount + 1;
    setReRecordCount(newCount);
    
    console.log(`🔄 Re-recording attempt ${newCount}/1`);
    
    setHasRecorded(false);
    setRecordedBlob(null);
    if (recordedVideoRef.current) {
      if (recordedVideoRef.current.src) {
        URL.revokeObjectURL(recordedVideoRef.current.src);
      }
      recordedVideoRef.current.src = '';
    }
    
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Attach camera stream
  useEffect(() => {
    if (stream && userVideoRef.current) {
      userVideoRef.current.srcObject = stream;
      console.log('✅ Camera stream attached');
    }
  }, [stream, hasRecorded]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-purple-300 hover:text-white transition"
        >
          <ArrowLeft size={24} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">{unitName}</h1>
        <div className="w-20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Instructions Section (replaces example video) */}
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

          {/* User Recording Section */}
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
                      <span className="text-xs font-mono text-white">
                        {Math.ceil(recordingTimeLeft)}s left
                      </span>
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
                <button
                  onClick={stopCamera}
                  className="px-6 py-4 bg-gray-700 hover:bg-purple-700 rounded-xl transition"
                >
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
                  controls
                  playsInline
                  className="w-full aspect-video object-cover bg-black scale-x-[-1]"
                  onLoadedData={() => {
                    console.log('✅ Recorded video loaded');
                    if (recordedVideoRef.current) {
                      recordedVideoRef.current.play().catch(err => {
                        console.log('Auto-play blocked:', err);
                      });
                    }
                  }}
                  onError={(e) => console.error('❌ Recorded video error:', e)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              
              {reRecordCount >= 1 ? (
                <div className="bg-purple-900/20 border border-purple-500/40 rounded-xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">Great job!</h3>
                  <p className="text-gray-300">Completing lesson...</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={resetRecording}
                    className="flex-1 bg-gray-700 hover:bg-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={20} />
                    Try Again (1 re-record left)
                  </button>
                  <button
                    onClick={onComplete}
                    className="flex-1 bg-purple-700 hover:bg-purple-600 text-white px-6 py-4 rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Complete
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Instructions */}
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