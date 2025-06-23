"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";

interface Patient {
  id: string;
  name: string;
  email: string;
}

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
  isPublic: boolean;
  isActive: boolean;
  steps: OnboardingStep[];
  // Welcome screen
  welcomeTitle?: string;
  welcomeDescription?: string;
  welcomeVideoUrl?: string;
  welcomeButtonText?: string;
  // Success screen
  successTitle?: string;
  successDescription?: string;
  successVideoUrl?: string;
  successButtonText?: string;
  successButtonUrl?: string;
}

export default function TemplatePage() {
  const router = useRouter();
  const { templateId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [template, setTemplate] = useState<OnboardingTemplate | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  // Welcome screen states
  const [welcomeTitle, setWelcomeTitle] = useState("");
  const [welcomeDescription, setWelcomeDescription] = useState("");
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState("");
  const [welcomeButtonText, setWelcomeButtonText] = useState("");
  // Success screen states
  const [successTitle, setSuccessTitle] = useState("");
  const [successDescription, setSuccessDescription] = useState("");
  const [successVideoUrl, setSuccessVideoUrl] = useState("");
  const [successButtonText, setSuccessButtonText] = useState("");
  const [successButtonUrl, setSuccessButtonUrl] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/onboarding/templates/${templateId}`);
        if (!response.ok) {
          throw new Error("Error loading template");
        }
        const data = await response.json();
        setTemplate(data);
        setName(data.name);
        setDescription(data.description || "");
        setIsPublic(data.isPublic);
        setIsActive(data.isActive);
        setSteps(data.steps);
        // Set welcome screen data
        setWelcomeTitle(data.welcomeTitle || "");
        setWelcomeDescription(data.welcomeDescription || "");
        setWelcomeVideoUrl(data.welcomeVideoUrl || "");
        setWelcomeButtonText(data.welcomeButtonText || "");
        // Set success screen data
        setSuccessTitle(data.successTitle || "");
        setSuccessDescription(data.successDescription || "");
        setSuccessVideoUrl(data.successVideoUrl || "");
        setSuccessButtonText(data.successButtonText || "");
        setSuccessButtonUrl(data.successButtonUrl || "");
      } catch (error) {
        console.error("Error loading template:", error);
        toast.error("Error loading template");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/patients');
        if (!response.ok) {
          throw new Error("Error loading patients");
        }
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        console.error("Error loading patients:", error);
        toast.error("Error loading patients");
      }
    };

    fetchTemplate();
    fetchPatients();
  }, [templateId]);

  const handleStepChange = (index: number, field: keyof OnboardingStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value,
    };
    setSteps(newSteps);
  };

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        id: Math.random().toString(36).substr(2, 9),
        question: "",
        description: "",
        type: "text",
        options: [],
        required: false,
        order: steps.length,
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!name.trim()) {
        toast.error("Name is required");
        return;
      }

      if (steps.length === 0) {
        toast.error("Add at least one question");
        return;
      }

      // Validate if all questions have a title
      const invalidStep = steps.find((step) => !step.question.trim());
      if (invalidStep) {
        toast.error("All questions must have a title");
        return;
      }

      const response = await fetch(`/api/onboarding/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          steps,
          isPublic,
          isActive,
          // Welcome screen data
          welcomeTitle,
          welcomeDescription,
          welcomeVideoUrl,
          welcomeButtonText,
          // Success screen data
          successTitle,
          successDescription,
          successVideoUrl,
          successButtonText,
          successButtonUrl
        }),
      });

      if (!response.ok) {
        throw new Error("Error updating template");
      }

      toast.success("Template updated successfully!");
      router.push("/doctor/onboarding");
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Error updating template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      if (!selectedPatientId) {
        toast.error("Please select a patient");
        return;
      }

      if (!templateId) {
        toast.error("Template ID is required");
        return;
      }

      const payload = {
        templateId: Array.isArray(templateId) ? templateId[0] : templateId,
        patientId: selectedPatientId
      };
      console.log("Sending payload:", payload);

      setIsGeneratingLink(true);
      const response = await fetch("/api/onboarding/generate-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        console.log("Error response:", data);
        throw new Error(data.error || "Error generating link");
      }

      const data = await response.json();
      console.log("Success response:", data);
      const link = `${window.location.origin}/onboarding/${data.token}`;
      setShareLink(link);
    } catch (error) {
      console.error("Error generating link:", error);
      toast.error(error instanceof Error ? error.message : "Error generating link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <Card>
              <CardHeader>
                <CardTitle>Template not found</CardTitle>
                <CardDescription>
                  This template may have been deleted or is no longer available.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="rounded-xl"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Edit Form
                </h1>
              </div>
              <p className="text-gray-600 font-medium">
                Update your onboarding form details and questions
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleGenerateLink}
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl px-6 shadow-md font-semibold"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl px-6 shadow-md font-semibold"
                onClick={() => router.back()}
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Info Card */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Basic Information</CardTitle>
                <CardDescription>
                  Define the name and description of your form
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Initial Assessment"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-700">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Form to collect initial patient information"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl min-h-[100px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-gray-900">Public Form</Label>
                      <p className="text-sm text-gray-500">
                        Other doctors can use this form
                      </p>
                    </div>
                    <Switch
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                      className="ml-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-gray-900">Active Form</Label>
                      <p className="text-sm text-gray-500">
                        The form will be available for use
                      </p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      className="ml-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Welcome Screen Card */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Welcome Screen</CardTitle>
                <CardDescription>
                  Customize the initial screen that patients will see
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcomeTitle" className="text-gray-700">Title</Label>
                    <Input
                      id="welcomeTitle"
                      value={welcomeTitle}
                      onChange={(e) => setWelcomeTitle(e.target.value)}
                      placeholder="Ex: Welcome to Our Clinic"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcomeDescription" className="text-gray-700">Description</Label>
                    <Textarea
                      id="welcomeDescription"
                      value={welcomeDescription}
                      onChange={(e) => setWelcomeDescription(e.target.value)}
                      placeholder="Ex: Please take a moment to complete this form..."
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcomeVideoUrl" className="text-gray-700">Video URL (optional)</Label>
                    <Input
                      id="welcomeVideoUrl"
                      value={welcomeVideoUrl}
                      onChange={(e) => setWelcomeVideoUrl(e.target.value)}
                      placeholder="Ex: https://youtube.com/embed/..."
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcomeButtonText" className="text-gray-700">Button Text</Label>
                    <Input
                      id="welcomeButtonText"
                      value={welcomeButtonText}
                      onChange={(e) => setWelcomeButtonText(e.target.value)}
                      placeholder="Ex: Start Form"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Screen Card */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Success Screen</CardTitle>
                <CardDescription>
                  Customize the screen shown after form submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="successTitle" className="text-gray-700">Title</Label>
                    <Input
                      id="successTitle"
                      value={successTitle}
                      onChange={(e) => setSuccessTitle(e.target.value)}
                      placeholder="Ex: Thank You!"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="successDescription" className="text-gray-700">Description</Label>
                    <Textarea
                      id="successDescription"
                      value={successDescription}
                      onChange={(e) => setSuccessDescription(e.target.value)}
                      placeholder="Ex: Your form has been submitted successfully..."
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="successVideoUrl" className="text-gray-700">Video URL (optional)</Label>
                    <Input
                      id="successVideoUrl"
                      value={successVideoUrl}
                      onChange={(e) => setSuccessVideoUrl(e.target.value)}
                      placeholder="Ex: https://youtube.com/embed/..."
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="successButtonText" className="text-gray-700">Button Text (optional)</Label>
                    <Input
                      id="successButtonText"
                      value={successButtonText}
                      onChange={(e) => setSuccessButtonText(e.target.value)}
                      placeholder="Ex: Go to Dashboard"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="successButtonUrl" className="text-gray-700">Button URL (optional)</Label>
                    <Input
                      id="successButtonUrl"
                      value={successButtonUrl}
                      onChange={(e) => setSuccessButtonUrl(e.target.value)}
                      placeholder="Ex: https://your-site.com/dashboard"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Card */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">Questions</CardTitle>
                    <CardDescription>
                      Add the questions that will be asked to patients
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleAddStep}
                    className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="p-6 border border-gray-200 rounded-xl space-y-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-gray-900">Question {index + 1}</Label>
                          {step.required && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 rounded-lg px-2 py-1 text-xs font-medium">
                              Required
                            </Badge>
                          )}
                        </div>
                        <Input
                          value={step.question}
                          onChange={(e) =>
                            handleStepChange(index, "question", e.target.value)
                          }
                          placeholder="Ex: What is your age?"
                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveStep(index)}
                        className="h-8 w-8 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl ml-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">Description (optional)</Label>
                      <Input
                        value={step.description}
                        onChange={(e) =>
                          handleStepChange(index, "description", e.target.value)
                        }
                        placeholder="Ex: Enter your age in complete years"
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700">Answer Type</Label>
                        <Select
                          value={step.type}
                          onValueChange={(value) =>
                            handleStepChange(index, "type", value)
                          }
                        >
                          <SelectTrigger className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Short Text</SelectItem>
                            <SelectItem value="textarea">Long Text</SelectItem>
                            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                            <SelectItem value="checkbox">Checkboxes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700">Required</Label>
                        <div className="flex items-center h-10">
                          <Switch
                            checked={step.required}
                            onCheckedChange={(checked) =>
                              handleStepChange(index, "required", checked)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {(step.type === "multiple-choice" || step.type === "checkbox") && (
                      <div className="space-y-2">
                        <Label className="text-gray-700">Options</Label>
                        <div className="space-y-2">
                          {step.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...step.options];
                                  newOptions[optionIndex] = e.target.value;
                                  handleStepChange(index, "options", newOptions);
                                }}
                                placeholder={`Option ${optionIndex + 1}`}
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const newOptions = step.options.filter(
                                    (_, i) => i !== optionIndex
                                  );
                                  handleStepChange(index, "options", newOptions);
                                }}
                                className="h-10 w-10 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            onClick={() => {
                              const newOptions = [...step.options, ""];
                              handleStepChange(index, "options", newOptions);
                            }}
                            className="w-full border-dashed border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {steps.length === 0 && (
                  <div className="text-center py-12">
                    <InformationCircleIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start by adding the first question to your form
                    </p>
                    <div className="mt-6">
                      <Button
                        onClick={handleAddStep}
                        className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        New Question
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Share Link Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Form</DialogTitle>
            <DialogDescription>
              Select a patient and generate a unique form link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Select Patient</Label>
              <Select
                value={selectedPatientId}
                onValueChange={setSelectedPatientId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!shareLink ? (
              <Button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink || !selectedPatientId}
                className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold"
              >
                {isGeneratingLink ? "Generating..." : "Generate Link"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      toast.success("Link copied to clipboard!");
                    }}
                    className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 