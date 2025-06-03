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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  Gift, 
  UserPlus, 
  Building2, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Share2,
  Copy,
  Mail,
  Phone,
  MapPin,
  Star,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface ClinicReferral {
  id: string;
  clinicName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  clinicAddress?: string;
  specialties?: string;
  notes?: string;
  status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  rewardStatus: 'PENDING' | 'APPROVED' | 'CREDITED';
  rewardMonths?: number;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  totalRewardsEarned: number;
  pendingRewards: number;
}

const statusConfig = {
  PENDING: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONTACTED: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: UserPlus },
  CONVERTED: { label: 'Converted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const rewardStatusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  CREDITED: { label: 'Credited', color: 'bg-green-100 text-green-800' }
};

export default function ReferClinicPage() {
  const { data: session } = useSession();
  const [referrals, setReferrals] = useState<ClinicReferral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);

  const [formData, setFormData] = useState({
    clinicName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    clinicAddress: '',
    specialties: '',
    notes: ''
  });

  // Load data
  const loadData = async () => {
    try {
      const response = await fetch('/api/doctor/clinic-referrals');
      const data = await response.json();

      if (response.ok) {
        setReferrals(data.referrals || []);
        setStats(data.stats || {
          totalReferrals: 0,
          pendingReferrals: 0,
          convertedReferrals: 0,
          totalRewardsEarned: 0,
          pendingRewards: 0
        });
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
  }, [session]);

  const resetForm = () => {
    setFormData({
      clinicName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      clinicAddress: '',
      specialties: '',
      notes: ''
    });
  };

  const handleSubmitReferral = async () => {
    if (!formData.clinicName || !formData.contactName || !formData.contactEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/doctor/clinic-referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Clinic referral submitted successfully!');
        await loadData();
        setShowReferralDialog(false);
        resetForm();
      } else {
        toast.error(data.error || 'Error submitting referral');
      }
    } catch (error) {
      console.error('Error submitting referral:', error);
      toast.error('Error submitting referral');
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferralLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const referralLink = `${baseUrl}/clinic-signup?ref=${session?.user?.id}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
                Refer a Clinic & Get 1 Month Free
              </h1>
              <p className="text-gray-600 mt-1">
                Refer clinics to our platform and earn 1 month of free subscription for each successful conversion
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={copyReferralLink}
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Copy Referral Link
              </Button>
              <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200">
                    <Building2 className="h-4 w-4 mr-2" />
                    Refer New Clinic
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-turquoise" />
                      Refer a New Clinic
                    </DialogTitle>
                    <DialogDescription>
                      Fill in the clinic details below. We'll reach out to them and you'll earn 1 month free if they sign up.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clinicName">Clinic Name *</Label>
                        <Input
                          id="clinicName"
                          value={formData.clinicName}
                          onChange={(e) => setFormData(prev => ({ ...prev, clinicName: e.target.value }))}
                          placeholder="Medical Center Name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactName">Contact Person *</Label>
                        <Input
                          id="contactName"
                          value={formData.contactName}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                          placeholder="Dr. John Smith"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contactEmail">Contact Email *</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                          placeholder="contact@clinic.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          value={formData.contactPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="clinicAddress">Clinic Address</Label>
                      <Input
                        id="clinicAddress"
                        value={formData.clinicAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, clinicAddress: e.target.value }))}
                        placeholder="123 Medical St, City, State"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="specialties">Specialties</Label>
                      <Input
                        id="specialties"
                        value={formData.specialties}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                        placeholder="Cardiology, Internal Medicine, etc."
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional information about the clinic..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowReferralDialog(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitReferral}
                      disabled={submitting}
                      className="bg-turquoise hover:bg-turquoise/90 text-black"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Building2 className="h-4 w-4 mr-2" />
                          Submit Referral
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Total Referrals</p>
                    <p className="text-2xl font-light text-gray-900">{stats?.totalReferrals || 0}</p>
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
                    <p className="text-2xl font-light text-gray-900">{stats?.pendingReferrals || 0}</p>
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
                    <p className="text-2xl font-light text-gray-900">{stats?.convertedReferrals || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-turquoise/20 rounded-xl">
                    <Gift className="h-6 w-6 text-turquoise" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Months Earned</p>
                    <p className="text-2xl font-light text-gray-900">{stats?.totalRewardsEarned || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Pending Rewards</p>
                    <p className="text-2xl font-light text-gray-900">{stats?.pendingRewards || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card className="bg-gradient-to-r from-turquoise/10 to-blue-50 border border-turquoise/20 shadow-lg rounded-2xl mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-turquoise" />
                How the Referral Program Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-4 bg-turquoise rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Refer a Clinic</h3>
                  <p className="text-sm text-gray-600">Submit clinic details through our form or share your referral link</p>
                </div>
                <div className="text-center">
                  <div className="p-4 bg-blue-500 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. We Contact Them</h3>
                  <p className="text-sm text-gray-600">Our team reaches out to the clinic and guides them through the signup process</p>
                </div>
                <div className="text-center">
                  <div className="p-4 bg-green-500 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Earn Your Reward</h3>
                  <p className="text-sm text-gray-600">Get 1 month free subscription when the clinic successfully signs up</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referrals Table */}
          <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Your Clinic Referrals
              </CardTitle>
              <CardDescription>
                Track the status of your clinic referrals and rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
                  <p className="text-gray-600 mb-4">Start referring clinics to earn free months!</p>
                  <Button 
                    onClick={() => setShowReferralDialog(true)}
                    className="bg-turquoise hover:bg-turquoise/90 text-black"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Refer Your First Clinic
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clinic</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reward Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((referral) => {
                        const StatusIcon = statusConfig[referral.status].icon;
                        return (
                          <TableRow key={referral.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{referral.clinicName}</p>
                                {referral.clinicAddress && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {referral.clinicAddress}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{referral.contactName}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {referral.contactEmail}
                                </p>
                                {referral.contactPhone && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {referral.contactPhone}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig[referral.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[referral.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={rewardStatusConfig[referral.rewardStatus].color}>
                                {rewardStatusConfig[referral.rewardStatus].label}
                                {referral.rewardMonths && ` (${referral.rewardMonths} month${referral.rewardMonths > 1 ? 's' : ''})`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {formatDate(referral.createdAt)}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 