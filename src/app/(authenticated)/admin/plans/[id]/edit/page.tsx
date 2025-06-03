'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCardIcon,
  CalendarIcon, 
  CurrencyDollarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  BookOpenIcon, 
  ShoppingBagIcon,
  CheckCircleIcon, 
  ArrowLeftIcon,
  ClockIcon,
  StarIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'sonner';

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

export default function EditPlanPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    maxPatients: 0,
    maxProtocols: 0,
    maxCourses: 0,
    maxProducts: 0,
    trialDays: 0,
    isDefault: false
  });

  useEffect(() => {
    const loadPlan = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/plans/${planId}`);
        
        if (response.ok) {
          const data = await response.json();
          setPlan(data.plan);
          setFormData({
            name: data.plan.name,
            description: data.plan.description,
            price: data.plan.price,
            maxPatients: data.plan.maxPatients,
            maxProtocols: data.plan.maxProtocols,
            maxCourses: data.plan.maxCourses,
            maxProducts: data.plan.maxProducts,
            trialDays: data.plan.trialDays || 0,
            isDefault: data.plan.isDefault
          });
        }
      } catch (error) {
        console.error('Error loading plan:', error);
        toast.error('Error loading plan');
      } finally {
        setIsLoading(false);
      }
    };

    if (session && planId) {
      loadPlan();
    }
  }, [session, planId]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Plan updated successfully');
        router.push(`/admin/plans/${planId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error updating plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Error updating plan');
    } finally {
      setIsSaving(false);
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
                <div className="h-5 bg-gray-100 rounded-lg w-48 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-32 animate-pulse"></div>
              </div>
            </div>

            {/* Form Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-6"></div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                      </div>
                    ))}
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
                Edit Plan: {plan.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Update plan details and configuration
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
              >
                <Link href={`/admin/plans/${plan.id}`}>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Link>
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Basic Information */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <InformationCircleIcon className="h-5 w-5 text-turquoise" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Plan Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                        placeholder="Enter plan name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                        placeholder="Enter plan description"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                          Monthly Price ($)
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="trialDays" className="text-sm font-medium text-gray-700">
                          Trial Days
                        </Label>
                        <Input
                          id="trialDays"
                          type="number"
                          min="0"
                          value={formData.trialDays}
                          onChange={(e) => handleInputChange('trialDays', parseInt(e.target.value) || 0)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Limits */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-turquoise" />
                      Plan Limits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="maxPatients" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <UsersIcon className="h-4 w-4 text-blue-600" />
                          Max Patients
                        </Label>
                        <Input
                          id="maxPatients"
                          type="number"
                          min="1"
                          value={formData.maxPatients === 999999 ? '' : formData.maxPatients}
                          onChange={(e) => handleInputChange('maxPatients', parseInt(e.target.value) || 999999)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="Unlimited (leave empty)"
                        />
                        <p className="text-xs text-gray-500">Leave empty for unlimited</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxProtocols" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4 text-green-600" />
                          Max Protocols
                        </Label>
                        <Input
                          id="maxProtocols"
                          type="number"
                          min="1"
                          value={formData.maxProtocols === 999999 ? '' : formData.maxProtocols}
                          onChange={(e) => handleInputChange('maxProtocols', parseInt(e.target.value) || 999999)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="Unlimited (leave empty)"
                        />
                        <p className="text-xs text-gray-500">Leave empty for unlimited</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxCourses" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <BookOpenIcon className="h-4 w-4 text-purple-600" />
                          Max Courses
                        </Label>
                        <Input
                          id="maxCourses"
                          type="number"
                          min="1"
                          value={formData.maxCourses === 999999 ? '' : formData.maxCourses}
                          onChange={(e) => handleInputChange('maxCourses', parseInt(e.target.value) || 999999)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="Unlimited (leave empty)"
                        />
                        <p className="text-xs text-gray-500">Leave empty for unlimited</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxProducts" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <ShoppingBagIcon className="h-4 w-4 text-orange-600" />
                          Max Products
                        </Label>
                        <Input
                          id="maxProducts"
                          type="number"
                          min="1"
                          value={formData.maxProducts === 999999 ? '' : formData.maxProducts}
                          onChange={(e) => handleInputChange('maxProducts', parseInt(e.target.value) || 999999)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="Unlimited (leave empty)"
                        />
                        <p className="text-xs text-gray-500">Leave empty for unlimited</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                
                {/* Plan Settings */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Plan Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-700">Default Plan</Label>
                        <p className="text-xs text-gray-500">Set as the default plan for new users</p>
                      </div>
                      <Switch
                        checked={formData.isDefault}
                        onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
                      />
                    </div>
                    
                    {formData.isDefault && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div className="text-xs text-yellow-700">
                            <p className="font-medium">Default Plan</p>
                            <p>This plan will be automatically assigned to new users.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-gray-900">{formData.name || 'Plan Name'}</h4>
                        {formData.isDefault && (
                          <span className="px-2 py-1 bg-turquoise text-black text-xs rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{formData.description || 'Plan description'}</p>
                      <div className="text-2xl font-light text-turquoise mb-3">
                        $ {formData.price}/month
                      </div>
                      {formData.trialDays > 0 && (
                        <div className="text-xs text-yellow-600 font-medium">
                          {formData.trialDays} days free trial
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardContent className="p-6 space-y-3">
                    <Button 
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-semibold"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    
                    <Button 
                      asChild
                      variant="outline"
                      className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Link href={`/admin/plans/${plan.id}`}>
                        Cancel
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 