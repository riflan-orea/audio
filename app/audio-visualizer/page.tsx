'use client';

import React, { useState } from 'react';
import AudioControls from '../components/AudioControls';
import AudioVisualizer from '../components/AudioVisualizer';

export default function AudioVisualizerPage() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizationType, setVisualizationType] = useState<'waveform' | 'spectrum'>('spectrum');

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-8">
          Audio Visualization Research
        </h1>
        
        {/* Controls Row */}
        <div className="mb-8">
          <AudioControls
            onAudioContextChange={setAudioContext}
            onAnalyserChange={setAnalyser}
            onIsPlayingChange={setIsPlaying}
          />
        </div>

        {/* Visualization Type Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVisualizationType('waveform')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                visualizationType === 'waveform'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Waveform
            </button>
            <button
              onClick={() => setVisualizationType('spectrum')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                visualizationType === 'spectrum'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Spectrum
            </button>
          </div>
        </div>

        {/* Audio Visualizer */}
        <div className="flex justify-center mb-8">
          <AudioVisualizer
            audioContext={audioContext}
            analyser={analyser}
            isPlaying={isPlaying}
            visualizationType={visualizationType}
            width={800}
            height={200}
            barWidth={4}
            barGap={2}
            barColor="#3b82f6"
            backgroundColor="#ffffff"
          />
        </div>

        {/* Status Info */}
        <div className="text-center text-sm text-gray-500">
          {visualizationType === 'waveform' 
            ? 'Time-domain amplitude visualization'
            : 'Frequency-domain spectrum analysis'
          }
        </div>
      </div>
    </div>
  );
} 