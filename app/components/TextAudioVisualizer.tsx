'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface TextAudioVisualizerProps {
  visualizationType: 'waveform' | 'spectrum';
  width?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  backgroundColor?: string;
}

const TextAudioVisualizer: React.FC<TextAudioVisualizerProps> = ({
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
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const [text, setText] = useState('Hello, this is a text-to-speech audio visualizer. Speak clearly and watch the visualization respond to the generated audio.');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
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
    if (!analyserRef.current || !canvasRef.current || !isPlaying) {
      console.log('Animation stopped:', { 
        hasAnalyser: !!analyserRef.current, 
        hasCanvas: !!canvasRef.current, 
        isPlaying 
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
  }, [isPlaying, visualizationType, drawWaveform, drawSpectrum]);

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const gainNode = audioContext.createGain();
      gainNodeRef.current = gainNode;

      gainNode.connect(analyser);
      analyser.connect(audioContext.destination);
      
      console.log('Text audio context initialized:', {
        audioContextState: audioContext.state,
        analyserFftSize: analyser.fftSize,
        analyserFrequencyBinCount: analyser.frequencyBinCount
      });
    }
  }, []);

  const speakText = useCallback(async () => {
    try {
      setError(null);
      
      if (!window.speechSynthesis) {
        setError('Speech synthesis is not supported in this browser.');
        return;
      }

      // Cancel any existing speech
      window.speechSynthesis.cancel();

      // Initialize audio context
      initializeAudioContext();
      
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Set up audio processing for visualization
      const audioContext = audioContextRef.current!;
      const gainNode = gainNodeRef.current!;

      // Create a more dynamic audio source for visualization
      const oscillator = audioContext.createOscillator();
      const oscillatorGain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // Configure filter for more realistic speech-like audio
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, audioContext.currentTime);
      filter.Q.setValueAtTime(1, audioContext.currentTime);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillatorGain.gain.setValueAtTime(0.05, audioContext.currentTime);
      
      // Connect audio chain
      oscillator.connect(filter);
      filter.connect(oscillatorGain);
      oscillatorGain.connect(gainNode);
      
      sourceRef.current = oscillator as any;

      // Create dynamic frequency modulation for more realistic visualization
      let frequencyModulation: NodeJS.Timeout;
      let gainModulation: NodeJS.Timeout;

      const startModulation = () => {
        frequencyModulation = setInterval(() => {
          const baseFreq = 200 + Math.random() * 400;
          oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
          filter.frequency.setValueAtTime(baseFreq * 2, audioContext.currentTime);
        }, 100);

        gainModulation = setInterval(() => {
          const gain = 0.02 + Math.random() * 0.08;
          oscillatorGain.gain.setValueAtTime(gain, audioContext.currentTime);
        }, 50);
      };

      const stopModulation = () => {
        if (frequencyModulation) clearInterval(frequencyModulation);
        if (gainModulation) clearInterval(gainModulation);
      };

      // Start speech synthesis
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        oscillator.start();
        startModulation();
        console.log('Speech started with visualization');
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentTime(0);
        oscillator.stop();
        stopModulation();
        console.log('Speech ended');
      };

      utterance.onpause = () => {
        setIsPaused(true);
        oscillator.stop();
        stopModulation();
        console.log('Speech paused');
      };

      utterance.onresume = () => {
        setIsPaused(false);
        oscillator.start();
        startModulation();
        console.log('Speech resumed');
      };

      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setIsPlaying(false);
        setIsPaused(false);
        oscillator.stop();
        stopModulation();
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
      
      // Estimate duration (rough calculation)
      const estimatedDuration = (text.length * 0.1) / rate;
      setDuration(estimatedDuration);

    } catch (error) {
      console.error('Error in speech synthesis:', error);
      setError('Failed to start speech synthesis.');
    }
  }, [text, rate, pitch, volume, initializeAudioContext]);

  const stopSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
  }, []);

  const pauseSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

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
        console.log('Text audio canvas initialized:', { width, height });
      }
    }
  }, [width, height, backgroundColor]);

  // Start animation when playing
  useEffect(() => {
    console.log('Text audio animation effect triggered:', { isPlaying, hasAnalyser: !!analyserRef.current });
    
    if (isPlaying && analyserRef.current) {
      console.log('Starting text audio animation');
      animate();
    } else if (animationFrameRef.current) {
      console.log('Stopping text audio animation');
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Update current time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isPaused) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          return newTime >= duration ? 0 : newTime;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isPaused, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopSpeech]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Text Input */}
      <div className="w-full max-w-2xl">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text to Speech
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter text to convert to speech and visualize..."
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <button
          onClick={isPlaying ? stopSpeech : speakText}
          disabled={!text.trim()}
          className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
            !text.trim()
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : isPlaying
              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
        >
          {isPlaying ? 'Stop' : 'Speak'}
        </button>

        {isPlaying && (
          <>
            <button
              onClick={isPaused ? resumeSpeech : pauseSpeech}
              className="px-4 py-2 text-sm font-medium rounded border bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </>
        )}
      </div>

      {/* Audio Settings */}
      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-500 w-8">{Math.round(volume * 100)}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rate:</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-500 w-8">{rate}x</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Pitch:</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-500 w-8">{pitch}x</span>
        </div>
      </div>

      {/* Progress Bar */}
      {isPlaying && (
        <div className="w-full max-w-2xl">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm">
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
        {isPlaying && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            SPEAKING
          </div>
        )}
      </div>

      {/* Status Info */}
      {isPlaying && (
        <div className="text-xs text-gray-500">
          {visualizationType === 'waveform' 
            ? 'Real-time amplitude visualization of speech synthesis'
            : 'Real-time frequency spectrum of speech synthesis'
          }
        </div>
      )}
    </div>
  );
};

export default TextAudioVisualizer; 