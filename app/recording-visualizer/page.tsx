'use client';

import React, { useState } from 'react';
import RecordingVisualizer from '../components/RecordingVisualizer';

export default function RecordingVisualizerPage() {
  const [visualizationType, setVisualizationType] = useState<'waveform' | 'spectrum'>('spectrum');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const handleRecordingComplete = (audioUrl: string, blob: Blob) => {
    setRecordedAudioUrl(audioUrl);
    console.log('Recording completed with blob size:', blob.size);
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-8">
          Recording with Live Visualization
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

        {/* Recording Visualizer */}
        <div className="flex justify-center mb-8">
          <RecordingVisualizer
            visualizationType={visualizationType}
            width={800}
            height={200}
            barWidth={4}
            barGap={2}
            barColor="#3b82f6"
            backgroundColor="#ffffff"
            onRecordingComplete={handleRecordingComplete}
          />
        </div>

        {/* Recorded Audio Player */}
        {recordedAudioUrl && (
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Recorded Audio</h3>
            <audio
              controls
              className="mx-auto"
              src={recordedAudioUrl}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto mt-8">
          <p className="mb-2">
            This component records audio while showing real-time visualization.
          </p>
          <p>
            {visualizationType === 'waveform' 
              ? 'Waveform shows real-time amplitude changes during recording.'
              : 'Spectrum shows real-time frequency distribution during recording.'
            }
          </p>
        </div>
      </div>
    </div>
  );
} 