'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  ExclamationTriangleIcon,
  PhotoIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SymptomReport {
  id: string;
  userId: string;
  protocolId: string;
  dayNumber: number;
  title: string;
  description?: string;
  symptoms: string;
  severity: number;
  reportTime: string;
  isNow: boolean;
  status: 'PENDING' | 'REVIEWED' | 'REQUIRES_ATTENTION' | 'RESOLVED';
  reviewedAt?: string;
  doctorNotes?: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email?: string;
  };
  protocol: {
    id: string;
    name: string;
    duration: number;
  };
  reviewer?: {
    id: string;
    name?: string;
    email?: string;
  };
  attachments: Array<{
    id: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
  }>;
}

export default function SymptomReportsPage() {
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SymptomReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED' | 'REQUIRES_ATTENTION'>('ALL');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/symptom-reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching symptom reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/symptom-reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, doctorNotes: notes })
      });

      if (response.ok) {
        fetchReports(); // Refresh the list
        setShowModal(false);
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-green-600 bg-green-50 border-green-200';
    if (severity <= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'REVIEWED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'REQUIRES_ATTENTION':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'RESOLVED':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'REVIEWED':
        return 'Reviewed';
      case 'REQUIRES_ATTENTION':
        return 'Requires Attention';
      case 'RESOLVED':
        return 'Resolved';
      default:
        return status;
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'ALL') return true;
    return report.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-[88px] pb-32 lg:pt-6 lg:pb-12 lg:ml-64">
          <div className="max-w-6xl mx-auto px-3 lg:px-6">
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-[88px] pb-32 lg:pt-6 lg:pb-12 lg:ml-64">
        <div className="max-w-6xl mx-auto px-3 lg:px-6">
          <div className="space-y-6 pt-4 lg:pt-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Symptom Reports
                </h1>
                <p className="text-gray-600">
                  Manage your patients' symptom reports
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'PENDING', label: 'Pending' },
                { key: 'REQUIRES_ATTENTION', label: 'Requires Attention' },
                { key: 'REVIEWED', label: 'Reviewed' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    filter === key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {filter === 'ALL' ? 'No reports found' : `No ${getStatusText(filter).toLowerCase()} reports found`}
                  </p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {report.user.name || report.user.email}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {report.protocol.name} • Day {report.dayNumber}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "px-3 py-1 rounded-lg border text-xs font-medium",
                          getSeverityColor(report.severity)
                        )}>
                          Intensity: {report.severity}/10
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-lg border text-xs font-medium",
                          getStatusColor(report.status)
                        )}>
                          {getStatusText(report.status)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700 line-clamp-3">
                        {report.symptoms}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {format(new Date(report.reportTime), 'MM/dd/yyyy HH:mm', { locale: enUS })}
                        </div>
                        {report.attachments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <PhotoIcon className="h-4 w-4" />
                            {report.attachments.length} photo(s)
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Symptom Report
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedReport.user.name || selectedReport.user.email} • {selectedReport.protocol.name}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protocol Day
                  </label>
                  <p className="text-gray-900">Day {selectedReport.dayNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intensity
                  </label>
                  <div className={cn(
                    "inline-flex px-3 py-1 rounded-lg border text-sm font-medium",
                    getSeverityColor(selectedReport.severity)
                  )}>
                    {selectedReport.severity}/10
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date/Time
                  </label>
                  <p className="text-gray-900">
                    {format(new Date(selectedReport.reportTime), 'MM/dd/yyyy HH:mm', { locale: enUS })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className={cn(
                    "inline-flex px-3 py-1 rounded-lg border text-sm font-medium",
                    getStatusColor(selectedReport.status)
                  )}>
                    {getStatusText(selectedReport.status)}
                  </div>
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptom Description
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedReport.symptoms}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {selectedReport.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attached Photos ({selectedReport.attachments.length})
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReport.attachments.map((attachment) => (
                      <div key={attachment.id} className="relative group">
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.originalName}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-blue-300"
                          >
                            <EyeIcon className="h-6 w-6" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Notes */}
              {selectedReport.doctorNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor Notes
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-900">
                      {selectedReport.doctorNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                Close
              </Button>
              
              {selectedReport.status === 'PENDING' && (
                <>
                  <Button
                    onClick={() => updateReportStatus(selectedReport.id, 'REQUIRES_ATTENTION')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    Requires Attention
                  </Button>
                  <Button
                    onClick={() => updateReportStatus(selectedReport.id, 'REVIEWED')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Mark as Reviewed
                  </Button>
                </>
              )}
              
              {selectedReport.status === 'REQUIRES_ATTENTION' && (
                <Button
                  onClick={() => updateReportStatus(selectedReport.id, 'RESOLVED')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 