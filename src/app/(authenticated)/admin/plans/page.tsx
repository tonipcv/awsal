'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  EyeIcon,
  PlusIcon,
  StarIcon
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

export default function PlansPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/plans');
        
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
        }
      } catch (error) {
        console.error('Error loading plans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadPlans();
    }
  }, [session]);

  // Statistics calculations
  const totalPlans = plans.length;
  const defaultPlans = plans.filter(p => p.isDefault).length;
  const premiumPlans = plans.filter(p => !p.isDefault).length;
  const averagePrice = plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.price, 0) / plans.length) : 0;
  const plansWithTrial = plans.filter(p => p.trialDays && p.trialDays > 0).length;

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
                <div className="h-10 bg-gray-200 rounded-xl w-36 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-32 animate-pulse"></div>
              </div>
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

            {/* Plans List Skeleton */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <div className="p-6 pb-4">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
              <div className="p-6 pt-0 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 border border-gray-200 rounded-xl bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded w-64 animate-pulse"></div>
                        <div className="h-8 bg-gray-100 rounded w-32 animate-pulse"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
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
                Subscription Plans
              </h1>
              <p className="text-gray-600 mt-1">
                Manage subscription plans and pricing
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Plan
              </Button>
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
          </div>

          {/* Quick Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <CreditCardIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Total Plans</p>
                    <p className="text-2xl font-light text-gray-900">{totalPlans}</p>
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
                    <p className="text-sm text-gray-600 font-medium">Default Plans</p>
                    <p className="text-2xl font-light text-green-600">{defaultPlans}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <StarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Premium Plans</p>
                    <p className="text-2xl font-light text-purple-600">{premiumPlans}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Avg. Price</p>
                    <p className="text-2xl font-light text-orange-600">$ {averagePrice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <CalendarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">With Trial</p>
                    <p className="text-2xl font-light text-yellow-600">{plansWithTrial}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plans List */}
          <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Available Plans
              </CardTitle>
              <div className="text-sm text-gray-600">
                {plans.length} plans configured
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                          <Badge 
                            className={plan.isDefault 
                              ? 'bg-turquoise text-black border-0' 
                              : 'bg-purple-100 text-purple-800 border-0'
                            }
                          >
                            {plan.isDefault ? 'Default' : 'Premium'}
                          </Badge>
                          {plan.trialDays && plan.trialDays > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-0">
                              {plan.trialDays} days trial
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-4">{plan.description}</p>
                        
                        <div className="flex items-center gap-8 mb-4">
                          <div className="text-3xl font-light text-turquoise">
                            $ {plan.price}/month
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-gray-400" />
                            <span>{plan.maxPatients === 999999 ? 'Unlimited' : plan.maxPatients} patients</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                            <span>{plan.maxProtocols === 999999 ? 'Unlimited' : plan.maxProtocols} protocols</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpenIcon className="h-4 w-4 text-gray-400" />
                            <span>{plan.maxCourses === 999999 ? 'Unlimited' : plan.maxCourses} courses</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                            <span>{plan.maxProducts === 999999 ? 'Unlimited' : plan.maxProducts} products</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-6">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <Link href={`/admin/plans/${plan.id}`}>
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View Details
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold"
                        >
                          <Link href={`/admin/plans/${plan.id}/edit`}>
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit Plan
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {plans.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No subscription plans found.</p>
                    <p className="text-gray-500 text-sm mt-2">Create your first plan to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 