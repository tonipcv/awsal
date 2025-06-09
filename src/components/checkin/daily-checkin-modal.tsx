'use client';

import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyCheckinQuestion {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT' | 'YES_NO';
  options?: string;
  isRequired: boolean;
  order: number;
}

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocolId: string;
  onSuccess?: () => void;
}

export default function DailyCheckinModal({ 
  isOpen, 
  onClose, 
  protocolId,
  onSuccess 
}: DailyCheckinModalProps) {
  const [questions, setQuestions] = useState<DailyCheckinQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Carregar perguntas quando o modal abrir
  useEffect(() => {
    if (isOpen && protocolId) {
      loadQuestions();
      loadExistingResponses();
    } else if (!isOpen) {
      // Limpar estados quando o modal fechar
      setQuestions([]);
      setResponses({});
      setError(null);
      setSuccess(false);
      setSuccessMessage('');
      setIsEditing(false);
      setCurrentQuestionIndex(0);
    }
  }, [isOpen, protocolId]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar perguntas');
      }
      
      setQuestions(data.questions || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingResponses = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/protocols/${protocolId}/checkin-responses?date=${today}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.responses && data.responses.length > 0) {
          // Converter respostas para o formato do estado
          const existingResponses: Record<string, string> = {};
          data.responses.forEach((resp: any) => {
            existingResponses[resp.questionId] = resp.answer;
          });
          setResponses(existingResponses);
          setIsEditing(true);
        } else {
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar respostas existentes:', error);
      setIsEditing(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Para perguntas de múltipla escolha e sim/não, avançar automaticamente
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && (currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'YES_NO')) {
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          goToNextQuestion();
        }
      }, 500); // Pequeno delay para mostrar a seleção
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const canProceedToNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return false;
    
    const hasResponse = responses[currentQuestion.id];
    return !currentQuestion.isRequired || (hasResponse && hasResponse.trim() !== '');
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validar respostas obrigatórias
      const requiredQuestions = questions.filter(q => q.isRequired);
      const missingResponses = requiredQuestions.filter(q => !responses[q.id]);
      
      if (missingResponses.length > 0) {
        setError('Please answer all required questions');
        return;
      }

      // Preparar dados para envio
      const submitData = {
        responses: Object.entries(responses).map(([questionId, answer]) => ({
          questionId,
          answer
        }))
      };

      const response = await fetch(`/api/protocols/${protocolId}/checkin-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error sending responses');
      }

      setSuccess(true);
      setSuccessMessage(data.message || 'Check-in completed successfully');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccess(false);
        setResponses({});
      }, 2000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = (question: DailyCheckinQuestion) => {
    const value = responses[question.id] || '';

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        const options = question.options ? JSON.parse(question.options) : [];
        return (
          <div className="space-y-3">
            {options.map((option: string, index: number) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all duration-200",
                    value === option 
                      ? "border-turquoise bg-turquoise" 
                      : "border-gray-400 group-hover:border-turquoise/60"
                  )}>
                    {value === option && (
                      <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </div>
                <span className="text-white font-medium">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'SCALE':
        const scaleOptions = question.options ? JSON.parse(question.options) : { min: 0, max: 10, step: 1 };
        const scaleValue = parseInt(value) || scaleOptions.min;
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-2xl lg:text-4xl font-bold text-turquoise mb-2">{scaleValue}</div>
              <div className="flex justify-between text-xs lg:text-sm text-gray-400 px-2">
                <span>{scaleOptions.min}</span>
                <span>{scaleOptions.max}</span>
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min={scaleOptions.min}
                max={scaleOptions.max}
                step={scaleOptions.step}
                value={scaleValue}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider-turquoise"
              />
            </div>
          </div>
        );

      case 'YES_NO':
        return (
          <div className="flex space-x-4">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer group flex-1">
                <div className="relative">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all duration-200",
                    value === option 
                      ? "border-turquoise bg-turquoise" 
                      : "border-gray-400 group-hover:border-turquoise/60"
                  )}>
                    {value === option && (
                      <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </div>
                <span className="text-white font-medium">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'TEXT':
        return (
          <textarea
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Type your answer..."
            className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-turquoise focus:border-turquoise resize-none transition-all duration-200"
            rows={4}
          />
        );

      default:
        return null;
    }
  };

  // Navegação por teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen || isLoading || success) return;
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (canProceedToNext()) {
          if (isLastQuestion) {
            handleSubmit();
          } else {
            goToNextQuestion();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, canProceedToNext, isLastQuestion, isLoading, success]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 border border-gray-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-8 pb-6">
          {/* Progress Bar */}
          {questions.length > 1 && !isLoading && !success && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
              <div 
                className="h-full bg-turquoise transition-all duration-300 ease-out"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg lg:text-2xl font-bold text-white mb-2">
              {isEditing ? 'Edit Check-in' : 'Daily Check-in'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 overflow-y-auto max-h-[calc(90vh-160px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-turquoise border-t-transparent"></div>
            </div>
          ) : success ? (
            <div className="text-center py-16">
              <h3 className="text-lg lg:text-2xl font-bold text-white mb-3">
                {isEditing ? 'Check-in Updated!' : 'Check-in Completed!'}
              </h3>
              <p className="text-sm lg:text-lg text-gray-400">
                {successMessage}
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg lg:text-2xl font-bold text-white mb-3">No questions found</h3>
              <p className="text-sm lg:text-lg text-gray-400">There are no check-in questions configured for this protocol.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Current Question */}
              {questions[currentQuestionIndex] && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-xs lg:text-sm text-turquoise font-semibold mb-4">
                      {currentQuestionIndex + 1} of {questions.length}
                    </div>
                    <h3 className="text-lg lg:text-2xl font-bold text-white leading-relaxed mb-6 lg:mb-8">
                      {questions[currentQuestionIndex].question}
                      {questions[currentQuestionIndex].isRequired && <span className="text-red-400 ml-1">*</span>}
                    </h3>
                  </div>
                  
                  <div className="mt-8">
                    {renderQuestionInput(questions[currentQuestionIndex])}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-800">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={cn(
                    "px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-semibold text-sm lg:text-base transition-all duration-200",
                    currentQuestionIndex === 0
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  )}
                >
                  ← Previous
                </button>

                {isLastQuestion ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceedToNext()}
                    className={cn(
                      "flex items-center justify-center gap-2 lg:gap-3 px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-lg transition-all duration-200",
                      isSubmitting || !canProceedToNext()
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-turquoise hover:bg-turquoise/90 text-black shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-[1.02]"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-2 border-gray-400 border-t-transparent"></div>
                        Sending...
                      </>
                    ) : (
                      isEditing ? "Update Check-in" : "Submit Check-in"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={goToNextQuestion}
                    disabled={!canProceedToNext()}
                    className={cn(
                      "px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-lg transition-all duration-200",
                      !canProceedToNext()
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-turquoise hover:bg-turquoise/90 text-black shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-[1.02]"
                    )}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 font-medium text-center">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for turquoise slider */}
      <style jsx>{`
        .slider-turquoise::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #40E0D0;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(64, 224, 208, 0.3);
          transition: all .2s ease-in-out;
        }
        
        .slider-turquoise::-webkit-slider-thumb:hover {
          background: #48E8D8;
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(64, 224, 208, 0.4);
        }
        
        .slider-turquoise::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #40E0D0;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 12px rgba(64, 224, 208, 0.3);
          transition: all .2s ease-in-out;
        }
        
        .slider-turquoise::-moz-range-thumb:hover {
          background: #48E8D8;
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(64, 224, 208, 0.4);
        }
        
        .slider-turquoise::-webkit-slider-track {
          background: linear-gradient(to right, #40E0D0 0%, #40E0D0 var(--value, 0%), #374151 var(--value, 0%), #374151 100%);
        }
      `}</style>
    </div>
  );
} 