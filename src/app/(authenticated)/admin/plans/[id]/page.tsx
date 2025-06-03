'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCardIcon,
  CalendarIcon, 
  CurrencyDollarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  BookOpenIcon, 
  ShoppingBagIcon,
  CheckCircleIcon, 
  PencilIcon,
  ArrowLeftIcon,
  ClockIcon,
  StarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  maxPatients: number;
  maxProtocols: number;
  maxCourses: number;
  maxProducts: number;
  trialDays: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ViewPlanPage() {
  const { data: session } = useSession();
  const params = useParams();
  const planId = params.id as string;
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/plans/${planId}`);
        
        if (response.ok) {
          const data = await response.json();
          setPlan(data.plan);
        }
      } catch (error) {
        console.error('Error loading plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && planId) {
      loadPlan();
    }
  }, [session, planId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-48 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-32 animate-pulse"></div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="text-center py-12">
              <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Plan not found.</p>
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
            <div>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                {plan.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Plan details and configuration
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild
                className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200"
              >
                <Link href={`/admin/plans/${plan.id}/edit`}>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Plan
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
              >
                <Link href="/admin/plans">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Plans
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Plan Overview */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <InformationCircleIcon className="h-5 w-5 text-turquoise" />
                    Plan Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-light text-turquoise">
                      $ {plan.price}
                    </div>
                    <div className="text-gray-600">/month</div>
                    <div className="flex gap-2">
                      <Badge 
                        className={plan.isDefault 
                          ? 'bg-turquoise text-black border-0' 
                          : 'bg-purple-100 text-purple-800 border-0'
                        }
                      >
                        {plan.isDefault ? 'Default Plan' : 'Premium Plan'}
                      </Badge>
                      {plan.trialDays && plan.trialDays > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-0">
                          {plan.trialDays} days trial
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Limits */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-turquoise" />
                    Plan Limits & Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <UsersIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Patients</h4>
                          <p className="text-sm text-gray-600">Maximum number of patients</p>
                        </div>
                      </div>
                      <p className="text-2xl font-light text-blue-600">
                        {plan.maxPatients === 999999 ? 'Unlimited' : plan.maxPatients.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Protocols</h4>
                          <p className="text-sm text-gray-600">Maximum number of protocols</p>
                        </div>
                      </div>
                      <p className="text-2xl font-light text-green-600">
                        {plan.maxProtocols === 999999 ? 'Unlimited' : plan.maxProtocols.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <BookOpenIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Courses</h4>
                          <p className="text-sm text-gray-600">Maximum number of courses</p>
                        </div>
                      </div>
                      <p className="text-2xl font-light text-purple-600">
                        {plan.maxCourses === 999999 ? 'Unlimited' : plan.maxCourses.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <ShoppingBagIcon className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Products</h4>
                          <p className="text-sm text-gray-600">Maximum number of products</p>
                        </div>
                      </div>
                      <p className="text-2xl font-light text-orange-600">
                        {plan.maxProducts === 999999 ? 'Unlimited' : plan.maxProducts.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              
              {/* Plan Status */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Plan Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type</span>
                    <Badge 
                      className={plan.isDefault 
                        ? 'bg-turquoise text-black border-0' 
                        : 'bg-purple-100 text-purple-800 border-0'
                      }
                    >
                      {plan.isDefault ? 'Default' : 'Premium'}
                    </Badge>
                  </div>
                  
                  {plan.trialDays && plan.trialDays > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Trial Period</span>
                      <div className="flex items-center gap-1 text-sm text-yellow-600">
                        <ClockIcon className="h-4 w-4" />
                        {plan.trialDays} days
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Price</span>
                    <div className="flex items-center gap-1 text-sm font-medium text-turquoise">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      $ {plan.price}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Metadata */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Plan Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Plan ID</label>
                    <p className="text-sm text-gray-600 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">
                      {plan.id}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(plan.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(plan.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    asChild
                    className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-semibold"
                  >
                    <Link href={`/admin/plans/${plan.id}/edit`}>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Plan
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild
                    variant="outline"
                    className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <Link href="/admin/subscriptions">
                      <StarIcon className="h-4 w-4 mr-2" />
                      View Subscriptions
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 