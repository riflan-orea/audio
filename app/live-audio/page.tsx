'use client';

import React, { useState } from 'react';
import LiveAudioVisualizer from '../components/LiveAudioVisualizer';

export default function LiveAudioPage() {
  const [visualizationType, setVisualizationType] = useState<'waveform' | 'spectrum'>('spectrum');

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-8">
          Live Audio Visualization
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

        {/* Live Audio Visualizer */}
        <div className="flex justify-center mb-8">
          <LiveAudioVisualizer
            visualizationType={visualizationType}
            width={800}
            height={200}
            barWidth={4}
            barGap={2}
            barColor="#3b82f6"
            backgroundColor="#ffffff"
          />
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
          <p className="mb-2">
            Click "Start Live Audio" to begin real-time microphone visualization.
          </p>
          <p>
            {visualizationType === 'waveform' 
              ? 'Waveform shows real-time amplitude changes from your microphone input.'
              : 'Spectrum shows real-time frequency distribution of audio from your microphone.'
            }
          </p>
        </div>
      </div>
    </div>
  );
} 