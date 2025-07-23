'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Gift, 
  Plus, 
  Edit, 
  Trash2,
  Star,
  Users,
  AlertTriangle
} from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  creditsRequired: number;
  maxRedemptions?: number;
  currentRedemptions: number;
  isActive: boolean;
  createdAt: string;
  redemptions: Array<{
    id: string;
    status: string;
    redeemedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function DoctorRewardsPage() {
  const { data: session } = useSession();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    creditsRequired: '',
    maxRedemptions: ''
  });

  // Load rewards
  const loadRewards = async () => {
    try {
      const response = await fetch('/api/referrals/rewards');
      const data = await response.json();

      if (response.ok) {
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadRewards();
    }
  }, [session]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      creditsRequired: '',
      maxRedemptions: ''
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.description || !formData.creditsRequired) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/referrals/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          creditsRequired: parseInt(formData.creditsRequired),
          maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : null
        })
      });

      if (response.ok) {
        await loadRewards();
        setShowCreateDialog(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating reward:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedReward || !formData.title || !formData.description || !formData.creditsRequired) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/referrals/rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          title: formData.title,
          description: formData.description,
          creditsRequired: parseInt(formData.creditsRequired),
          maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : null
        })
      });

      if (response.ok) {
        await loadRewards();
        setShowEditDialog(false);
        setSelectedReward(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error editing reward:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (reward: Reward) => {
    try {
      const response = await fetch('/api/referrals/rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: reward.id,
          isActive: !reward.isActive
        })
      });

      if (response.ok) {
        await loadRewards();
      }
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const handleDelete = async (reward: Reward) => {
    if (!confirm('Are you sure you want to delete this reward?')) {
      return;
    }

    try {
      const response = await fetch(`/api/referrals/rewards?rewardId=${reward.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadRewards();
      } else {
        const data = await response.json();
        alert(data.error || 'Error deleting reward');
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
    }
  };

  const openEditDialog = (reward: Reward) => {
    setSelectedReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description,
      creditsRequired: reward.creditsRequired.toString(),
      maxRedemptions: reward.maxRedemptions?.toString() || ''
    });
    setShowEditDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
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
              <div className="h-12 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
            </div>

            {/* Rewards Grid Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded-lg w-2/3 mt-1 animate-pulse"></div>
                      </div>
                      <div className="h-6 w-12 bg-gray-100 rounded-full animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                      <div className="h-6 bg-gray-100 rounded-full w-16 animate-pulse"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-100 rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <div className="h-10 bg-gray-100 rounded-xl flex-1 animate-pulse"></div>
                      <div className="h-10 bg-gray-100 rounded-xl w-10 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Rewards Management
              </h1>
              <p className="text-sm text-gray-600">
                Create and manage rewards for your referral program
              </p>
            </div>
            <Button onClick={openCreateDialog} className="flex items-center space-x-2 bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold">
              <Plus className="h-4 w-4" />
              <span>New Reward</span>
            </Button>
          </div>

          {/* Rewards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} className={`relative bg-white border-gray-200 shadow-lg rounded-2xl ${!reward.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <Gift className="h-5 w-5 text-purple-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {reward.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={reward.isActive}
                        onCheckedChange={() => handleToggleActive(reward)}
                      />
                    </div>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {reward.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Credits required:</span>
                      <Badge variant="secondary" className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 rounded-lg px-3 py-1 font-medium">
                        <Star className="h-3 w-3" />
                        <span>{reward.creditsRequired}</span>
                      </Badge>
                    </div>

                    {reward.maxRedemptions && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Redemption limit:</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {reward.currentRedemptions} / {reward.maxRedemptions}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Total redeemed:</span>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-900">{reward.currentRedemptions}</span>
                      </div>
                    </div>

                    {reward.maxRedemptions && reward.currentRedemptions >= reward.maxRedemptions && (
                      <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-200">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">Limit reached</span>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(reward)}
                        className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-9 font-semibold"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(reward)}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 rounded-xl h-9 px-3 font-semibold"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {rewards.length === 0 && (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-100 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Gift className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No rewards created</h3>
                  <p className="text-gray-500 font-medium mb-6">
                    Create rewards to incentivize referrals from your patients
                  </p>
                  <Button onClick={openCreateDialog} className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Reward
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Reward Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="bg-white rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">New Reward</DialogTitle>
                <DialogDescription className="text-gray-600 font-medium">
                  Create a new reward for the referral system
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-gray-900 font-semibold">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Free consultation"
                    className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-900 font-semibold">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the reward details..."
                    rows={3}
                    className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="creditsRequired" className="text-gray-900 font-semibold">Credits required *</Label>
                    <Input
                      id="creditsRequired"
                      type="number"
                      min="1"
                      value={formData.creditsRequired}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditsRequired: e.target.value }))}
                      placeholder="1"
                      className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxRedemptions" className="text-gray-900 font-semibold">Redemption limit</Label>
                    <Input
                      id="maxRedemptions"
                      type="number"
                      min="1"
                      value={formData.maxRedemptions}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxRedemptions: e.target.value }))}
                      placeholder="Unlimited"
                      className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={submitting || !formData.title || !formData.description || !formData.creditsRequired}
                  className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-6 font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Reward'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Reward Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="bg-white rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">Edit Reward</DialogTitle>
                <DialogDescription className="text-gray-600 font-medium">
                  Update the reward information
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="edit-title" className="text-gray-900 font-semibold">Title *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Free consultation"
                    className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description" className="text-gray-900 font-semibold">Description *</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the reward details..."
                    rows={3}
                    className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-creditsRequired" className="text-gray-900 font-semibold">Credits required *</Label>
                    <Input
                      id="edit-creditsRequired"
                      type="number"
                      min="1"
                      value={formData.creditsRequired}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditsRequired: e.target.value }))}
                      placeholder="1"
                      className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-maxRedemptions" className="text-gray-900 font-semibold">Redemption limit</Label>
                    <Input
                      id="edit-maxRedemptions"
                      type="number"
                      min="1"
                      value={formData.maxRedemptions}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxRedemptions: e.target.value }))}
                      placeholder="Unlimited"
                      className="mt-2 bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold">
                  Cancel
                </Button>
                <Button 
                  onClick={handleEdit}
                  disabled={submitting || !formData.title || !formData.description || !formData.creditsRequired}
                  className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-6 font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 