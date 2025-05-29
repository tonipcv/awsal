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

  // Carregar recompensas
  const loadRewards = async () => {
    try {
      const response = await fetch('/api/referrals/rewards');
      const data = await response.json();

      if (response.ok) {
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error('Erro ao carregar recompensas:', error);
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
      console.error('Erro ao criar recompensa:', error);
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
      console.error('Erro ao editar recompensa:', error);
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
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDelete = async (reward: Reward) => {
    if (!confirm('Tem certeza que deseja deletar esta recompensa?')) {
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
        alert(data.error || 'Erro ao deletar recompensa');
      }
    } catch (error) {
      console.error('Erro ao deletar recompensa:', error);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-700">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Recompensas</h1>
              <p className="text-slate-600 mt-2">Configure recompensas para o sistema de indicações</p>
            </div>
            <Button onClick={openCreateDialog} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" />
              <span>Nova Recompensa</span>
            </Button>
          </div>

          {/* Lista de Recompensas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} className={`relative bg-white border-slate-200 ${!reward.isActive ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-lg text-slate-900">{reward.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={reward.isActive}
                        onCheckedChange={() => handleToggleActive(reward)}
                      />
                    </div>
                  </div>
                  <CardDescription className="text-slate-600">{reward.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Créditos necessários:</span>
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{reward.creditsRequired}</span>
                      </Badge>
                    </div>

                    {reward.maxRedemptions && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Limite de resgates:</span>
                        <span className="text-sm font-medium text-slate-900">
                          {reward.currentRedemptions} / {reward.maxRedemptions}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Total resgatado:</span>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-slate-500" />
                        <span className="text-sm font-medium text-slate-900">{reward.currentRedemptions}</span>
                      </div>
                    </div>

                    {reward.maxRedemptions && reward.currentRedemptions >= reward.maxRedemptions && (
                      <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Limite atingido</span>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(reward)}
                        className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(reward)}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
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
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma recompensa criada</h3>
                  <p className="text-slate-500 mb-4">
                    Crie recompensas para incentivar indicações dos seus pacientes
                  </p>
                  <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Recompensa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dialog Criar Recompensa */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-slate-900">Nova Recompensa</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Crie uma nova recompensa para o sistema de indicações
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-slate-700">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Consulta gratuita"
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva os detalhes da recompensa..."
                    rows={3}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="creditsRequired" className="text-slate-700">Créditos necessários *</Label>
                    <Input
                      id="creditsRequired"
                      type="number"
                      min="1"
                      value={formData.creditsRequired}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditsRequired: e.target.value }))}
                      placeholder="1"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxRedemptions" className="text-slate-700">Limite de resgates</Label>
                    <Input
                      id="maxRedemptions"
                      type="number"
                      min="1"
                      value={formData.maxRedemptions}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxRedemptions: e.target.value }))}
                      placeholder="Ilimitado"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={submitting || !formData.title || !formData.description || !formData.creditsRequired}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Recompensa'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Editar Recompensa */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-slate-900">Editar Recompensa</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Atualize os dados da recompensa
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title" className="text-slate-700">Título *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Consulta gratuita"
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description" className="text-slate-700">Descrição *</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva os detalhes da recompensa..."
                    rows={3}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-creditsRequired" className="text-slate-700">Créditos necessários *</Label>
                    <Input
                      id="edit-creditsRequired"
                      type="number"
                      min="1"
                      value={formData.creditsRequired}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditsRequired: e.target.value }))}
                      placeholder="1"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-maxRedemptions" className="text-slate-700">Limite de resgates</Label>
                    <Input
                      id="edit-maxRedemptions"
                      type="number"
                      min="1"
                      value={formData.maxRedemptions}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxRedemptions: e.target.value }))}
                      placeholder="Ilimitado"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleEdit}
                  disabled={submitting || !formData.title || !formData.description || !formData.creditsRequired}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
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