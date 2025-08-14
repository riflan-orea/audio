'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface AudioControlsProps {
  onAudioContextChange: (context: AudioContext | null) => void;
  onAnalyserChange: (analyser: AnalyserNode | null) => void;
  onIsPlayingChange: (playing: boolean) => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  onAudioContextChange,
  onAnalyserChange,
  onIsPlayingChange
}) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const initializeAudioContext = useCallback(() => {
    if (!audioContext) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = context.createAnalyser();
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      setAudioContext(context);
      analyserRef.current = analyser;
      onAudioContextChange(context);
      onAnalyserChange(analyser);
    }
  }, [audioContext, onAudioContextChange, onAnalyserChange]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !audioContext) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      if (audioRef.current) {
        const url = URL.createObjectURL(file);
        audioRef.current.src = url;
        setAudioUrl(url);
        setDuration(audioBuffer.duration);
      }
    } catch (error) {
      console.error('Error loading audio file:', error);
    }
  }, [audioContext]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      streamRef.current = stream;
      
      // Get supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
        ? 'audio/mp4' 
        : 'audio/wav';
      
      const recorder = new MediaRecorder(stream, { mimeType });
      
      // Store chunks in state to persist across events
      const recordingChunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(recordingChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordedChunks(recordingChunks);
        
        if (audioRef.current) {
          audioRef.current.src = url;
          // Set duration for recorded audio
          audioRef.current.onloadedmetadata = () => {
            setDuration(audioRef.current?.duration || 0);
          };
        }
        
        console.log('Recording stopped, blob size:', blob.size);
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
      };
      
      setMediaRecorder(recorder);
      recorder.start(1000); // Collect data every second
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [mediaRecorder, isRecording]);

  const playAudio = useCallback(() => {
    if (!audioRef.current) return;

    // Initialize audio context if not already done
    if (!audioContext) {
      initializeAudioContext();
    } else if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    audioRef.current.play().then(() => {
      setIsPlaying(true);
      onIsPlayingChange(true);
    }).catch((error) => {
      console.error('Error playing audio:', error);
    });
  }, [audioContext, initializeAudioContext, onIsPlayingChange]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onIsPlayingChange(false);
    }
  }, [onIsPlayingChange]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      onIsPlayingChange(false);
      setCurrentTime(0);
    }
  }, [onIsPlayingChange]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        onIsPlayingChange(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, [handleTimeUpdate, handleLoadedMetadata, onIsPlayingChange]);

  useEffect(() => {
    if (audioRef.current && analyserRef.current && audioContext) {
      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);
      setAudioSource(source);
    }
  }, [audioContext]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Audio Visualizer
      </h2>
      
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Upload Audio File
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
        />
      </div>

      {/* Recording Controls */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Record Audio
        </label>
        <div className="flex gap-2">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRecording
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !isRecording
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Stop Recording
          </button>
        </div>
        {isRecording && (
          <div className="mt-2 flex items-center gap-2 text-red-400">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Recording in progress...</span>
          </div>
        )}
        {recordedChunks.length > 0 && !isRecording && (
          <div className="mt-2 text-sm text-green-400">
            ✓ Recording completed successfully ({recordedChunks.length} chunks)
          </div>
        )}
        {/* Debug info */}
        <div className="mt-2 text-xs text-gray-500">
          <div>Audio URL: {audioUrl ? 'Set' : 'Not set'}</div>
          <div>Recording: {isRecording ? 'Yes' : 'No'}</div>
          <div>Chunks: {recordedChunks.length}</div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={playAudio}
            disabled={!audioUrl || isPlaying}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !audioUrl || isPlaying
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Play
          </button>
          <button
            onClick={pauseAudio}
            disabled={!isPlaying}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !isPlaying
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            Pause
          </button>
          <button
            onClick={stopAudio}
            disabled={!audioUrl}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !audioUrl
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Stop
          </button>
        </div>

        {/* Progress Bar */}
        {audioUrl && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-300 w-8">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        style={{ display: 'none' }}
        onEnded={() => {
          setIsPlaying(false);
          onIsPlayingChange(false);
        }}
      />
    </div>
  );
};

export default AudioControls; 