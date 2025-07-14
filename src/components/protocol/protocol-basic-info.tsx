import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InformationCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ProtocolBasicInfoProps {
  protocol: any;
  onUpdate: (field: string, value: any) => void;
}

export default function ProtocolBasicInfo({
  protocol,
  onUpdate,
}: ProtocolBasicInfoProps) {
  const [isImprovingName, setIsImprovingName] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);

  const improveName = async () => {
    if (!protocol.name?.trim()) {
      alert('Please write something in the name before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingName(true);
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: protocol.name,
          context: 'protocol_name'
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate('name', data.improvedText);
      } else {
        const errorData = await response.json();
        alert(`Error improving text: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving name:', error);
      alert('Connection error while trying to improve text with AI.');
    } finally {
      setIsImprovingName(false);
    }
  };

  const improveDescription = async () => {
    if (!protocol.description?.trim()) {
      alert('Please write something in the description before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingDescription(true);
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: protocol.description,
          context: 'protocol_description'
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate('description', data.improvedText);
      } else {
        const errorData = await response.json();
        alert(`Error improving text: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving description:', error);
      alert('Connection error while trying to improve text with AI.');
    } finally {
      setIsImprovingDescription(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium leading-none">Basic Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure the main details of your protocol
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Protocol Name</Label>
                <div className="relative">
                  <Input
                    value={protocol.name || ''}
                    onChange={(e) => onUpdate('name', e.target.value)}
                    placeholder="Enter protocol name..."
                    className="mt-1"
                  />
                  {protocol.name?.trim() && (
                    <button
                      type="button"
                      onClick={improveName}
                      disabled={isImprovingName}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#5154e7] hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Improve with AI"
                    >
                      {isImprovingName ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5154e7] border-t-transparent"></div>
                      ) : (
                        <SparklesIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="relative">
                  <Textarea
                    value={protocol.description || ''}
                    onChange={(e) => onUpdate('description', e.target.value)}
                    placeholder="Enter protocol description..."
                    className="mt-1"
                    rows={4}
                  />
                  {protocol.description?.trim() && (
                    <button
                      type="button"
                      onClick={improveDescription}
                      disabled={isImprovingDescription}
                      className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-[#5154e7] hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Improve with AI"
                    >
                      {isImprovingDescription ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5154e7] border-t-transparent"></div>
                      ) : (
                        <SparklesIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Duration (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={protocol.duration || ''}
                  onChange={(e) => onUpdate('duration', parseInt(e.target.value))}
                  placeholder="Enter protocol duration..."
                  className="mt-1 w-32"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={protocol.isActive}
                  onCheckedChange={(checked) => onUpdate('isActive', checked)}
                />
                <Label className="text-sm text-muted-foreground">Active Protocol</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium leading-none">Protocol Tips</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how to create effective protocols
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium leading-none mb-2">Best Practices</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>Use clear and descriptive names</li>
                    <li>Keep descriptions concise but informative</li>
                    <li>Set realistic durations</li>
                    <li>Organize content logically</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium leading-none mb-2">AI Assistance</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>Click the sparkle icon to improve text</li>
                    <li>AI helps make content more professional</li>
                    <li>Review AI suggestions before saving</li>
                    <li>Edit AI output to match your style</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 