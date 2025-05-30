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
  TrendingUp
} from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState('ALL');
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
        status: statusFilter,
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
  }, [session, statusFilter, page]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="lg:ml-64">
          <div className="flex items-center space-x-3 text-gray-700">
            <Loader2 className="h-8 w-8 animate-spin text-[#5154e7]" />
            <span className="font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8 space-y-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral System</h1>
              <p className="text-gray-600 font-medium">Manage your referrals and track conversions</p>
            </div>
            <Button onClick={copyReferralLink} className="flex items-center space-x-2 bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold">
              <Share2 className="h-4 w-4" />
              <span>Copy Referral Link</span>
            </Button>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                        {stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-8 bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div>
                  <Label htmlFor="status-filter" className="text-gray-900 font-semibold">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 rounded-xl h-10 font-medium">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="CONVERTED">Converted</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referrals Table */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Received Referrals</CardTitle>
              <CardDescription className="text-gray-600 font-medium">
                List of all received referrals and their status
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
                  {leads.map((lead) => {
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

              {leads.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No referrals found</h3>
                  <p className="text-gray-500 font-medium">
                    {statusFilter === 'ALL' 
                      ? 'You haven\'t received any referrals yet. Share your referral link!'
                      : 'No referrals found with this filter.'
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