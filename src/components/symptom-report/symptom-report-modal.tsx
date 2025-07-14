'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  MicrophoneIcon,
  PencilIcon,
  PhotoIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AudioRecorder from '@/components/audio-recorder/audio-recorder';
import Image from 'next/image';

interface SymptomReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocolId: string;
  dayNumber: number;
  onSuccess?: () => void;
}

export default function SymptomReportModal({
  isOpen,
  onClose,
  protocolId,
  dayNumber,
  onSuccess
}: SymptomReportModalProps) {
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState(1);
  const [isNow, setIsNow] = useState(true);
  const [customTime, setCustomTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'audio'>('text');
  const [images, setImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Validar cada arquivo
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        continue;
      }
      
      // Validar tamanho (20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('Image size must be less than 20MB');
        continue;
      }
      
      validFiles.push(file);
    }

    setImages(prev => [...prev, ...validFiles]);
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!symptoms.trim()) {
      setError('Please describe the symptoms.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Prepare report time
      let reportTime = new Date();
      if (!isNow && customTime) {
        const [hours, minutes] = customTime.split(':').map(Number);
        reportTime = new Date();
        reportTime.setHours(hours, minutes, 0, 0);
      }

      // Create symptom report
      const reportResponse = await fetch('/api/symptom-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolId,
          dayNumber,
          symptoms: symptoms.trim(),
          severity,
          reportTime: reportTime.toISOString(),
          isNow
        })
      });

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        throw new Error(errorData.error || 'Error creating report');
      }

      const report = await reportResponse.json();

      // Upload images if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const formData = new FormData();
          formData.append('file', images[i]);

          const uploadResponse = await fetch(`/api/symptom-reports/${report.id}/attachments`, {
            method: 'POST',
            body: formData
          });

          if (!uploadResponse.ok) {
            throw new Error('Error uploading image');
          }
        }
      }

      // Show success state
      setSuccess(true);
      
      // Reset form and close after delay
      setTimeout(() => {
        setSymptoms('');
        setSeverity(1);
        setIsNow(true);
        setCustomTime('');
        setSuccess(false);
        setInputMethod('text');
        setImages([]);
        setUploadProgress({});
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting symptom report:', error);
      setError(error instanceof Error ? error.message : 'Error sending report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAudioTranscription = (transcribedText: string) => {
    // Append to existing text or replace if empty
    if (symptoms.trim()) {
      setSymptoms(prev => prev + ' ' + transcribedText);
    } else {
      setSymptoms(transcribedText);
    }
    // Switch back to text mode to allow editing
    setInputMethod('text');
  };

  const handleAudioError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return format(now, 'HH:mm');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="border border-gray-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl" style={{ backgroundColor: '#101010' }}>
        {/* Header */}
        <div className="relative p-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg lg:text-2xl font-bold text-white mb-2">
              Symptom Report
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Day {dayNumber} • {format(new Date(), 'MM/dd/yyyy', { locale: enUS })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 overflow-y-auto max-h-[calc(90vh-160px)]">
          {success ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-6">
                <CheckCircleIcon className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-lg lg:text-2xl font-bold text-white mb-3">
                Report Submitted Successfully!
              </h3>
              <p className="text-sm lg:text-lg text-gray-400">
                Your symptom report has been sent to your doctor for review.
              </p>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {/* Input Method Toggle */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    How would you like to describe your symptoms? *
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setInputMethod('text')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                        inputMethod === 'text'
                          ? "bg-turquoise text-black"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      )}
                    >
                      <PencilIcon className="h-4 w-4" />
                      Type Text
                    </button>
                    <button
                      onClick={() => setInputMethod('audio')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                        inputMethod === 'audio'
                          ? "bg-turquoise text-black"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      )}
                    >
                      <MicrophoneIcon className="h-4 w-4" />
                      Record Audio
                    </button>
                  </div>
                </div>

                {/* Symptoms Description */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Describe your symptoms *
                  </label>
                  
                  {inputMethod === 'text' ? (
                    <div className="space-y-3">
                      <textarea
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="Describe in detail the symptoms you are experiencing..."
                        className="w-full h-32 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise resize-none transition-all duration-200"
                        maxLength={1000}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400">
                          {symptoms.length}/1000 characters
                        </p>
                        <button
                          onClick={() => setInputMethod('audio')}
                          className="text-xs text-turquoise hover:text-turquoise/80 transition-colors"
                        >
                          Switch to voice recording
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AudioRecorder
                        onTranscriptionComplete={handleAudioTranscription}
                        onError={handleAudioError}
                        disabled={isSubmitting}
                      />
                      
                      {symptoms && (
                        <div className="p-4 bg-gray-900/50 border border-gray-600 rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-white">
                              Transcribed Text:
                            </label>
                            <button
                              onClick={() => setInputMethod('text')}
                              className="text-xs text-turquoise hover:text-turquoise/80 transition-colors"
                            >
                              Edit text
                            </button>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {symptoms}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-center">
                        <button
                          onClick={() => setInputMethod('text')}
                          className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          Prefer typing? Switch to text input
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Severity Scale */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Symptom intensity (1-10)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSeverity(level)}
                        className={cn(
                          "w-8 h-8 rounded-full text-sm font-medium transition-all",
                          severity === level
                            ? level <= 3
                              ? "bg-green-500 text-white"
                              : level <= 6
                              ? "bg-yellow-500 text-black"
                              : "bg-red-500 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Mild</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    When did the symptoms occur?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="radio"
                          checked={isNow}
                          onChange={() => setIsNow(true)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all duration-200",
                          isNow 
                            ? "border-turquoise bg-turquoise" 
                            : "border-gray-400 hover:border-turquoise/60"
                        )}>
                          {isNow && (
                            <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </div>
                      <span className="text-white font-medium">Now ({getCurrentTime()})</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="radio"
                          checked={!isNow}
                          onChange={() => setIsNow(false)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all duration-200",
                          !isNow 
                            ? "border-turquoise bg-turquoise" 
                            : "border-gray-400 hover:border-turquoise/60"
                        )}>
                          {!isNow && (
                            <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </div>
                      <span className="text-white font-medium">Specific time</span>
                    </label>

                    {!isNow && (
                      <div className="ml-8">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-5 w-5 text-gray-400" />
                          <input
                            type="time"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise transition-all duration-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Add Images (Optional)
                  </label>
                  <div className="space-y-4">
                    {/* Image Preview Grid */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Symptom image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="flex items-center justify-center">
                      <label className="cursor-pointer group">
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                          <PhotoIcon className="h-5 w-5" />
                          <span className="font-medium">Add Images</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-8 border-t border-gray-800">
                  <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-semibold text-sm lg:text-base transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !symptoms.trim()}
                    className={cn(
                      "flex items-center justify-center gap-2 lg:gap-3 px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-lg transition-all duration-200",
                      isSubmitting || !symptoms.trim()
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-gray-400 to-gray-300 hover:from-gray-300 hover:to-gray-200 text-gray-900 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-2 border-gray-400 border-t-transparent"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 