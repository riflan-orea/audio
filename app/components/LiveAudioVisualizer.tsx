'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface LiveAudioVisualizerProps {
  visualizationType: 'waveform' | 'spectrum';
  width?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  backgroundColor?: string;
}

const LiveAudioVisualizer: React.FC<LiveAudioVisualizerProps> = ({
  visualizationType,
  width = 800,
  height = 200,
  barWidth = 4,
  barGap = 2,
  barColor = '#3b82f6',
  backgroundColor = '#ffffff'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!analyserRef.current || !canvasRef.current || !isListening) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
  }, [isListening, visualizationType, drawWaveform, drawSpectrum]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Create source from stream
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Connect audio graph
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      setIsListening(true);
      console.log('Live audio visualization started');
    } catch (error) {
      console.error('Error starting live audio:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, []);

  const stopListening = useCallback(() => {
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

    analyserRef.current = null;
    setIsListening(false);
    console.log('Live audio visualization stopped');
  }, []);

  useEffect(() => {
    if (isListening && analyserRef.current) {
      animate();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, animate]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return (
    <div className="flex flex-col items-center">
      {/* Control Button */}
      <div className="mb-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
            isListening
              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
        >
          {isListening ? 'Stop Live Audio' : 'Start Live Audio'}
        </button>
      </div>

      {/* Status Indicator */}
      {isListening && (
        <div className="mb-4 flex items-center gap-2 text-green-600 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live audio active
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded"
        style={{ maxWidth: '100%', height: 'auto' }}
      />

      {/* Audio Level Indicator */}
      {isListening && (
        <div className="mt-2 text-xs text-gray-500">
          {visualizationType === 'waveform' 
            ? 'Real-time amplitude visualization'
            : 'Real-time frequency spectrum'
          }
        </div>
      )}
    </div>
  );
};

export default LiveAudioVisualizer; 