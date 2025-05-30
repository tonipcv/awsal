'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  EyeIcon, 
  PaintBrushIcon, 
  Cog6ToothIcon,
  ClipboardDocumentIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface ConsultationForm {
  id: string;
  title: string;
  description: string;
  welcomeMessage?: string;
  successMessage: string;
  nameLabel: string;
  emailLabel: string;
  whatsappLabel: string;
  showAgeField: boolean;
  ageLabel: string;
  ageRequired: boolean;
  showSpecialtyField: boolean;
  specialtyLabel: string;
  specialtyOptions?: string;
  specialtyRequired: boolean;
  showMessageField: boolean;
  messageLabel: string;
  messageRequired: boolean;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  requireReferralCode: boolean;
  autoReply: boolean;
  autoReplyMessage?: string;
}

export default function ConsultationFormPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState<ConsultationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialtyList, setSpecialtyList] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    fetchForm();
  }, []);

  useEffect(() => {
    if (form?.specialtyOptions) {
      try {
        setSpecialtyList(JSON.parse(form.specialtyOptions));
      } catch {
        setSpecialtyList([]);
      }
    }
  }, [form?.specialtyOptions]);

  const fetchForm = async () => {
    try {
      const response = await fetch('/api/consultation-form');
      if (response.ok) {
        const data = await response.json();
        setForm(data);
      } else {
        // Create default form if it doesn't exist
        setForm({
          id: '',
          title: 'Schedule your consultation',
          description: 'Fill in your details to schedule a consultation',
          welcomeMessage: '',
          successMessage: 'Thank you! We will contact you shortly to confirm your consultation.',
          nameLabel: 'Full name',
          emailLabel: 'Email',
          whatsappLabel: 'WhatsApp',
          showAgeField: false,
          ageLabel: 'Age',
          ageRequired: false,
          showSpecialtyField: false,
          specialtyLabel: 'Specialty of interest',
          specialtyOptions: '[]',
          specialtyRequired: false,
          showMessageField: true,
          messageLabel: 'Message (optional)',
          messageRequired: false,
          primaryColor: '#5154e7',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          isActive: true,
          requireReferralCode: false,
          autoReply: true,
          autoReplyMessage: ''
        });
      }
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    
    setSaving(true);
    try {
      const formData = {
        ...form,
        specialtyOptions: JSON.stringify(specialtyList)
      };

      const response = await fetch('/api/consultation-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedForm = await response.json();
        setForm(updatedForm);
        alert('Form saved successfully!');
      } else {
        alert('Error saving form');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving form');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialtyList.includes(newSpecialty.trim())) {
      setSpecialtyList([...specialtyList, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    setSpecialtyList(specialtyList.filter((_, i) => i !== index));
  };

  const copyFormLink = () => {
    if (session?.user?.id) {
      const link = `${window.location.origin}/consultation/${session.user.id}`;
      navigator.clipboard.writeText(link);
      alert('Form link copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
              <div className="h-5 bg-gray-100 rounded-lg w-96 animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Settings Skeleton */}
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Information Card */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                      <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                      <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Form Fields Card */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-28 animate-pulse"></div>
                        <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Styling Card */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                        <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                        <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                        <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Skeleton */}
              <div className="lg:col-span-1">
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl sticky top-6">
                  <CardHeader className="pb-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded-lg animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded-lg w-3/4 animate-pulse"></div>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                    <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Consultation Form
            </h1>
            <p className="text-gray-600 font-medium">
              Customize the form that your patients will fill out to schedule consultations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <Cog6ToothIcon className="h-5 w-5 text-[#5154e7]" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-gray-900 font-semibold">Form Title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., Schedule your consultation"
                      className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-900 font-semibold">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief description of the form"
                      rows={2}
                      className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <Label htmlFor="welcomeMessage" className="text-gray-900 font-semibold">Welcome Message (optional)</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={form.welcomeMessage || ''}
                      onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
                      placeholder="Custom welcome message"
                      rows={2}
                      className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <Label htmlFor="successMessage" className="text-gray-900 font-semibold">Success Message</Label>
                    <Textarea
                      id="successMessage"
                      value={form.successMessage}
                      onChange={(e) => setForm({ ...form, successMessage: e.target.value })}
                      placeholder="Message displayed after submission"
                      rows={2}
                      className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl font-medium"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form Fields */}
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <ClipboardDocumentIcon className="h-5 w-5 text-[#5154e7]" />
                    Form Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Required Fields */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Required Fields</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="nameLabel" className="text-gray-900 font-semibold">Name Label</Label>
                        <Input
                          id="nameLabel"
                          value={form.nameLabel}
                          onChange={(e) => setForm({ ...form, nameLabel: e.target.value })}
                          className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 rounded-xl h-10 font-medium"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailLabel" className="text-gray-900 font-semibold">Email Label</Label>
                        <Input
                          id="emailLabel"
                          value={form.emailLabel}
                          onChange={(e) => setForm({ ...form, emailLabel: e.target.value })}
                          className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 rounded-xl h-10 font-medium"
                        />
                      </div>
                      <div>
                        <Label htmlFor="whatsappLabel" className="text-gray-900 font-semibold">WhatsApp Label</Label>
                        <Input
                          id="whatsappLabel"
                          value={form.whatsappLabel}
                          onChange={(e) => setForm({ ...form, whatsappLabel: e.target.value })}
                          className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 rounded-xl h-10 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Age Field */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Age Field</h4>
                      <Switch
                        checked={form.showAgeField}
                        onCheckedChange={(checked) => setForm({ ...form, showAgeField: checked })}
                      />
                    </div>
                    {form.showAgeField && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="ageLabel" className="text-gray-900 font-semibold">Age Label</Label>
                          <Input
                            id="ageLabel"
                            value={form.ageLabel}
                            onChange={(e) => setForm({ ...form, ageLabel: e.target.value })}
                            className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 rounded-xl h-10 font-medium"
                          />
                        </div>
                        <div className="flex items-center space-x-3 pt-8">
                          <Switch
                            checked={form.ageRequired}
                            onCheckedChange={(checked) => setForm({ ...form, ageRequired: checked })}
                          />
                          <Label className="text-gray-900 font-semibold">Required field</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Specialty Field */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Specialty Field</h4>
                      <Switch
                        checked={form.showSpecialtyField}
                        onCheckedChange={(checked) => setForm({ ...form, showSpecialtyField: checked })}
                      />
                    </div>
                    {form.showSpecialtyField && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="specialtyLabel" className="text-gray-900 font-semibold">Specialty Label</Label>
                            <Input
                              id="specialtyLabel"
                              value={form.specialtyLabel}
                              onChange={(e) => setForm({ ...form, specialtyLabel: e.target.value })}
                              className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 rounded-xl h-10 font-medium"
                            />
                          </div>
                          <div className="flex items-center space-x-3 pt-8">
                            <Switch
                              checked={form.specialtyRequired}
                              onCheckedChange={(checked) => setForm({ ...form, specialtyRequired: checked })}
                            />
                            <Label className="text-gray-900 font-semibold">Required field</Label>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-gray-900 font-semibold">Specialty Options</Label>
                          <div className="flex gap-3 mt-2">
                            <Input
                              value={newSpecialty}
                              onChange={(e) => setNewSpecialty(e.target.value)}
                              placeholder="e.g., Cardiology"
                              onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                              className="bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                            />
                            <Button onClick={addSpecialty} variant="outline" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold">
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-4">
                            {specialtyList.map((specialty, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-3 py-1 font-medium"
                                onClick={() => removeSpecialty(index)}
                              >
                                {specialty} ×
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Message Field */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Message Field</h4>
                      <Switch
                        checked={form.showMessageField}
                        onCheckedChange={(checked) => setForm({ ...form, showMessageField: checked })}
                      />
                    </div>
                    {form.showMessageField && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="messageLabel" className="text-gray-900 font-semibold">Message Label</Label>
                          <Input
                            id="messageLabel"
                            value={form.messageLabel}
                            onChange={(e) => setForm({ ...form, messageLabel: e.target.value })}
                            className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 rounded-xl h-10 font-medium"
                          />
                        </div>
                        <div className="flex items-center space-x-3 pt-8">
                          <Switch
                            checked={form.messageRequired}
                            onCheckedChange={(checked) => setForm({ ...form, messageRequired: checked })}
                          />
                          <Label className="text-gray-900 font-semibold">Required field</Label>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <PaintBrushIcon className="h-5 w-5 text-[#5154e7]" />
                    Appearance & Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="primaryColor" className="text-gray-900 font-semibold">Primary Color</Label>
                      <Input
                        id="primaryColor"
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                        className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="backgroundColor" className="text-gray-900 font-semibold">Background Color</Label>
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={form.backgroundColor}
                        onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                        className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="textColor" className="text-gray-900 font-semibold">Text Color</Label>
                      <Input
                        id="textColor"
                        type="color"
                        value={form.textColor}
                        onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                        className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-900 font-semibold">Active Form</Label>
                      <Switch
                        checked={form.isActive}
                        onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-900 font-semibold">Require Referral Code</Label>
                      <Switch
                        checked={form.requireReferralCode}
                        onCheckedChange={(checked) => setForm({ ...form, requireReferralCode: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-900 font-semibold">Auto Reply</Label>
                      <Switch
                        checked={form.autoReply}
                        onCheckedChange={(checked) => setForm({ ...form, autoReply: checked })}
                      />
                    </div>
                  </div>

                  {form.autoReply && (
                    <div>
                      <Label htmlFor="autoReplyMessage" className="text-gray-900 font-semibold">Auto Reply Message</Label>
                      <Textarea
                        id="autoReplyMessage"
                        value={form.autoReplyMessage || ''}
                        onChange={(e) => setForm({ ...form, autoReplyMessage: e.target.value })}
                        placeholder="Message sent automatically by email"
                        rows={3}
                        className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl font-medium"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview and Actions */}
            <div className="space-y-8">
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <EyeIcon className="h-5 w-5 text-[#5154e7]" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold"
                  >
                    {saving ? 'Saving...' : 'Save Form'}
                  </Button>
                  
                  <Button 
                    onClick={copyFormLink}
                    variant="outline"
                    className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 font-semibold"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  
                  <Button 
                    onClick={() => window.open(`/consultation/${session?.user?.id}`, '_blank')}
                    variant="outline"
                    className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 font-semibold"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">Preview</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">How the form will appear</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="p-6 rounded-xl border-2 border-dashed"
                    style={{ 
                      backgroundColor: form.backgroundColor,
                      color: form.textColor,
                      borderColor: form.primaryColor + '40'
                    }}
                  >
                    <h3 className="text-lg font-bold mb-2">{form.title}</h3>
                    <p className="text-sm mb-6 font-medium">{form.description}</p>
                    
                    <div className="space-y-4 text-sm">
                      <div>
                        <label className="block font-semibold mb-1">{form.nameLabel} *</label>
                        <div className="h-8 bg-gray-200 rounded-lg"></div>
                      </div>
                      
                      <div>
                        <label className="block font-semibold mb-1">{form.emailLabel} *</label>
                        <div className="h-8 bg-gray-200 rounded-lg"></div>
                      </div>
                      
                      <div>
                        <label className="block font-semibold mb-1">{form.whatsappLabel} *</label>
                        <div className="h-8 bg-gray-200 rounded-lg"></div>
                      </div>
                      
                      {form.showAgeField && (
                        <div>
                          <label className="block font-semibold mb-1">
                            {form.ageLabel} {form.ageRequired && '*'}
                          </label>
                          <div className="h-8 bg-gray-200 rounded-lg"></div>
                        </div>
                      )}
                      
                      {form.showSpecialtyField && (
                        <div>
                          <label className="block font-semibold mb-1">
                            {form.specialtyLabel} {form.specialtyRequired && '*'}
                          </label>
                          <div className="h-8 bg-gray-200 rounded-lg"></div>
                        </div>
                      )}
                      
                      {form.showMessageField && (
                        <div>
                          <label className="block font-semibold mb-1">
                            {form.messageLabel} {form.messageRequired && '*'}
                          </label>
                          <div className="h-16 bg-gray-200 rounded-lg"></div>
                        </div>
                      )}
                      
                      <div 
                        className="h-12 rounded-xl text-white text-center leading-12 font-semibold mt-6"
                        style={{ backgroundColor: form.primaryColor, lineHeight: '3rem' }}
                      >
                        Submit
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 