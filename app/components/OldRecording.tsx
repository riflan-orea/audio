'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface OldRecordingProps {
  onAudioContextChange: (context: AudioContext | null) => void;
  onAnalyserChange: (analyser: AnalyserNode | null) => void;
  onIsPlayingChange: (playing: boolean) => void;
}

const OldRecording: React.FC<OldRecordingProps> = ({
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
        
        console.log('Recording completed, blob size:', blob.size);
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">


      {/* Recording Controls */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
              isRecording
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            {isRecording ? 'Recording...' : 'Record'}
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
              !isRecording
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Stop
          </button>
        </div>
        {isRecording && (
          <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Recording...
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="mb-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={playAudio}
            disabled={!audioUrl || isPlaying}
            className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
              !audioUrl || isPlaying
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
            }`}
          >
            {!audioUrl ? 'No Recording' : isPlaying ? 'Playing' : 'Play'}
          </button>
          <button
            onClick={pauseAudio}
            disabled={!isPlaying}
            className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
              !isPlaying
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
            }`}
          >
            Pause
          </button>
          <button
            onClick={stopAudio}
            disabled={!audioUrl}
            className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
              !audioUrl
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Stop
          </button>
        </div>

        {/* Progress Bar */}
        {audioUrl && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500 w-6">{Math.round(volume * 100)}%</span>
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

export default OldRecording; 