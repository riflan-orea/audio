'use client';

import React, { useState } from 'react';
import TextAudioVisualizer from '../components/TextAudioVisualizer';

export default function TextAudioPage() {
  const [visualizationType, setVisualizationType] = useState<'waveform' | 'spectrum'>('spectrum');

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-8">
          Text-to-Speech Audio Visualizer
        </h1>
        
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

        {/* Text Audio Visualizer */}
        <TextAudioVisualizer
          visualizationType={visualizationType}
          width={800}
          height={200}
          barWidth={4}
          barGap={2}
          barColor="#3b82f6"
          backgroundColor="#ffffff"
        />

        {/* Instructions */}
        <div className="mt-12 text-center text-sm text-gray-500 max-w-2xl mx-auto">
          <p className="mb-2">
            Enter text in the textarea above and click "Speak" to convert it to speech with real-time visualization.
          </p>
          <p>
            {visualizationType === 'waveform' 
              ? 'Waveform shows amplitude changes during speech synthesis.'
              : 'Spectrum shows frequency distribution during speech synthesis.'
            }
          </p>
        </div>
      </div>
    </div>
  );
} 