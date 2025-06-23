"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from "sonner";

interface Step {
  question: string;
  description?: string;
  type: string;
  options: string[];
  required: boolean;
  order: number;
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        question: "",
        description: "",
        type: "text",
        options: [],
        required: true,
        order: prev.length,
      },
    ]);
  };

  const handleStepChange = (index: number, field: keyof Step, value: any) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    );
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
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

      const response = await fetch("/api/onboarding/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          steps,
          isPublic,
          isActive
        }),
      });

      if (!response.ok) {
        throw new Error("Error creating template");
      }

      toast.success("Template created successfully!");
      router.push("/doctor/onboarding");
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Error creating template");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  New Form
                </h1>
              </div>
              <p className="text-gray-600 font-medium">
                Create a new onboarding form for your patients
              </p>
            </div>
            
            <div className="flex gap-3">
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
    </div>
  );
} 