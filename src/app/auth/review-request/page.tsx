'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

function ReviewRequestForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [clinicName, setClinicName] = useState('');
  const [clinicSlug, setClinicSlug] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get data from URL params
    const clinic = searchParams.get('clinicName') || 'Your Healthcare Provider';
    const slug = searchParams.get('clinicSlug') || '';
    const doctor = searchParams.get('doctorName') || '';
    const reviewLink = searchParams.get('googleReviewLink') || '';
    
    setClinicName(clinic);
    setClinicSlug(slug);
    setDoctorName(doctor);
    setGoogleReviewLink(reviewLink);
    setIsLoading(false);
  }, [searchParams]);

  const handleGoogleReview = () => {
    if (googleReviewLink) {
      window.open(googleReviewLink, '_blank');
    } else {
      alert('Google review link not configured by your doctor.');
    }
  };

  const handleSkip = () => {
    // Redirect to clinic-specific login if slug exists, otherwise generic login
    if (clinicSlug) {
      router.push(`/login/${clinicSlug}`);
    } else {
      router.push('/auth/signin');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] font-normal tracking-[-0.03em] relative z-10">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg relative z-20">
            
            {/* Skeleton Logo */}
            <div className="text-center mb-6">
              <div className="flex justify-center items-center mb-4">
                <div className="w-16 h-16 bg-gray-700 rounded-xl animate-pulse"></div>
              </div>
              
              {/* Skeleton Title */}
              <div className="h-6 bg-gray-700 rounded-lg animate-pulse mb-2 mx-8"></div>
              <div className="h-4 bg-gray-700 rounded animate-pulse mx-4"></div>
            </div>

            {/* Skeleton Content */}
            <div className="space-y-5">
              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
              <div className="h-12 bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-gray-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Skeleton Logo do sistema */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-center gap-2">
                <div className="h-3 bg-gray-700 rounded animate-pulse w-16"></div>
                <div className="h-3 bg-gray-700 rounded animate-pulse w-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] font-normal tracking-[-0.03em] relative z-10">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg relative z-20">
          
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-200 mb-2">
              Your exclusive platform access for {clinicName} is almost ready!
            </h1>
            <p className="text-gray-400 text-sm">
              While we finalize your access, we'd love to hear about your experience with {doctorName || 'your doctor'}.
            </p>
          </div>

          {/* Rating Stars */}
          <div className="flex justify-center mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} className="h-6 w-6 text-yellow-400 fill-current" />
            ))}
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              Your feedback helps us improve our services and helps other patients find quality healthcare. 
              Would you mind taking a moment to rate your experience?
            </p>
          </div>
          
          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleReview}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <StarIcon className="h-4 w-4" />
              Leave a Google Review
            </button>
            
            <button
              onClick={handleSkip}
              className="w-full py-2.5 px-4 text-sm font-semibold text-gray-300 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 border border-gray-700"
            >
              Skip for now
            </button>
          </div>
          
          {/* Logo do sistema */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">Powered by</span>
              <Image
                src="/logo.png"
                alt="Sistema"
                width={32}
                height={10}
                className="object-contain opacity-60"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] font-normal tracking-[-0.03em] relative z-10">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg relative z-20">
          <div className="text-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-400 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewRequestPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReviewRequestForm />
    </Suspense>
  );
} 