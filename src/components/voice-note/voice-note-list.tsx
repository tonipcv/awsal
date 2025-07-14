'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PlayIcon,
  PauseIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface VoiceNoteListProps {
  voiceNotes: Array<{
    id: string;
    status: 'PROCESSING' | 'TRANSCRIBED' | 'ANALYZED' | 'ERROR';
    transcription?: string | null;
    summary?: string | null;
    createdAt: Date;
    checklist?: {
      items: Array<{
        title: string;
        description: string;
        type: 'exam' | 'medication' | 'referral' | 'followup';
        status: 'pending' | 'completed';
        dueDate?: string;
      }>;
    } | null;
  }>;
  onRefresh: () => void;
}

export default function VoiceNoteList({ voiceNotes, onRefresh }: VoiceNoteListProps) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [playingNote, setPlayingNote] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedNote(expandedNote === id ? null : id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voice note?')) {
      return;
    }

    try {
      setIsDeleting(id);
      const response = await fetch(`/api/voice-notes/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete voice note');
      }

      toast.success('Voice note deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting voice note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete voice note');
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return <Badge variant="secondary">Processing</Badge>;
      case 'TRANSCRIBED':
        return <Badge variant="default">Transcribed</Badge>;
      case 'ANALYZED':
        return <Badge variant="outline">Analyzed</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return <ArrowPathIcon className="h-5 w-5 animate-spin" />;
      case 'TRANSCRIBED':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'ANALYZED':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'ERROR':
        return <ExclamationCircleIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy HH:mm');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Voice Notes</CardTitle>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {voiceNotes.map((note) => (
              <Card key={note.id} className="cursor-pointer hover:bg-gray-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(note.status)}
                      <div>
                        <div className="font-medium">
                          Voice Note - {formatDate(note.createdAt)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {getStatusBadge(note.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(note.id)}
                    >
                      {expandedNote === note.id ? 'Hide' : 'Show'}
                    </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        disabled={isDeleting === note.id}
                        className="flex items-center gap-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {expandedNote === note.id && (
                    <div className="mt-4 space-y-4">
                      {note.transcription && (
                        <div>
                          <h4 className="font-medium mb-2">Transcription</h4>
                          <p className="text-sm text-gray-600">{note.transcription}</p>
                        </div>
                      )}

                      {note.summary && (
                        <div>
                          <h4 className="font-medium mb-2">Summary</h4>
                          <p className="text-sm text-gray-600">{note.summary}</p>
                        </div>
                      )}

                      {note.checklist?.items && note.checklist.items.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Checklist</h4>
                          <div className="space-y-2">
                            {note.checklist.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 p-2 bg-gray-50 rounded"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{item.title}</div>
                                  <div className="text-sm text-gray-600">
                                    {item.description}
                                  </div>
                                  {item.dueDate && (
                                    <div className="text-sm text-gray-500 mt-1">
                                      <ClockIcon className="h-4 w-4 inline mr-1" />
                                      Due: {item.dueDate}
                                    </div>
                                  )}
                                </div>
                                <Badge
                                  variant={item.status === 'completed' ? 'outline' : 'secondary'}
                                >
                                  {item.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 