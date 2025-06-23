"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface OnboardingStep {
  id: string;
  question: string;
  description?: string;
  type: string;
  options: string[];
  required: boolean;
  order: number;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  steps: OnboardingStep[];
  clinicLogo?: string;
  clinicName?: string;
  welcomeTitle?: string;
  welcomeDescription?: string;
  welcomeVideoUrl?: string;
  estimatedTime?: number;
  welcomeItems?: string[];
  welcomeButtonText?: string;
  successTitle?: string;
  successDescription?: string;
  successVideoUrl?: string;
  successButtonText?: string;
  successButtonUrl?: string;
  nextSteps?: string[];
  contactEmail?: string;
  contactPhone?: string;
}

export default function OnboardingPage() {
  const { token } = useParams();
  const [template, setTemplate] = useState<OnboardingTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("welcome");

  // Calcula o currentStepData com base no currentStep
  const currentStepData = currentStep === 0 ? null : template?.steps[currentStep - 1];

  // Calcula o progresso
  const progress = ((currentStep + 1) / ((template?.steps.length || 0) + 1)) * 100;

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/onboarding/${token}`);
        if (!response.ok) {
          throw new Error("Error loading form");
        }
        const data = await response.json();
        setTemplate(data);
      } catch (error) {
        console.error("Error loading form:", error);
        toast.error("Error loading form");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [token]);

  const handleAnswer = (stepId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [stepId]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      console.log('Current step:', currentStep);
      console.log('Total steps:', template?.steps.length);
      console.log('Current answers:', answers);
      console.log('Required steps:', template?.steps.filter(step => step.required));

      // Validate email
      if (!email.trim()) {
        toast.error("Email is required");
        return;
      }

      // Se não estiver no último passo, apenas avança
      if (currentStep < template!.steps.length) {
        setCurrentStep((prev) => prev + 1);
        return;
      }

      // Validate required answers
      const requiredSteps = template?.steps.filter(step => step.required) || [];
      console.log('Required steps:', requiredSteps);

      const missingRequired = requiredSteps.find(step => {
        const answer = answers[step.id];
        const isMissing = !answer || answer.trim() === '';
        console.log(`Step ${step.id}:`, { answer, isMissing });
        return isMissing;
      });

      if (missingRequired) {
        console.log('Missing answer for:', missingRequired);
        toast.error("Please answer all required questions");
        return;
      }

      // Submit answers
      const response = await fetch(`/api/onboarding/${token}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          answers: Object.entries(answers).map(([stepId, answer]) => ({
            stepId,
            answer,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Error submitting form");
      }

      // Mostrar tela de sucesso
      setCurrentScreen("success");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="border border-gray-800 rounded-3xl w-full overflow-hidden shadow-2xl" style={{ backgroundColor: '#101010' }}>
            {/* Clinic Logo Skeleton */}
            <div className="text-center pt-12 pb-8">
              <div className="flex justify-center items-center">
                <Skeleton className="w-20 h-20 rounded-xl bg-gray-800" />
              </div>
            </div>

            {/* Header Skeleton */}
            <div className="relative px-8">
              <div className="text-center mb-8">
                <Skeleton className="h-8 w-3/4 mx-auto bg-gray-800 rounded-lg mb-3" />
                <Skeleton className="h-4 w-2/4 mx-auto bg-gray-800 rounded-lg" />
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="px-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3 bg-gray-800 rounded-lg" />
                  <Skeleton className="h-12 w-full bg-gray-800 rounded-xl" />
                </div>

                <div className="flex justify-between pt-6">
                  <Skeleton className="h-12 w-28 bg-gray-800 rounded-xl" />
                  <Skeleton className="h-12 w-28 bg-gray-800 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Powered by Skeleton */}
            <div className="mt-12 py-4 px-8 border-t border-gray-800">
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="h-4 w-20 bg-gray-800 rounded-lg" />
                <Skeleton className="h-4 w-8 bg-gray-800 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="border border-gray-800 rounded-3xl w-full overflow-hidden shadow-2xl" style={{ backgroundColor: '#101010' }}>
            <div className="p-8 text-center">
              <h2 className="text-lg lg:text-2xl font-bold text-white mb-2">
                Form not found
              </h2>
              <p className="text-sm text-gray-400">
                This link may have expired or is no longer available.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="border border-gray-800 rounded-3xl w-full overflow-hidden shadow-2xl" style={{ backgroundColor: '#101010' }}>
          {/* Clinic Logo */}
          <div className="text-center pt-12 pb-8">
            <div className="flex justify-center items-center">
              {template?.clinicLogo ? (
                <div className="w-20 h-20 relative">
                  <Image
                    src={template.clinicLogo}
                    alt={`Logo ${template.clinicName || 'Clinic'}`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {template?.clinicName?.charAt(0).toUpperCase() || 'C'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Header */}
          <div className="relative px-8">
            {/* Progress Bar */}
            {template && (
              <div className="absolute -top-4 left-0 right-0 h-1 bg-gray-800">
                <div 
                  className="h-full bg-turquoise transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            
            <div className="text-center mb-8">
              <h2 className="text-lg lg:text-2xl font-bold text-white mb-2">
                {template?.name || 'Loading form...'}
              </h2>
              {template?.description && (
                <p className="text-sm text-gray-400">
                  {template.description}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-8">
            <div className="space-y-6">
              {currentScreen === "welcome" ? (
                <div className="space-y-8">
                  {/* Optional Welcome Video */}
                  {template.welcomeVideoUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                      <iframe
                        src={template.welcomeVideoUrl}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  )}
                  <div className="text-center">
                    {template.welcomeTitle && (
                      <h2 className="text-2xl font-bold text-white mb-4">
                        {template.welcomeTitle}
                      </h2>
                    )}
                    {template.welcomeDescription && (
                      <p className="text-gray-300 mb-6">
                        {template.welcomeDescription}
                      </p>
                    )}
                    {template.estimatedTime && (
                      <p className="text-gray-300">
                        This form will take approximately {template.estimatedTime} minutes to complete.
                      </p>
                    )}
                    {template.welcomeItems && template.welcomeItems.length > 0 && (
                      <>
                        <p className="text-gray-300 mt-4">Please have the following information ready:</p>
                        <ul className="mt-4 space-y-2 text-gray-400">
                          {template.welcomeItems.map((item, index) => (
                            <li key={index}>• {item}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <div className="flex justify-center pt-6">
                    <Button
                      onClick={() => setCurrentScreen("form")}
                      className="h-12 px-6 bg-turquoise hover:bg-turquoise/90 text-black shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-[1.02] rounded-xl font-semibold transition-all duration-200"
                    >
                      {template.welcomeButtonText || "Start Form"}
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </div>
              ) : currentScreen === "success" ? (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-turquoise/10 rounded-full flex items-center justify-center mb-6">
                      <CheckIcon className="h-8 w-8 text-turquoise" />
                    </div>
                    {/* Optional Success Video */}
                    {template.successVideoUrl && (
                      <div className="aspect-video rounded-xl overflow-hidden bg-gray-900 mb-6">
                        <iframe
                          src={template.successVideoUrl}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    )}
                    <p className="text-gray-300">
                      {template.successDescription || 
                      "We have received your information and will review it shortly. If we need any additional information, we will contact you at the email address provided."}
                    </p>
                    {template.nextSteps?.length ? (
                      <div className="mt-6">
                        <h3 className="text-white font-semibold mb-3">Next Steps:</h3>
                        <ul className="space-y-2 text-gray-400">
                          {template.nextSteps.map((step, index) => (
                            <li key={index}>• {step}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="mt-6 p-4 rounded-xl bg-gray-800/50">
                      <p className="text-sm text-gray-400">
                        For any questions or concerns, please contact us:
                        {template.contactEmail && (
                          <div className="mt-2">
                            <a href={`mailto:${template.contactEmail}`} className="text-turquoise hover:underline flex items-center justify-center gap-2">
                              <span className="i-heroicons-envelope-20-solid" />
                              {template.contactEmail}
                            </a>
                          </div>
                        )}
                        {template.contactPhone && (
                          <div className="mt-2">
                            <a href={`tel:${template.contactPhone}`} className="text-turquoise hover:underline flex items-center justify-center gap-2">
                              <span className="i-heroicons-phone-20-solid" />
                              {template.contactPhone}
                            </a>
                          </div>
                        )}
                      </p>
                    </div>
                    {/* Optional Success Button */}
                    {template.successButtonText && template.successButtonUrl && (
                      <div className="mt-6">
                        <Button
                          onClick={() => window.location.href = template.successButtonUrl!}
                          className="h-12 px-6 bg-turquoise hover:bg-turquoise/90 text-black shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-[1.02] rounded-xl font-semibold transition-all duration-200"
                        >
                          {template.successButtonText}
                          <ArrowRightIcon className="h-5 w-5 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <Label htmlFor="email" className="text-lg font-semibold text-white">
                        What's your email?
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email"
                        required
                        className="h-12 text-lg bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-turquoise focus:ring-turquoise rounded-xl"
                      />
                    </div>
                  )}

                  {currentStep > 0 && currentStepData && (
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-white">
                        {currentStepData.question}
                        {currentStepData.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {currentStepData.description && (
                        <p className="text-sm text-gray-400">
                          {currentStepData.description}
                        </p>
                      )}

                      {currentStepData.type === "text" && (
                        <Input
                          value={answers[currentStepData.id] || ""}
                          onChange={(e) =>
                            handleAnswer(currentStepData.id, e.target.value)
                          }
                          placeholder="Your answer"
                          className="h-12 text-lg bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-turquoise focus:ring-turquoise rounded-xl"
                        />
                      )}

                      {currentStepData.type === "textarea" && (
                        <Textarea
                          value={answers[currentStepData.id] || ""}
                          onChange={(e) =>
                            handleAnswer(currentStepData.id, e.target.value)
                          }
                          placeholder="Your answer"
                          className="min-h-[120px] text-lg bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-turquoise focus:ring-turquoise rounded-xl"
                        />
                      )}

                      {(currentStepData.type === "multiple-choice" ||
                        currentStepData.type === "checkbox") && (
                        <RadioGroup
                          value={answers[currentStepData.id] || ""}
                          onValueChange={(value: string) =>
                            handleAnswer(currentStepData.id, value)
                          }
                          className="space-y-3"
                        >
                          {currentStepData.options.map((option) => (
                            <div
                              key={option}
                              className={cn(
                                "flex items-center rounded-xl border border-gray-700 p-4 transition-all duration-300",
                                "hover:bg-gray-800/50",
                                answers[currentStepData.id] === option && "border-turquoise bg-turquoise/10"
                              )}
                            >
                              <RadioGroupItem
                                value={option}
                                id={option}
                                className="border-gray-600 text-turquoise"
                              />
                              <Label
                                htmlFor={option}
                                className="flex-1 cursor-pointer pl-3 text-lg font-medium text-white"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep((prev) => prev - 1)}
                      disabled={currentStep === 0}
                      className="h-12 px-6 bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl font-semibold"
                    >
                      <ArrowLeftIcon className="h-5 w-5 mr-2" />
                      Previous
                    </Button>

                    {currentStep === template?.steps.length ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={cn(
                          "h-12 px-6 rounded-xl font-semibold transition-all duration-200",
                          isSubmitting
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-turquoise hover:bg-turquoise/90 text-black shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-[1.02]"
                        )}
                      >
                        {isSubmitting ? (
                          "Submitting..."
                        ) : (
                          <>
                            <CheckIcon className="h-5 w-5 mr-2" />
                            Submit
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          // Se for o passo do email, valida antes de avançar
                          if (currentStep === 0) {
                            if (!email.trim()) {
                              toast.error("Email is required");
                              return;
                            }
                          }
                          // Se for um passo normal, valida a resposta antes de avançar
                          else if (currentStepData?.required && (!answers[currentStepData.id] || answers[currentStepData.id].trim() === '')) {
                            toast.error("Please answer this question before proceeding");
                            return;
                          }
                          
                          // Se for o último passo, mostra o botão de submit
                          if (currentStep === template?.steps.length - 1) {
                            handleSubmit();
                            return;
                          }
                          
                          setCurrentStep((prev) => prev + 1);
                        }}
                        className="h-12 px-6 bg-turquoise hover:bg-turquoise/90 text-black shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-[1.02] rounded-xl font-semibold transition-all duration-200"
                      >
                        {currentStep === template?.steps.length - 1 ? (
                          <>
                            <CheckIcon className="h-5 w-5 mr-2" />
                            Submit
                          </>
                        ) : (
                          <>
                            Next
                            <ArrowRightIcon className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Powered by logo */}
          <div className="mt-12 py-4 px-8 border-t border-gray-800">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">Powered by</span>
              <Image
                src="/logo.png"
                alt="Sistema"
                width={32}
                height={10}
                className="object-contain opacity-60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for turquoise elements */}
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