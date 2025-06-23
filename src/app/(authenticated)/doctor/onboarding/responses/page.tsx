"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeftIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";

interface OnboardingTemplate {
  id: string;
  name: string;
  steps: {
    id: string;
    question: string;
  }[];
}

interface OnboardingAnswer {
  id: string;
  stepId: string;
  answer: string;
}

interface OnboardingResponse {
  id: string;
  email: string;
  status: "completed" | "pending";
  completedAt: string;
  updatedAt: string;
  template: OnboardingTemplate;
  answers: OnboardingAnswer[];
}

export default function ResponsesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [responses, setResponses] = useState<OnboardingResponse[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");
  const [selectedResponse, setSelectedResponse] = useState<OnboardingResponse | null>(null);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await fetch("/api/onboarding/responses");
        if (!response.ok) {
          throw new Error("Failed to fetch responses");
        }
        const data = await response.json();
        setResponses(data);
      } catch (error) {
        console.error("Error fetching responses:", error);
        toast.error("Failed to load responses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponses();
  }, []);

  const filteredResponses = responses.filter((response) => {
    const matchesSearch = search
      ? response.email.toLowerCase().includes(search.toLowerCase()) ||
        (response.template?.name || '').toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesStatus = status === "all" ? true : response.status === status;

    return matchesSearch && matchesStatus;
  });

  const handleViewResponse = (response: OnboardingResponse) => {
    setSelectedResponse(response);
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
                  Form Responses
                </h1>
              </div>
              <p className="text-gray-600 font-medium">
                View and manage all responses from your onboarding forms
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient email..."
                className="pl-10 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl"
              />
            </div>
            <Select value={status} onValueChange={(value) => setStatus(value as "all" | "completed" | "pending")}>
              <SelectTrigger className="w-[180px] border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Responses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredResponses.length > 0 ? (
              filteredResponses.map((response) => (
                <Card
                  key={response.id}
                  className="bg-white border-gray-200 shadow-lg rounded-2xl hover:border-gray-300 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <CardTitle className="text-base font-semibold text-gray-900">
                          {response.template.name}
                        </CardTitle>
                        <CardDescription>{response.email}</CardDescription>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-lg px-2 py-1",
                          response.status === "completed"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        )}
                      >
                        {response.status === "completed" ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Last update</span>
                        <span className="font-medium text-gray-900">
                          {format(new Date(response.updatedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Questions</span>
                        <span className="font-medium text-gray-900">
                          {response.answers?.length || 0} / {response.template?.steps?.length || 0}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
                        onClick={() => handleViewResponse(response)}
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <InformationCircleIcon className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No responses found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search || status !== "all"
                    ? "Try adjusting your search or filter settings"
                    : "Share your form link with patients to start receiving responses"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Response Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
            <DialogDescription>
              View the complete response for this form
            </DialogDescription>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700">Form</Label>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedResponse.template.name}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-700">Patient Email</Label>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedResponse.email}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-700">Status</Label>
                  <Badge
                    className={cn(
                      "mt-1 rounded-lg px-2 py-1",
                      selectedResponse.status === "completed"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    )}
                  >
                    {selectedResponse.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-700">Last Update</Label>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(selectedResponse.updatedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-gray-900">Answers</Label>
                {selectedResponse.answers.map((answer) => {
                  const step = selectedResponse.template?.steps?.find(
                    (s) => s.id === answer.stepId
                  );
                  return (
                    <div key={answer.id} className="space-y-2">
                      <Label className="text-gray-700">{step?.question || 'Question not found'}</Label>
                      <p className="text-sm text-gray-900">{answer.answer}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedResponse(null)}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 