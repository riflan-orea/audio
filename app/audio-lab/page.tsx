'use client';

import React, { useState } from 'react';
import TabView from '../components/TabView';
import AudioControls from '../components/AudioControls';
import AudioVisualizer from '../components/AudioVisualizer';
import LiveAudioVisualizer from '../components/LiveAudioVisualizer';
import RecordingVisualizer from '../components/RecordingVisualizer';
import TextAudioVisualizer from '../components/TextAudioVisualizer';
import OldRecording from '../components/OldRecording';

export default function AudioLabPage() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizationType, setVisualizationType] = useState<'waveform' | 'spectrum'>('spectrum');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  // State for old record tab
  const [oldRecordAudioContext, setOldRecordAudioContext] = useState<AudioContext | null>(null);
  const [oldRecordAnalyser, setOldRecordAnalyser] = useState<AnalyserNode | null>(null);
  const [oldRecordIsPlaying, setOldRecordIsPlaying] = useState(false);
  
  // State for old recording in recording tab
  const [recordingTabAudioContext, setRecordingTabAudioContext] = useState<AudioContext | null>(null);
  const [recordingTabAnalyser, setRecordingTabAnalyser] = useState<AnalyserNode | null>(null);
  const [recordingTabIsPlaying, setRecordingTabIsPlaying] = useState(false);

  const handleRecordingComplete = React.useCallback((audioUrl: string, blob: Blob) => {
    setRecordedAudioUrl(audioUrl);
    console.log('Recording completed with blob size:', blob.size);
  }, []);



  const tabs = [
    {
      id: 'file-audio',
      label: 'File Audio',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">File Audio Analysis</h3>
            <p className="text-sm text-gray-500">Upload and analyze audio files with real-time visualization</p>
          </div>
          
          <AudioControls
            onAudioContextChange={setAudioContext}
            onAnalyserChange={setAnalyser}
            onIsPlayingChange={setIsPlaying}
          />
          
          <div className="flex justify-center">
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
        </div>
      )
    },
    {
      id: 'live-audio',
      label: 'Live Audio',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Live Audio Monitoring</h3>
            <p className="text-sm text-gray-500">Real-time microphone visualization without recording</p>
          </div>
          
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
      )
    },
    {
      id: 'recording',
      label: 'Recording',
      content: (
        <div className="space-y-8">
          {/* New Recording with Live Visualization */}
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Recording with Live Visualization</h3>
              <p className="text-sm text-gray-500">Record audio while viewing real-time visualization</p>
            </div>
            
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
            
            {recordedAudioUrl && (
              <div className="text-center">
                <h4 className="text-md font-medium text-gray-800 mb-3">Recorded Audio</h4>
                <audio
                  controls
                  className="mx-auto"
                  src={recordedAudioUrl}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>

          
        </div>
      )
    },
    {
      id: 'text-audio',
      label: 'Text Audio',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Text-to-Speech Visualization</h3>
            <p className="text-sm text-gray-500">Convert text to speech with real-time audio visualization</p>
          </div>
          
          <TextAudioVisualizer
            visualizationType={visualizationType}
            width={800}
            height={200}
            barWidth={4}
            barGap={2}
            barColor="#3b82f6"
            backgroundColor="#ffffff"
          />
        </div>
      )
    },
    {
      id: 'old-record',
      label: 'Old Record',
      content: (
        <div className="space-y-8">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Old Recording Method</h3>
          <p className="text-sm text-gray-500">Traditional recording with file upload and playback</p>
        </div>
        
        <OldRecording
          onAudioContextChange={setRecordingTabAudioContext}
          onAnalyserChange={setRecordingTabAnalyser}
          onIsPlayingChange={setRecordingTabIsPlaying}
        />
        
        <div className="flex justify-center mt-6">
          <AudioVisualizer
            audioContext={recordingTabAudioContext}
            analyser={recordingTabAnalyser}
            isPlaying={recordingTabIsPlaying}
            visualizationType={visualizationType}
            width={800}
            height={200}
            barWidth={4}
            barGap={2}
            barColor="#3b82f6"
            backgroundColor="#ffffff"
          />
        </div>
      </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-light text-gray-800 text-center mb-8">
          Audio Visualization Lab
        </h1>
        
        {/* Visualization Type Toggle */}
        <div className="mb-8 flex justify-center">
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

        {/* Tab View */}
        <TabView tabs={tabs} defaultTab="file-audio" />

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            {visualizationType === 'waveform' 
              ? 'Waveform visualization shows amplitude changes over time'
              : 'Spectrum visualization shows frequency distribution'
            }
          </p>
        </div>
      </div>
    </div>
  );
} 