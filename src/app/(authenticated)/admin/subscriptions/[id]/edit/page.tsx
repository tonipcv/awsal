'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  StarIcon, 
  UserIcon, 
  CalendarIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  maxPatients: number;
  maxProtocols: number;
  maxCourses: number;
  maxProducts: number;
  trialDays: number;
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  autoRenew: boolean;
  doctor: {
    id: string;
    name: string;
    email: string;
  };
  plan: Plan;
}

export default function EditSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const subscriptionId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const [formData, setFormData] = useState({
    planId: '',
    status: '',
    endDate: '',
    trialEndDate: '',
    autoRenew: true
  });

  // Load subscription data
  useEffect(() => {
    if (subscriptionId) {
      loadSubscription();
      loadPlans();
    }
  }, [subscriptionId]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubscription(data.subscription);
        setFormData({
          planId: data.subscription.plan.id,
          status: data.subscription.status,
          endDate: data.subscription.endDate ? new Date(data.subscription.endDate).toISOString().split('T')[0] : '',
          trialEndDate: data.subscription.trialEndDate ? new Date(data.subscription.trialEndDate).toISOString().split('T')[0] : '',
          autoRenew: data.subscription.autoRenew
        });
      } else {
        setError(data.error || 'Error loading subscription');
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setError('Internal server error');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans');
      const data = await response.json();
      if (response.ok) {
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Subscription updated successfully!');
        router.push('/admin/subscriptions');
      } else {
        setError(data.error || 'Error updating subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Internal server error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'TRIAL': return 'Trial';
      case 'SUSPENDED': return 'Suspended';
      case 'CANCELLED': return 'Cancelled';
      case 'EXPIRED': return 'Expired';
      default: return status;
    }
  };

  if (loading) {
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
              <div className="h-10 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
            </div>

            <div className="max-w-2xl mx-auto space-y-8">
              {/* Doctor Info Skeleton */}
              <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Skeleton */}
              <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                <div className="space-y-6">
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded-xl w-full animate-pulse"></div>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4">
                    <div className="h-10 bg-gray-200 rounded-xl flex-1 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-xl w-24 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">Subscription not found</p>
              <Button asChild className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold">
                <Link href="/admin/subscriptions">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Subscriptions
                </Link>
              </Button>
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
                Edit Subscription
              </h1>
              <p className="text-gray-600 mt-1">
                Modify subscription for {subscription.doctor.name}
              </p>
            </div>
            <Button 
              asChild
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            >
              <Link href="/admin/subscriptions">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>

          <div className="max-w-2xl mx-auto space-y-8">
            {/* Doctor Information */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  Doctor Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Name</Label>
                    <p className="text-gray-900 mt-1 font-medium">{subscription.doctor.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-gray-900 mt-1">{subscription.doctor.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Form */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-turquoise rounded-xl">
                    <StarIcon className="h-5 w-5 text-black" />
                  </div>
                  Subscription Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center text-red-700">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Plan Selection */}
                  <div>
                    <Label htmlFor="planId" className="text-sm font-medium text-gray-700">Plan</Label>
                    <Select value={formData.planId} onValueChange={(value) => handleInputChange('planId', value)}>
                      <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-turquoise focus:ring-turquoise">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{plan.name} - R$ {plan.price}/month</span>
                              <span className="text-xs text-gray-500">
                                {plan.maxPatients === 999999 ? 'Unlimited' : plan.maxPatients} patients
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-turquoise focus:ring-turquoise">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRIAL">Trial</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.status === 'TRIAL' && (
                      <div>
                        <Label htmlFor="trialEndDate" className="text-sm font-medium text-gray-700">Trial End Date</Label>
                        <Input
                          id="trialEndDate"
                          type="date"
                          value={formData.trialEndDate}
                          onChange={(e) => handleInputChange('trialEndDate', e.target.value)}
                          className="mt-2 h-12 border-gray-300 focus:border-turquoise focus:ring-turquoise"
                        />
                      </div>
                    )}
                    
                    {formData.status === 'ACTIVE' && (
                      <div>
                        <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">Renewal Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                          className="mt-2 h-12 border-gray-300 focus:border-turquoise focus:ring-turquoise"
                        />
                      </div>
                    )}
                  </div>

                  {/* Auto Renewal */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="autoRenew"
                      checked={formData.autoRenew}
                      onChange={(e) => handleInputChange('autoRenew', e.target.checked)}
                      className="h-4 w-4 text-turquoise border-gray-300 rounded focus:ring-turquoise"
                    />
                    <Label htmlFor="autoRenew" className="text-sm font-medium text-gray-700">
                      Auto-renewal enabled
                    </Label>
                  </div>

                  {/* Selected Plan Information */}
                  {formData.planId && (
                    <div className="p-6 bg-turquoise/10 border border-turquoise/20 rounded-xl">
                      {(() => {
                        const selectedPlan = plans.find(p => p.id === formData.planId);
                        if (!selectedPlan) return null;
                        
                        return (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <StarIcon className="h-4 w-4 text-turquoise" />
                              Plan Limits:
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-gray-400" />
                                {selectedPlan.maxPatients === 999999 ? 'Unlimited' : selectedPlan.maxPatients} patients
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                {selectedPlan.maxProtocols === 999999 ? 'Unlimited' : selectedPlan.maxProtocols} protocols
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                {selectedPlan.maxCourses === 999999 ? 'Unlimited' : selectedPlan.maxCourses} courses
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                {selectedPlan.maxProducts === 999999 ? 'Unlimited' : selectedPlan.maxProducts} products
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-lg font-semibold text-turquoise">
                              <CurrencyDollarIcon className="h-5 w-5" />
                              R$ {selectedPlan.price}/month
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-turquoise hover:bg-turquoise/90 text-black font-semibold shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200 h-12"
                    >
                      {saving ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/admin/subscriptions')}
                      className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 h-12 px-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 