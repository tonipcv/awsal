'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Mail, 
  Phone, 
  User,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ReferringDoctor {
  id: string;
  name: string;
  email: string;
}

function ClinicSignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referralId = searchParams.get('ref');
  
  const [referringDoctor, setReferringDoctor] = useState<ReferringDoctor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  useEffect(() => {
    if (referralId) {
      fetchReferringDoctor();
    }
  }, [referralId]);

  const fetchReferringDoctor = async () => {
    try {
      const response = await fetch(`/api/referral/doctor-info?id=${referralId}`);
      if (response.ok) {
        const data = await response.json();
        setReferringDoctor(data.doctor);
      }
    } catch (error) {
      console.error('Error fetching referring doctor:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clinicName || !formData.contactName || !formData.contactEmail || !formData.contactPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/referral/clinic-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referralId: referralId
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Demo request submitted successfully! We\'ll contact you soon.');
        router.push('/clinic-signup/success');
      } else {
        toast.error(data.error || 'Error submitting demo request');
      }
    } catch (error) {
      console.error('Error submitting demo request:', error);
      toast.error('Error submitting demo request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to clean doctor name and avoid duplication
  const formatDoctorName = (name: string) => {
    // Remove "Dr." or "Dra." from the beginning if present
    const cleanName = name.replace(/^(Dr\.?\s*|Dra\.?\s*)/i, '').trim();
    return cleanName;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-medium text-gray-900 mb-4">
          Request Free Demo Access
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Experience nossa ferramenta de gestão clínica with a complimentary demonstration
        </p>
        
        {referringDoctor && (
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-md border border-blue-200 mb-8">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">
              Referred by Dr. {formatDoctorName(referringDoctor.name)}
            </span>
          </div>
        )}
      </div>

      {/* Signup Form */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-600" />
            Demo Request Form
          </CardTitle>
          <CardDescription className="text-gray-600">
            Please provide your clinic details below. We'll contact you within 24 hours to arrange your demonstration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinicName" className="text-sm font-medium text-gray-700">
                  Clinic Name *
                </Label>
                <Input
                  id="clinicName"
                  value={formData.clinicName}
                  onChange={(e) => handleInputChange('clinicName', e.target.value)}
                  placeholder="Medical Centre Name"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactName" className="text-sm font-medium text-gray-700">
                  Contact Person *
                </Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="Dr John Smith"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="contact@clinic.co.uk"
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700">
                  Phone Number *
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+44 20 7123 4567"
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md shadow-sm transition-colors duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting Request...
                </>
              ) : (
                <>
                  Request Demo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By submitting this form, you agree to be contacted regarding our clinic management platform. 
              No commitment required.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Simple benefits section */}
      <div className="mt-12 text-center">
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What to Expect</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <div className="font-medium text-gray-900 mb-1">Personalised Demo</div>
              <div>30-minute consultation tailored to your needs</div>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">Ongoing Support</div>
              <div>Dedicated assistance throughout your trial</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClinicSignupPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-semibold text-gray-900">CXLUS</span>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <ClinicSignupForm />
      </Suspense>
    </div>
  );
} 