'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  StarIcon,
  CalendarIcon, 
  CurrencyDollarIcon, 
  UsersIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  PencilIcon,
  ArrowLeftIcon,
  EyeIcon
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
}

interface DoctorSubscription {
  id: string;
  status: string;
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  autoRenew: boolean;
  doctor?: {
    id: string;
    name: string;
    email: string;
  };
  plan?: SubscriptionPlan;
}

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<DoctorSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [subscriptionsResponse, plansResponse] = await Promise.all([
          fetch('/api/admin/subscriptions'),
          fetch('/api/admin/plans')
        ]);
        
        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          setSubscriptions(subscriptionsData.subscriptions || []);
        }
        
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setPlans(plansData.plans || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadData();
    }
  }, [session]);

  // Statistics calculations
  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const trialCount = subscriptions.filter(s => s.status === 'TRIAL').length;
  const expiredCount = subscriptions.filter(s => s.status === 'EXPIRED').length;
  const expiringSoon = subscriptions.filter(s => {
    if (s.status !== 'TRIAL' || !s.trialEndDate) return false;
    const daysLeft = Math.ceil((new Date(s.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3;
  }).length;

  const totalRevenue = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + (s.plan?.price || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'TRIAL': return 'bg-blue-100 text-blue-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'TRIAL': return 'Trial';
      case 'EXPIRED': return 'Expired';
      case 'SUSPENDED': return 'Suspended';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-80 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-xl w-40 animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl animate-pulse">
                      <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-7 bg-gray-100 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subscriptions List Skeleton */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl mb-8">
              <div className="p-6 pb-4">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
              <div className="p-6 pt-0 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-40 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="space-y-2">
                          <div className="h-6 bg-gray-100 rounded-xl w-16 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
                          <div className="h-8 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plans Skeleton */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <div className="p-6 pb-4">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <div className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 border border-gray-200 rounded-xl bg-gray-50">
                      <div className="space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="h-3 bg-gray-100 rounded w-full animate-pulse"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                Manage Subscriptions
              </h1>
              <p className="text-gray-600 mt-1">
                View and manage all doctor subscriptions
              </p>
            </div>
            <Button 
              asChild
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            >
              <Link href="/admin">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Quick Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <StarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Total</p>
                    <p className="text-2xl font-light text-gray-900">{subscriptions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Active</p>
                    <p className="text-2xl font-light text-green-600">{activeCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Trial</p>
                    <p className="text-2xl font-light text-yellow-600">{trialCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Expiring</p>
                    <p className="text-2xl font-light text-red-600">{expiringSoon}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Revenue/Month</p>
                    <p className="text-2xl font-light text-purple-600">R$ {totalRevenue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expiring Alert */}
          {expiringSoon > 0 && (
            <Card className="mb-8 bg-red-50 border border-red-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-red-800">Attention: Trials Expiring</p>
                    <p className="text-red-700 mt-1">
                      {expiringSoon} trial subscriptions are expiring in the next 3 days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscriptions List */}
          <Card className="mb-8 bg-white border border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                All Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {subscriptions.length > 0 ? (
                  subscriptions.map((subscription) => {
                    const isExpiringSoon = subscription.status === 'TRIAL' && subscription.trialEndDate && 
                      Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 3;

                    const daysLeft = subscription.trialEndDate 
                      ? Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <div key={subscription.id} className={`p-4 rounded-xl border transition-colors ${
                        isExpiringSoon 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-turquoise rounded-xl flex items-center justify-center">
                              <StarIcon className="h-6 w-6 text-black" />
                            </div>
                            
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {subscription.doctor?.name || 'Doctor without name'}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">{subscription.doctor?.email}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600">
                                  Plan: {subscription.plan?.name || 'Basic'}
                                </span>
                                {subscription.plan?.price && (
                                  <span className="text-sm text-gray-600">
                                    R$ {subscription.plan.price}/month
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Status */}
                            <div className="text-right">
                              <Badge className={`${getStatusColor(subscription.status)} border-0`}>
                                {getStatusText(subscription.status)}
                              </Badge>
                              
                              {subscription.status === 'TRIAL' && daysLeft !== null && (
                                <p className={`text-xs mt-1 ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                  {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                                </p>
                              )}
                              
                              {subscription.status === 'ACTIVE' && subscription.endDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Renews on {new Date(subscription.endDate).toLocaleDateString('en-US')}
                                </p>
                              )}
                            </div>

                            {/* Plan Limits */}
                            {subscription.plan && (
                              <div className="text-xs text-gray-500 text-right">
                                <div>Max: {subscription.plan.maxPatients === 999999 ? '∞' : subscription.plan.maxPatients} patients</div>
                                <div>{subscription.plan.maxProtocols === 999999 ? '∞' : subscription.plan.maxProtocols} protocols</div>
                                <div>{subscription.plan.maxCourses === 999999 ? '∞' : subscription.plan.maxCourses} courses</div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Link href={`/admin/subscriptions/${subscription.id}/edit`}>
                                <Button 
                                  size="sm"
                                  className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold"
                                >
                                  <PencilIcon className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>
                              <Link href={`/admin/doctors/${subscription.doctor?.id}`}>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View Doctor
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Expiring Alert */}
                        {isExpiringSoon && (
                          <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                            <div className="flex items-center text-sm text-red-700">
                              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                              Trial expiring soon! Consider contacting the doctor.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <StarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No subscriptions found.</p>
                    <p className="text-gray-500 text-sm mt-2">Subscriptions will appear here once doctors are registered.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Available Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div key={plan.id} className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <Badge 
                        className={plan.isDefault 
                          ? 'bg-turquoise text-black border-0' 
                          : 'bg-purple-100 text-purple-800 border-0'
                        }
                      >
                        {plan.isDefault ? 'Default' : 'Premium'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <div className="text-2xl font-light text-turquoise mb-4">
                      R$ {plan.price}/month
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {plan.maxPatients === 999999 ? 'Unlimited patients' : `${plan.maxPatients} patients`}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {plan.maxProtocols === 999999 ? 'Unlimited protocols' : `${plan.maxProtocols} protocols`}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {plan.maxCourses === 999999 ? 'Unlimited courses' : `${plan.maxCourses} courses`}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {plan.maxProducts === 999999 ? 'Unlimited products' : `${plan.maxProducts} products`}
                      </div>
                    </div>
                    {plan.trialDays && plan.trialDays > 0 && (
                      <div className="mt-3 text-sm text-green-600 font-medium">
                        {plan.trialDays} days free trial
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 