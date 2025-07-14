'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MicrophoneIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import AudioRecorder from '@/components/audio-recorder/audio-recorder';

interface VoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onVoiceNoteCreated: () => void;
}

export default function VoiceNoteModal({
  isOpen,
  onClose,
  patientId,
  onVoiceNoteCreated
}: VoiceNoteModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranscriptionComplete = async (text: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Create voice note
      const response = await fetch('/api/voice-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId,
          transcription: text,
          audioUrl: 'direct-transcription', // Placeholder for direct transcription
          duration: 0 // Default duration for direct transcription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create voice note');
      }

      const voiceNote = await response.json();

      // Start analysis
      const analyzeResponse = await fetch(`/api/voice-notes/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voiceNoteId: voiceNote.id
        })
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze voice note');
      }

      onVoiceNoteCreated();
      onClose();
    } catch (error) {
      console.error('Error processing voice note:', error);
      setError(error instanceof Error ? error.message : 'Failed to process voice note');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);

      const formData = new FormData();
      formData.append('audio', file);
      formData.append('patientId', patientId);

      const response = await fetch('/api/voice-notes/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio file');
      }

      onVoiceNoteCreated();
      onClose();
    } catch (error) {
      console.error('Error uploading audio:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload audio');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Voice Note</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="record">
              <MicrophoneIcon className="h-4 w-4 mr-2" />
              Record
            </TabsTrigger>
            <TabsTrigger value="upload">
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="mt-4">
            <AudioRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              onError={setError}
              disabled={isProcessing}
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Supported formats: MP3, WAV, M4A, WEBM
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-2 bg-red-50 text-red-600 rounded text-sm">
            {error}
          </div>
        )}

        {isProcessing && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Processing voice note...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 