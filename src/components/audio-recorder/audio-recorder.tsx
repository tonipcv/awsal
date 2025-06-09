'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function AudioRecorder({
  onTranscriptionComplete,
  onError,
  className,
  disabled = false
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasRecording, setHasRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setHasRecording(true);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      onError?.('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && !isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);

      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setHasRecording(false);
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      onTranscriptionComplete(data.text);
      
      // Clean up after successful transcription
      deleteRecording();

    } catch (error) {
      console.error('Error transcribing audio:', error);
      onError?.(error instanceof Error ? error.message : 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Recording Controls */}
      <div className="flex items-center justify-center">
        {!hasRecording ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled || isTranscribing}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-turquoise hover:bg-turquoise/90 text-black hover:scale-105",
                (disabled || isTranscribing) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRecording ? (
                <StopIcon className="h-8 w-8" />
              ) : (
                <MicrophoneIcon className="h-8 w-8" />
              )}
            </button>
            
            {isRecording && (
              <div className="text-center">
                <div className="text-red-400 font-mono text-lg font-bold">
                  {formatTime(recordingTime)}
                </div>
                <div className="text-gray-400 text-sm">Recording...</div>
              </div>
            )}
            
            {!isRecording && (
              <div className="text-center">
                <div className="text-white text-sm font-medium">
                  Tap to record
                </div>
                <div className="text-gray-400 text-xs">
                  Describe your symptoms
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={isPlaying ? pauseRecording : playRecording}
                disabled={disabled || isTranscribing}
                className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6 ml-1" />
                )}
              </button>
              
              <div className="text-center">
                <div className="text-white text-sm font-medium">
                  Recording ready
                </div>
                <div className="text-gray-400 text-xs">
                  {formatTime(recordingTime)} duration
                </div>
              </div>
              
              <button
                onClick={deleteRecording}
                disabled={disabled || isTranscribing}
                className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <TrashIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Transcribe Button */}
            <div className="flex justify-center">
              <Button
                onClick={transcribeAudio}
                disabled={disabled || isTranscribing}
                className={cn(
                  "bg-turquoise hover:bg-turquoise/90 text-black font-semibold px-6 py-2 rounded-xl transition-all duration-200",
                  isTranscribing && "opacity-75 cursor-not-allowed"
                )}
              >
                {isTranscribing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2"></div>
                    Transcribing...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Convert to Text
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!hasRecording && !isRecording && (
        <div className="text-center text-gray-400 text-xs">
          <p>Press and hold to record your symptoms description.</p>
          <p>The audio will be automatically converted to text.</p>
        </div>
      )}
    </div>
  );
} 