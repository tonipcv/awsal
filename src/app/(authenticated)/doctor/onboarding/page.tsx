"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  PlusIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { toast } from "sonner";

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
  isActive: boolean;
  isPublic: boolean;
  steps: OnboardingStep[];
  _count?: {
    responses: number;
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "templates">("all");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [shareLink, setShareLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/onboarding/templates");
        if (!response.ok) {
          throw new Error("Erro ao buscar templates");
        }
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error("Erro ao buscar templates:", error);
        toast.error("Erro ao carregar templates");
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

    fetchTemplates();
    fetchPatients();
  }, []);

  const handleShowShareDialog = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedPatientId("");
    setShareLink("");
    setShowShareDialog(true);
  };

  const handleGenerateLink = async () => {
    try {
      if (!selectedPatientId) {
        toast.error("Please select a patient");
        return;
      }

      if (!selectedTemplateId) {
        toast.error("Template ID is required");
        return;
      }

      setIsGeneratingLink(true);
      const response = await fetch("/api/onboarding/generate-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          templateId: selectedTemplateId,
          patientId: selectedPatientId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error generating link");
      }

      const data = await response.json();
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

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === "all" || 
                         (filter === "templates" && template.isPublic) ||
                         (filter === "active" && template.isActive);

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-100 rounded-xl w-28 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-xl w-36 animate-pulse"></div>
              </div>
            </div>

            {/* Search and Filters Skeleton */}
            <Card className="mb-6 bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-10 bg-gray-100 rounded-xl w-16 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-xl w-16 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Templates List Skeleton */}
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                          <div className="h-6 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-gray-100 rounded w-96 animate-pulse"></div>
                        <div className="flex items-center gap-6">
                          <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                          <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Onboarding
              </h1>
              <p className="text-gray-600 font-medium">
                Gerencie seus formulários de onboarding para novos pacientes
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                asChild
                variant="outline"
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl px-6 shadow-md font-semibold"
                onClick={() => router.push("/doctor/onboarding/responses")}
              >
                <div>
                  <DocumentTextIcon className="h-4 w-4 mr-2 inline" />
                  Respostas
                </div>
              </Button>
              <Button 
                asChild
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
                onClick={() => router.push("/doctor/onboarding/new")}
              >
                <div>
                  <PlusIcon className="h-4 w-4 mr-2 inline" />
                  Novo Formulário
                </div>
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar formulários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className={filter === "all" 
                      ? "bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold" 
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                    }
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("active")}
                    className={filter === "active" 
                      ? "bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold" 
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                    }
                  >
                    Ativos
                  </Button>
                  <Button
                    variant={filter === "templates" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("templates")}
                    className={filter === "templates" 
                      ? "bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold" 
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                    }
                  >
                    Públicos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <div className="space-y-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
                        <div className="flex gap-2">
                          {template.isActive ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 rounded-lg px-2 py-1 text-xs font-medium">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-2 py-1 text-xs font-medium">
                              Inativo
                            </Badge>
                          )}
                          {template.isPublic && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg px-2 py-1 text-xs font-medium">
                              Público
                            </Badge>
                          )}
                        </div>
                      </div>
                      {template.description && (
                        <p className="text-gray-600">{template.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4" />
                          {template.steps.length} {template.steps.length === 1 ? "pergunta" : "perguntas"}
                        </div>
                        {template._count && (
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4" />
                            {template._count.responses} {template._count.responses === 1 ? "resposta" : "respostas"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShowShareDialog(template.id)}
                        className="h-8 w-8 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push(`/doctor/onboarding/${template.id}`)}
                        className="h-8 w-8 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredTemplates.length === 0 && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-8">
                  <div className="text-center">
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum formulário encontrado</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Comece criando seu primeiro formulário de onboarding
                    </p>
                    <div className="mt-6">
                      <Button
                        onClick={() => router.push("/doctor/onboarding/new")}
                        className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Novo Formulário
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
                        onClick={handleCopyLink}
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
      </div>
    </div>
  );
} 