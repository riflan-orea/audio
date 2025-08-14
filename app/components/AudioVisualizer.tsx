'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  visualizationType: 'waveform' | 'spectrum';
  width?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  backgroundColor?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioContext,
  analyser,
  isPlaying,
  visualizationType,
  width = 800,
  height = 200,
  barWidth = 4,
  barGap = 2,
  barColor = '#00ff88',
  backgroundColor = '#1a1a1a'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

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
      gradient.addColorStop(1, '#00cc66');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [width, height, barWidth, barGap, barColor, backgroundColor]);

  const animate = useCallback(() => {
    if (!analyser || !canvasRef.current || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    if (visualizationType === 'waveform') {
      analyser.getByteTimeDomainData(data);
      drawWaveform(ctx, data);
    } else {
      analyser.getByteFrequencyData(data);
      drawSpectrum(ctx, data);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [analyser, isPlaying, visualizationType, drawWaveform, drawSpectrum]);

  useEffect(() => {
    if (isPlaying && analyser) {
      animate();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, analyser, animate]);

  useEffect(() => {
    if (analyser) {
      const bufferLength = analyser.frequencyBinCount;
      setDataArray(new Uint8Array(bufferLength));
    }
  }, [analyser]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-600 rounded-lg shadow-lg"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="text-sm text-gray-400">
        {visualizationType === 'waveform' ? 'Waveform' : 'Spectrum Analyzer'}
      </div>
    </div>
  );
};

export default AudioVisualizer; 