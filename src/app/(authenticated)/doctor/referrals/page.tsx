'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Users, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Edit,
  Share2,
  TrendingUp,
  ChartBarIcon
} from 'lucide-react';
import Link from 'next/link';

interface ReferralLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  referralCode: string;
  createdAt: string;
  lastContactAt?: string;
  notes?: string;
  referrer: {
    id: string;
    name: string;
    email: string;
  };
  convertedUser?: {
    id: string;
    name: string;
    email: string;
  };
  credits: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
}

interface ReferralStats {
  total: number;
  pending: number;
  contacted: number;
  converted: number;
  rejected: number;
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONTACTED: { label: 'Contacted', color: 'bg-blue-100 text-blue-800', icon: UserPlus },
  CONVERTED: { label: 'Converted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: Clock }
};

export default function DoctorReferralsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<ReferralLead[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<ReferralLead | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'rejected'>('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: ''
  });

  // Load data
  const loadData = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/referrals/manage?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLeads(data.leads);
        setStats(data.stats);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    }
  }, [session, page]);

  const handleStatusUpdate = async () => {
    if (!selectedLead || !updateForm.status) return;

    setUpdating(selectedLead.id);
    try {
      const response = await fetch('/api/referrals/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          status: updateForm.status,
          notes: updateForm.notes
        })
      });

      if (response.ok) {
        await loadData();
        setSelectedLead(null);
        setUpdateForm({ status: '', notes: '' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const openUpdateDialog = (lead: ReferralLead) => {
    setSelectedLead(lead);
    setUpdateForm({
      status: lead.status,
      notes: lead.notes || ''
    });
  };

  const generateReferralLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/referral/${session?.user?.id}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(generateReferralLink());
    // Here you could add a success toast
  };

  // Filter leads based on active tab
  const filteredLeads = activeTab === 'active' 
    ? leads.filter(lead => ['PENDING', 'CONTACTED', 'CONVERTED'].includes(lead.status))
    : leads.filter(lead => lead.status === 'REJECTED');

  // Calculate stats for each tab
  const activeStats = {
    pending: stats?.pending || 0,
    contacted: stats?.contacted || 0,
    converted: stats?.converted || 0,
    total: (stats?.pending || 0) + (stats?.contacted || 0) + (stats?.converted || 0)
  };

  const rejectedStats = {
    rejected: stats?.rejected || 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="h-8 bg-gray-200 rounded-lg w-32 mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-12 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-40 animate-pulse"></div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex space-x-1 mb-8">
              <div className="h-12 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-4 bg-gray-100 rounded w-16 mb-2 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
                      </div>
                      <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Table Skeleton */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <div className="h-6 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
                
                {/* Table Rows */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-100">
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-100 rounded-lg w-16 animate-pulse"></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Referrals Management
              </h1>
              <p className="text-gray-600 font-medium">
                Manage referral leads and track conversions
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl h-12 px-6 font-semibold">
                <Link href="/doctor/pipeline">
                  <ChartBarIcon className="h-4 w-4" />
                  <span>Pipeline</span>
                </Link>
              </Button>
              <Button onClick={copyReferralLink} className="flex items-center space-x-2 bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold">
                <Share2 className="h-4 w-4" />
                <span>Copy Referral Link</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'active'
                  ? 'bg-[#5154e7] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Active ({activeStats.total})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'rejected'
                  ? 'bg-[#5154e7] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Rejected ({rejectedStats.rejected})
            </button>
          </div>

          {/* Statistics - Show different stats based on active tab */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {activeTab === 'active' ? (
                <>
                  <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-gray-600">Pending</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <UserPlus className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-gray-600">Contacted</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.contacted}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-gray-600">Converted</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.converted}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-gray-600">Conversion Rate</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {activeStats.total > 0 ? Math.round((stats.converted / activeStats.total) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-red-100 rounded-xl">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-gray-600">Rejected</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Referrals Table */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">
                {activeTab === 'active' ? 'Active Referrals' : 'Rejected Referrals'}
              </CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                {activeTab === 'active' 
                  ? 'Referrals that are pending, contacted, or converted'
                  : 'Referrals that have been rejected'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-900 font-semibold">Name</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Email</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Referred by</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const StatusIcon = statusConfig[lead.status as keyof typeof statusConfig]?.icon || Clock;
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-semibold text-gray-900">{lead.name}</TableCell>
                        <TableCell className="text-gray-700 font-medium">{lead.email}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">{lead.referrer.name}</p>
                            <p className="text-sm text-gray-500 font-medium">{lead.referrer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[lead.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'} rounded-lg px-3 py-1 font-medium`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[lead.status as keyof typeof statusConfig]?.label || lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700 font-medium">
                          {new Date(lead.createdAt).toLocaleDateString('en-US')}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openUpdateDialog(lead)}
                                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-9 px-3 font-semibold"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Manage
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white rounded-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-bold text-gray-900">Manage Referral</DialogTitle>
                                <DialogDescription className="text-gray-600 font-medium">
                                  Update the status and add notes about this referral
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-6">
                                <div>
                                  <Label className="text-gray-900 font-semibold">Referral Data</Label>
                                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                                    <p className="text-gray-900 font-medium"><strong>Name:</strong> {selectedLead?.name}</p>
                                    <p className="text-gray-900 font-medium"><strong>Email:</strong> {selectedLead?.email}</p>
                                    <p className="text-gray-900 font-medium"><strong>Phone:</strong> {selectedLead?.phone || 'Not provided'}</p>
                                    <p className="text-gray-900 font-medium"><strong>Referred by:</strong> {selectedLead?.referrer.name}</p>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="status" className="text-gray-900 font-semibold">Status</Label>
                                  <Select value={updateForm.status} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 rounded-xl h-10 font-medium">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PENDING">Pending</SelectItem>
                                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                                      <SelectItem value="CONVERTED">Converted</SelectItem>
                                      <SelectItem value="REJECTED">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="notes" className="text-gray-900 font-semibold">Notes</Label>
                                  <Textarea
                                    id="notes"
                                    value={updateForm.notes}
                                    onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Add notes about the contact..."
                                    rows={3}
                                    className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl font-medium"
                                  />
                                </div>
                              </div>

                              <DialogFooter>
                                <Button 
                                  onClick={handleStatusUpdate}
                                  disabled={updating === selectedLead?.id}
                                  className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-6 font-semibold"
                                >
                                  {updating === selectedLead?.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    'Update'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredLeads.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    {activeTab === 'active' ? (
                      <Users className="h-8 w-8 text-gray-400" />
                    ) : (
                      <XCircle className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {activeTab === 'active' ? 'No active referrals found' : 'No rejected referrals found'}
                  </h3>
                  <p className="text-gray-500 font-medium">
                    {activeTab === 'active' 
                      ? 'You don\'t have any active referrals at the moment.'
                      : 'You don\'t have any rejected referrals.'
                    }
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-gray-700 font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 