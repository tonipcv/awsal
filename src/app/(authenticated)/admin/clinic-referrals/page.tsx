'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Clock,
  Mail,
  Phone,
  User,
  Calendar,
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeftIcon,
  EyeIcon,
  PlusIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ClinicReferral {
  id: string;
  clinic_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  clinic_address?: string;
  specialties?: string;
  notes?: string;
  status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
  reward_status: 'PENDING' | 'APPROVED' | 'CREDITED';
  reward_months: number;
  referred_by_id?: string;
  referring_doctor?: {
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

interface ReferralStats {
  total: number;
  pending: number;
  contacted: number;
  converted: number;
  rejected: number;
}

export default function AdminClinicReferralsPage() {
  const [referrals, setReferrals] = useState<ClinicReferral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    pending: 0,
    contacted: 0,
    converted: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/admin/clinic-referrals');
      if (response.ok) {
        const data = await response.json();
        setReferrals(data.referrals);
        setStats(data.stats);
      } else {
        toast.error('Error loading referrals');
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Error loading referrals');
    } finally {
      setLoading(false);
    }
  };

  const updateReferralStatus = async (referralId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/clinic-referrals/${referralId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        fetchReferrals(); // Refresh data
      } else {
        toast.error('Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      CONTACTED: { color: 'bg-blue-100 text-blue-800', icon: Mail },
      CONVERTED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;

    return (
      <Badge className={`${config?.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = 
      referral.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (referral.referring_doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || referral.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                Clinic Referrals
              </h1>
              <p className="text-gray-600 mt-1">
                Manage clinic referral requests from doctors
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
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
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Total Referrals</p>
                    <p className="text-2xl font-light text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Pending</p>
                    <p className="text-2xl font-light text-yellow-600">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Contacted</p>
                    <p className="text-2xl font-light text-blue-600">{stats.contacted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Converted</p>
                    <p className="text-2xl font-light text-green-600">{stats.converted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Conversion Rate</p>
                    <p className="text-2xl font-light text-purple-600">
                      {stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search referrals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Referrals List */}
          <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Referral Requests
              </CardTitle>
              <div className="text-sm text-gray-600">
                {filteredReferrals.length} of {referrals.length} referrals
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {filteredReferrals.map((referral) => (
                  <div key={referral.id} className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{referral.clinic_name}</h3>
                          {getStatusBadge(referral.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{referral.contact_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{referral.contact_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{referral.contact_phone}</span>
                          </div>
                          {referral.referring_doctor && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>Referred by Dr. {referral.referring_doctor.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-6">
                        {referral.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReferralStatus(referral.id, 'CONTACTED')}
                              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            >
                              Mark Contacted
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateReferralStatus(referral.id, 'CONVERTED')}
                              className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold"
                            >
                              Mark Converted
                            </Button>
                          </>
                        )}
                        {referral.status === 'CONTACTED' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateReferralStatus(referral.id, 'CONVERTED')}
                              className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold"
                            >
                              Mark Converted
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReferralStatus(referral.id, 'REJECTED')}
                              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            >
                              Mark Rejected
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredReferrals.length === 0 && (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No referrals found matching your criteria.</p>
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