'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface RecordingVisualizerProps {
  visualizationType: 'waveform' | 'spectrum';
  width?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  backgroundColor?: string;
  onRecordingComplete?: (audioUrl: string, blob: Blob) => void;
}

const RecordingVisualizer: React.FC<RecordingVisualizerProps> = ({
  visualizationType,
  width = 800,
  height = 200,
  barWidth = 4,
  barGap = 2,
  barColor = '#3b82f6',
  backgroundColor = '#ffffff',
  onRecordingComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingChunks, setRecordingChunks] = useState<Blob[]>([]);
  const [completionData, setCompletionData] = useState<{ url: string; blob: Blob } | null>(null);

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, data: Uint8Array) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = barColor;
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [width, height, barColor, backgroundColor]);

  const drawSpectrum = useCallback((ctx: CanvasRenderingContext2D, data: Uint8Array) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const barCount = Math.floor(width / (barWidth + barGap));
    const step = Math.floor(data.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      const value = data[dataIndex];
      const barHeight = (value / 255) * height;

      const x = i * (barWidth + barGap);
      const y = height - barHeight;

      // Create gradient effect
      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, barColor);
      gradient.addColorStop(1, '#1d4ed8');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [width, height, barWidth, barGap, barColor, backgroundColor]);

  const animate = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current || !isRecording) {
      console.log('Animation stopped:', { 
        hasAnalyser: !!analyserRef.current, 
        hasCanvas: !!canvasRef.current, 
        isRecording 
      });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('No canvas context');
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    if (visualizationType === 'waveform') {
      analyserRef.current.getByteTimeDomainData(data);
      drawWaveform(ctx, data);
    } else {
      analyserRef.current.getByteFrequencyData(data);
      drawSpectrum(ctx, data);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isRecording, visualizationType, drawWaveform, drawSpectrum]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordedChunks([]);
      setRecordingTime(0);
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;

      // Create audio context for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create analyser for visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Create source from stream for visualization
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Connect audio graph for visualization
      source.connect(analyser);
      // Don't connect to destination to avoid feedback
      
      console.log('Audio setup complete:', {
        audioContextState: audioContext.state,
        analyserFftSize: analyser.fftSize,
        analyserFrequencyBinCount: analyser.frequencyBinCount,
        sourceConnected: true
      });

      // Set up MediaRecorder for recording
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
        ? 'audio/mp4' 
        : 'audio/wav';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Clear previous chunks
      setRecordingChunks([]);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordingChunks(prev => [...prev, event.data]);
        }
      };
      
      mediaRecorder.onstop = () => {
        setRecordingChunks(currentChunks => {
          const blob = new Blob(currentChunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setRecordedChunks(currentChunks);
          
          // Store the completion data for async processing
          setCompletionData({ url, blob });
          
          console.log('Recording completed, blob size:', blob.size);
          return currentChunks;
        });
      };

      // Start recording and visualization
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      console.log('Recording with visualization started');
      console.log('MediaRecorder state:', mediaRecorder.state);
      console.log('AudioContext state:', audioContext.state);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    mediaRecorderRef.current = null;
    analyserRef.current = null;
    setIsRecording(false);
    console.log('Recording stopped');
  }, [isRecording]);

  // Update recording time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Start animation when recording
  useEffect(() => {
    console.log('Animation effect triggered:', { isRecording, hasAnalyser: !!analyserRef.current });
    
    if (isRecording && analyserRef.current) {
      console.log('Starting animation');
      animate();
    } else if (animationFrameRef.current) {
      console.log('Stopping animation');
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, animate]);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas initially
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        console.log('Canvas initialized:', { width, height });
      }
    }
  }, [width, height, backgroundColor]);

  // Handle recording completion asynchronously
  useEffect(() => {
    if (completionData && onRecordingComplete) {
      onRecordingComplete(completionData.url, completionData.blob);
      setCompletionData(null);
    }
  }, [completionData, onRecordingComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <div className="flex flex-col items-center">
      {/* Control Button */}
      <div className="mb-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
            isRecording
              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="mb-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Recording...
          </div>
          <div className="text-gray-600">
            Time: {formatTime(recordingTime)}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border border-gray-200 rounded"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        {isRecording && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            LIVE
          </div>
        )}
      </div>

      {/* Status Info */}
      {isRecording && (
        <div className="mt-2 text-xs text-gray-500">
          {visualizationType === 'waveform' 
            ? 'Live amplitude visualization while recording'
            : 'Live frequency spectrum while recording'
          }
        </div>
      )}

      {/* Recording Complete Status */}
      {recordedChunks.length > 0 && !isRecording && (
        <div className="mt-2 text-sm text-green-600">
          ✓ Recording completed ({recordedChunks.length} chunks)
        </div>
      )}
    </div>
  );
};

export default RecordingVisualizer; 