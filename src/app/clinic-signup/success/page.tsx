'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Mail, 
  Calendar,
  Phone,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ClinicSignupSuccessPage() {
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-medium text-gray-900 mb-4">
            Demo Request Submitted Successfully
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your interest in our clinic management platform. We'll be in touch shortly to arrange your demonstration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Initial Contact</h3>
                    <p className="text-gray-600 text-sm">We'll contact you within 24 hours to schedule your demonstration</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Platform Demonstration</h3>
                    <p className="text-gray-600 text-sm">30-minute consultation tailored to your clinic's requirements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Trial Access</h3>
                    <p className="text-gray-600 text-sm">30-day complimentary access to evaluate the platform</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Implementation Support</h3>
                    <p className="text-gray-600 text-sm">Dedicated assistance throughout your evaluation period</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Phone className="h-5 w-5 text-gray-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Get in Touch</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">support@clinicplatform.co.uk</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">+44 20 7123 4567</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Business Hours</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Monday - Friday: 9:00 AM - 5:30 PM</p>
                    <p>Saturday: 10:00 AM - 2:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-8 text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-4">Your Trial Includes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-medium text-gray-900 mb-2">30 Days</div>
              <div className="text-gray-600">Complimentary Access</div>
            </div>
            <div>
              <div className="text-2xl font-medium text-gray-900 mb-2">Full Features</div>
              <div className="text-gray-600">Complete Platform Access</div>
            </div>
            <div>
              <div className="text-2xl font-medium text-gray-900 mb-2">Dedicated Support</div>
              <div className="text-gray-600">Personal Assistance</div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button 
            asChild
            variant="outline"
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Homepage
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 