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
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONTACTED: { label: 'Contatado', color: 'bg-blue-100 text-blue-800', icon: UserPlus },
  CONVERTED: { label: 'Convertido', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: XCircle },
  EXPIRED: { label: 'Expirado', color: 'bg-gray-100 text-gray-800', icon: Clock }
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

  // Carregar dados
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
      console.error('Erro ao carregar dados:', error);
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
      console.error('Erro ao atualizar status:', error);
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
    // Aqui você poderia adicionar um toast de sucesso
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
              <h1 className="text-3xl font-bold text-slate-900">Sistema de Indicações</h1>
              <p className="text-slate-600 mt-2">Gerencie suas indicações e acompanhe conversões</p>
            </div>
            <Button onClick={copyReferralLink} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Share2 className="h-4 w-4" />
              <span>Copiar Link de Indicação</span>
            </Button>
          </div>

          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Total</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Pendentes</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <UserPlus className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Contatados</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.contacted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Convertidos</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.converted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Taxa Conversão</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <Card className="mb-6 bg-white border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div>
                  <Label htmlFor="status-filter" className="text-slate-700">Filtrar por Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 bg-white border-slate-300 text-slate-900">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendentes</SelectItem>
                      <SelectItem value="CONTACTED">Contatados</SelectItem>
                      <SelectItem value="CONVERTED">Convertidos</SelectItem>
                      <SelectItem value="REJECTED">Rejeitados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Indicações */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Indicações Recebidas</CardTitle>
              <CardDescription className="text-slate-600">
                Lista de todas as indicações recebidas e seus status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-700">Nome</TableHead>
                    <TableHead className="text-slate-700">Email</TableHead>
                    <TableHead className="text-slate-700">Indicado por</TableHead>
                    <TableHead className="text-slate-700">Status</TableHead>
                    <TableHead className="text-slate-700">Data</TableHead>
                    <TableHead className="text-slate-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const StatusIcon = statusConfig[lead.status as keyof typeof statusConfig]?.icon || Clock;
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium text-slate-900">{lead.name}</TableCell>
                        <TableCell className="text-slate-700">{lead.email}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{lead.referrer.name}</p>
                            <p className="text-sm text-slate-500">{lead.referrer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[lead.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[lead.status as keyof typeof statusConfig]?.label || lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openUpdateDialog(lead)}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Gerenciar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white">
                              <DialogHeader>
                                <DialogTitle className="text-slate-900">Gerenciar Indicação</DialogTitle>
                                <DialogDescription className="text-slate-600">
                                  Atualize o status e adicione observações sobre esta indicação
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-slate-700">Dados da Indicação</Label>
                                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <p className="text-slate-900"><strong>Nome:</strong> {selectedLead?.name}</p>
                                    <p className="text-slate-900"><strong>Email:</strong> {selectedLead?.email}</p>
                                    <p className="text-slate-900"><strong>Telefone:</strong> {selectedLead?.phone || 'Não informado'}</p>
                                    <p className="text-slate-900"><strong>Indicado por:</strong> {selectedLead?.referrer.name}</p>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="status" className="text-slate-700">Status</Label>
                                  <Select value={updateForm.status} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                                      <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PENDING">Pendente</SelectItem>
                                      <SelectItem value="CONTACTED">Contatado</SelectItem>
                                      <SelectItem value="CONVERTED">Convertido</SelectItem>
                                      <SelectItem value="REJECTED">Rejeitado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="notes" className="text-slate-700">Observações</Label>
                                  <Textarea
                                    id="notes"
                                    value={updateForm.notes}
                                    onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Adicione observações sobre o contato..."
                                    rows={3}
                                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                                  />
                                </div>
                              </div>

                              <DialogFooter>
                                <Button 
                                  onClick={handleStatusUpdate}
                                  disabled={updating === selectedLead?.id}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {updating === selectedLead?.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Atualizando...
                                    </>
                                  ) : (
                                    'Atualizar'
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
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma indicação encontrada</h3>
                  <p className="text-slate-500">
                    {statusFilter === 'ALL' 
                      ? 'Você ainda não recebeu indicações. Compartilhe seu link de indicação!'
                      : 'Nenhuma indicação encontrada com este filtro.'
                    }
                  </p>
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-slate-700">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Próxima
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