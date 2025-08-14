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
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Real-Time Audio Visualizer
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Audio Controls */}
          <div className="lg:col-span-1">
            <AudioControls
              onAudioContextChange={setAudioContext}
              onAnalyserChange={setAnalyser}
              onIsPlayingChange={setIsPlaying}
            />
          </div>

          {/* Visualization Type Selector */}
          <div className="lg:col-span-1 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                Visualization Type
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setVisualizationType('waveform')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    visualizationType === 'waveform'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Waveform
                </button>
                <button
                  onClick={() => setVisualizationType('spectrum')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    visualizationType === 'spectrum'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Spectrum
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-4 text-center">
                {visualizationType === 'waveform' 
                  ? 'Shows the audio waveform in real-time'
                  : 'Shows frequency spectrum with animated bars'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Audio Visualizer */}
        <div className="flex justify-center">
          <AudioVisualizer
            audioContext={audioContext}
            analyser={analyser}
            isPlaying={isPlaying}
            visualizationType={visualizationType}
            width={800}
            height={300}
            barWidth={6}
            barGap={3}
            barColor="#00ff88"
            backgroundColor="#1a1a1a"
          />
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            How to Use
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Upload Audio</h3>
              <ul className="space-y-2 text-sm">
                <li>• Click "Choose File" to upload an audio file</li>
                <li>• Supported formats: MP3, WAV, OGG, etc.</li>
                <li>• The file will be loaded and ready to play</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Record Audio</h3>
              <ul className="space-y-2 text-sm">
                <li>• Click "Start Recording" to begin</li>
                <li>• Allow microphone access when prompted</li>
                <li>• Click "Stop Recording" when finished</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Playback Controls</h3>
              <ul className="space-y-2 text-sm">
                <li>• Use Play/Pause/Stop buttons to control audio</li>
                <li>• Adjust volume with the slider</li>
                <li>• Watch the visualization respond in real-time</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Visualization</h3>
              <ul className="space-y-2 text-sm">
                <li>• Switch between Waveform and Spectrum views</li>
                <li>• Waveform shows amplitude over time</li>
                <li>• Spectrum shows frequency distribution</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 