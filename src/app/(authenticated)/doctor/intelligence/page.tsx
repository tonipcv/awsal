'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import jsPDF from 'jspdf';

interface PatientOpportunity {
  id: string;
  name: string;
  email: string;
  status: 'READY_FOR_UPSELL' | 'HIGH_ENGAGEMENT' | 'NEEDS_ATTENTION' | 'NEW_PATIENT';
  completionRate: number;
  engagementScore: number;
  lastActivity: string;
  upsellPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
}

interface IntelligenceStats {
  totalPatients: number;
  readyForUpsell: number;
  highEngagement: number;
  avgCompletion: number;
  revenueOpportunity: number;
  successfulUpsells: number;
}

export default function IntelligenceDashboard() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<PatientOpportunity[]>([]);
  const [stats, setStats] = useState<IntelligenceStats>({
    totalPatients: 0,
    readyForUpsell: 0,
    highEngagement: 0,
    avgCompletion: 0,
    revenueOpportunity: 0,
    successfulUpsells: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    loadIntelligenceData();
  }, []);

  const loadIntelligenceData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockPatients: PatientOpportunity[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          status: 'READY_FOR_UPSELL',
          completionRate: 95,
          engagementScore: 92,
          lastActivity: 'Today',
          upsellPotential: 'HIGH',
          recommendedAction: 'Offer premium protocol'
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael.c@email.com',
          status: 'HIGH_ENGAGEMENT',
          completionRate: 88,
          engagementScore: 85,
          lastActivity: '1 day ago',
          upsellPotential: 'HIGH',
          recommendedAction: 'Schedule consultation'
        },
        {
          id: '3',
          name: 'Emma Davis',
          email: 'emma.d@email.com',
          status: 'READY_FOR_UPSELL',
          completionRate: 92,
          engagementScore: 89,
          lastActivity: 'Today',
          upsellPotential: 'MEDIUM',
          recommendedAction: 'Present upgrade options'
        },
        {
          id: '4',
          name: 'James Wilson',
          email: 'james.w@email.com',
          status: 'HIGH_ENGAGEMENT',
          completionRate: 78,
          engagementScore: 82,
          lastActivity: '2 days ago',
          upsellPotential: 'MEDIUM',
          recommendedAction: 'Send personalized content'
        },
        {
          id: '5',
          name: 'Lisa Anderson',
          email: 'lisa.a@email.com',
          status: 'NEEDS_ATTENTION',
          completionRate: 45,
          engagementScore: 38,
          lastActivity: '5 days ago',
          upsellPotential: 'LOW',
          recommendedAction: 'Re-engagement campaign'
        }
      ];

      const mockStats: IntelligenceStats = {
        totalPatients: 24,
        readyForUpsell: 8,
        highEngagement: 15,
        avgCompletion: 82,
        revenueOpportunity: 12500,
        successfulUpsells: 5
      };

      setPatients(mockPatients);
      setStats(mockStats);
      
    } catch (error) {
      console.error('Error loading intelligence data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      let yPosition = margin;
      
      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };
      
      // Header
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Intelligence Dashboard Report', margin, yPosition);
      yPosition += 20;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, margin, yPosition);
      yPosition += 25;
      
      // Key Metrics Section
      checkNewPage(80);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Metrics', margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const metrics = [
        `Total Patients: ${stats.totalPatients}`,
        `Ready for Upsell: ${stats.readyForUpsell}`,
        `High Engagement: ${stats.highEngagement}`,
        `Revenue Opportunity: $${stats.revenueOpportunity.toLocaleString()}`,
        `Successful Upsells: ${stats.successfulUpsells}`,
        `Average Completion: ${stats.avgCompletion}%`
      ];
      
      metrics.forEach(metric => {
        pdf.text(`• ${metric}`, margin + 5, yPosition);
        yPosition += 10;
      });
      
      yPosition += 15;
      
      // Performance Metrics Section
      checkNewPage(80);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Performance Metrics', margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const performanceMetrics = [
        'Retention: 89% (+34%)',
        'Support Time: 12h (-40%)',
        'Reviews: 156 (+200%)',
        'Referrals: 48 (+3x)'
      ];
      
      performanceMetrics.forEach(metric => {
        pdf.text(`• ${metric}`, margin + 5, yPosition);
        yPosition += 10;
      });
      
      yPosition += 20;
      
      // Patient Opportunities Section
      checkNewPage(100);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Patient Opportunities', margin, yPosition);
      yPosition += 15;
      
      // Get current filtered patients
      const currentFilteredPatients = selectedFilter === 'ALL' 
        ? patients 
        : patients.filter(p => p.status === selectedFilter);
      
      if (currentFilteredPatients.length > 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        // Table headers
        const headers = ['Name', 'Status', 'Completion', 'Engagement', 'Potential'];
        const colWidths = [45, 40, 25, 25, 30];
        let xPosition = margin;
        
        headers.forEach((header, index) => {
          pdf.text(header, xPosition, yPosition);
          xPosition += colWidths[index];
        });
        yPosition += 8;
        
        // Draw line under headers
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
        
        pdf.setFont('helvetica', 'normal');
        
        // Patient data (limit to 8 patients to avoid overflow)
        currentFilteredPatients.slice(0, 8).forEach(patient => {
          checkNewPage(15);
          
          xPosition = margin;
          const rowData = [
            patient.name.length > 15 ? patient.name.substring(0, 15) + '...' : patient.name,
            patient.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            `${patient.completionRate}%`,
            `${patient.engagementScore}`,
            patient.upsellPotential
          ];
          
          rowData.forEach((data, index) => {
            pdf.text(data, xPosition, yPosition);
            xPosition += colWidths[index];
          });
          yPosition += 10;
        });
        
        if (currentFilteredPatients.length > 8) {
          yPosition += 5;
          pdf.setFont('helvetica', 'italic');
          pdf.text(`... and ${currentFilteredPatients.length - 8} more patients`, margin, yPosition);
        }
      } else {
        pdf.setFont('helvetica', 'italic');
        pdf.text('No patients match the current filter.', margin, yPosition);
      }
      
      yPosition += 20;
      
      // Growth Trends Section
      checkNewPage(60);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Growth Trends', margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const growthTrends = [
        'Patient Retention: +12%',
        'Upsell Conversion: +8%',
        'Engagement Rate: +15%'
      ];
      
      growthTrends.forEach(trend => {
        pdf.text(`• ${trend}`, margin + 5, yPosition);
        yPosition += 10;
      });
      
      // Footer on all pages
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Page ${i} of ${totalPages} - Intelligence Dashboard Report`,
          margin,
          pageHeight - 10
        );
      }
      
      // Save the PDF
      const fileName = `intelligence-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      // Show success message
      alert('PDF report generated successfully!');
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      READY_FOR_UPSELL: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Ready for Upsell' },
      HIGH_ENGAGEMENT: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'High Engagement' },
      NEEDS_ATTENTION: { color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Needs Attention' },
      NEW_PATIENT: { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', label: 'New Patient' }
    };
    const config = configs[status as keyof typeof configs];
    return <Badge className={`${config.color} text-xs font-semibold border`}>{config.label}</Badge>;
  };

  const getUpsellBadge = (potential: string) => {
    const configs = {
      HIGH: { color: 'bg-emerald-100 text-emerald-700', label: 'High Potential' },
      MEDIUM: { color: 'bg-blue-100 text-blue-700', label: 'Medium Potential' },
      LOW: { color: 'bg-slate-100 text-slate-700', label: 'Low Potential' }
    };
    const config = configs[potential as keyof typeof configs];
    return <Badge className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
  };

  const getPatientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredPatients = selectedFilter === 'ALL' 
    ? patients 
    : patients.filter(p => p.status === selectedFilter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div className="h-96 bg-gray-100 rounded-2xl"></div>
                <div className="h-96 bg-gray-100 rounded-2xl"></div>
              </div>
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="space-y-1 lg:space-y-2">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Intelligence Dashboard
              </h1>
              <p className="text-sm lg:text-base text-gray-600 font-medium">
                Patient opportunities and growth insights
              </p>
            </div>
            
            <div className="flex gap-2 lg:gap-3">
              <Button 
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-4 lg:px-6 shadow-md font-semibold text-sm lg:text-base"
                onClick={generateReport}
                disabled={isGeneratingReport}
              >
                <SparklesIcon className="h-4 w-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </span>
                <span className="sm:hidden">
                  {isGeneratingReport ? 'Generating...' : 'Report'}
                </span>
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
            <Card className="bg-white border-blue-200 shadow-lg rounded-2xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="p-2 lg:p-3 bg-blue-100 rounded-xl">
                    <UserGroupIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs lg:text-sm text-gray-500 font-semibold">Total Patients</p>
                    <p className="text-xl lg:text-2xl font-bold text-blue-600">{stats.totalPatients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-emerald-200 shadow-lg rounded-2xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="p-2 lg:p-3 bg-emerald-100 rounded-xl">
                    <TrophyIcon className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs lg:text-sm text-gray-500 font-semibold">Ready for Upsell</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl lg:text-2xl font-bold text-emerald-600">{stats.readyForUpsell}</p>
                      <div className="flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-3 w-3 lg:h-4 lg:w-4 text-emerald-600" />
                        <span className="text-xs lg:text-sm font-semibold text-emerald-600">+25%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-cyan-200 shadow-lg rounded-2xl">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="p-2 lg:p-3 bg-cyan-100 rounded-xl">
                    <CurrencyDollarIcon className="h-5 w-5 lg:h-6 lg:w-6 text-cyan-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs lg:text-sm text-gray-500 font-semibold">Revenue Opportunity</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl lg:text-2xl font-bold text-cyan-600">${stats.revenueOpportunity.toLocaleString()}</p>
                      <div className="flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-3 w-3 lg:h-4 lg:w-4 text-emerald-600" />
                        <span className="text-xs lg:text-sm font-semibold text-emerald-600">+18%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Filter */}
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'READY_FOR_UPSELL', 'HIGH_ENGAGEMENT', 'NEEDS_ATTENTION'].map((status) => (
                <Button
                  key={status}
                  variant={selectedFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(status)}
                  className={`rounded-xl text-xs lg:text-sm ${
                    selectedFilter === status 
                      ? 'bg-[#5154e7] text-white hover:bg-[#4145d1]' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status === 'ALL' ? 'All Patients' : 
                   status === 'READY_FOR_UPSELL' ? 'Ready for Upsell' :
                   status === 'HIGH_ENGAGEMENT' ? 'High Engagement' : 'Needs Attention'}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Patient Opportunities */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between p-4 lg:p-6 pb-3 lg:pb-4">
                <CardTitle className="text-base lg:text-lg font-bold text-gray-900">Patient Opportunities</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-xs lg:text-sm"
                  asChild
                >
                  <Link href="/doctor/intelligence/patients">
                    View all
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0">
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-8 lg:py-12">
                    <CheckCircleIcon className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-3 lg:mb-4" />
                    <p className="text-gray-500 mb-3 lg:mb-4 font-medium text-sm lg:text-base">No patients match this filter</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPatients.slice(0, 3).map((patient) => (
                      <div key={patient.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                              {getPatientInitials(patient.name)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{patient.name}</p>
                              <p className="text-sm text-gray-500">{patient.lastActivity}</p>
                            </div>
                          </div>
                          {getStatusBadge(patient.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Completion Rate</p>
                            <div className="flex items-center gap-2">
                              <Progress value={patient.completionRate} className="flex-1 h-2" />
                              <span className="text-sm font-semibold text-gray-700">{patient.completionRate}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Engagement Score</p>
                            <div className="flex items-center gap-2">
                              <Progress value={patient.engagementScore} className="flex-1 h-2" />
                              <span className="text-sm font-semibold text-gray-700">{patient.engagementScore}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {getUpsellBadge(patient.upsellPotential)}
                          <p className="text-xs text-gray-600 font-medium">{patient.recommendedAction}</p>
                        </div>
                      </div>
                    ))}
                    
                    {filteredPatients.length > 3 && (
                      <div className="text-center pt-2">
                        <p className="text-sm text-gray-500">
                          Showing 3 of {filteredPatients.length} patients
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="p-4 lg:p-6 pb-3 lg:pb-4">
                <CardTitle className="text-base lg:text-lg font-bold text-gray-900">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6 pt-0 space-y-6">
                
                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">{stats.highEngagement}</p>
                    <p className="text-sm text-gray-600 font-medium">High Engagement</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-xl">
                    <p className="text-2xl font-bold text-emerald-600">{stats.successfulUpsells}</p>
                    <p className="text-sm text-gray-600 font-medium">Successful Upsells</p>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-700">Average Completion Rate</p>
                    <p className="text-sm font-bold text-gray-900">{stats.avgCompletion}%</p>
                  </div>
                  <Progress value={stats.avgCompletion} className="h-3" />
                </div>

                {/* Key Performance Metrics */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">Key Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">Retention</span>
                        <div className="flex items-center gap-1">
                          <ArrowTrendingUpIcon className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-600">+34%</span>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-emerald-700 mt-1">89%</p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">Support Time</span>
                        <div className="flex items-center gap-1">
                          <ArrowTrendingDownIcon className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-600">-40%</span>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-blue-700 mt-1">12h</p>
                    </div>
                    
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">Reviews</span>
                        <div className="flex items-center gap-1">
                          <ArrowTrendingUpIcon className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-600">+200%</span>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-emerald-700 mt-1">156</p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">Referrals</span>
                        <div className="flex items-center gap-1">
                          <ArrowTrendingUpIcon className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-600">+3x</span>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-blue-700 mt-1">48</p>
                    </div>
                  </div>
                </div>

                {/* Growth Metrics */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">Growth Trends</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Patient Retention</span>
                      <div className="flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-600">+12%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Upsell Conversion</span>
                      <div className="flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-600">+8%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Engagement Rate</span>
                      <div className="flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-600">+15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-6 lg:mt-8 bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="p-4 lg:p-6 pb-3 lg:pb-4">
              <CardTitle className="text-base lg:text-lg font-bold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6 pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 lg:h-24 flex-col gap-2 lg:gap-3 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-400 rounded-2xl shadow-md font-semibold text-xs lg:text-sm"
                >
                  <TrophyIcon className="h-6 w-6 lg:h-8 lg:w-8" />
                  <span>Send Upsell Offers</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 lg:h-24 flex-col gap-2 lg:gap-3 border-blue-300 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400 rounded-2xl shadow-md font-semibold text-xs lg:text-sm"
                >
                  <ChartBarIcon className="h-6 w-6 lg:h-8 lg:w-8" />
                  <span>View Analytics</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 lg:h-24 flex-col gap-2 lg:gap-3 border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-400 rounded-2xl shadow-md font-semibold text-xs lg:text-sm"
                  asChild
                >
                  <Link href="/doctor/patients">
                    <EyeIcon className="h-6 w-6 lg:h-8 lg:w-8" />
                    <span>View Patients</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
} 