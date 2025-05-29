'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  EyeIcon, 
  PaintBrushIcon, 
  Cog6ToothIcon,
  ClipboardDocumentIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface ConsultationForm {
  id: string;
  title: string;
  description: string;
  welcomeMessage?: string;
  successMessage: string;
  nameLabel: string;
  emailLabel: string;
  whatsappLabel: string;
  showAgeField: boolean;
  ageLabel: string;
  ageRequired: boolean;
  showSpecialtyField: boolean;
  specialtyLabel: string;
  specialtyOptions?: string;
  specialtyRequired: boolean;
  showMessageField: boolean;
  messageLabel: string;
  messageRequired: boolean;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  requireReferralCode: boolean;
  autoReply: boolean;
  autoReplyMessage?: string;
}

export default function ConsultationFormPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState<ConsultationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialtyList, setSpecialtyList] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    fetchForm();
  }, []);

  useEffect(() => {
    if (form?.specialtyOptions) {
      try {
        setSpecialtyList(JSON.parse(form.specialtyOptions));
      } catch {
        setSpecialtyList([]);
      }
    }
  }, [form?.specialtyOptions]);

  const fetchForm = async () => {
    try {
      const response = await fetch('/api/consultation-form');
      if (response.ok) {
        const data = await response.json();
        setForm(data);
      } else {
        // Criar formulário padrão se não existir
        setForm({
          id: '',
          title: 'Agende sua consulta',
          description: 'Preencha seus dados para agendar uma consulta',
          welcomeMessage: '',
          successMessage: 'Obrigado! Entraremos em contato em breve para confirmar sua consulta.',
          nameLabel: 'Nome completo',
          emailLabel: 'E-mail',
          whatsappLabel: 'WhatsApp',
          showAgeField: false,
          ageLabel: 'Idade',
          ageRequired: false,
          showSpecialtyField: false,
          specialtyLabel: 'Especialidade de interesse',
          specialtyOptions: '[]',
          specialtyRequired: false,
          showMessageField: true,
          messageLabel: 'Mensagem (opcional)',
          messageRequired: false,
          primaryColor: '#3B82F6',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          isActive: true,
          requireReferralCode: false,
          autoReply: true,
          autoReplyMessage: ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    
    setSaving(true);
    try {
      const formData = {
        ...form,
        specialtyOptions: JSON.stringify(specialtyList)
      };

      const response = await fetch('/api/consultation-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedForm = await response.json();
        setForm(updatedForm);
        alert('Formulário salvo com sucesso!');
      } else {
        alert('Erro ao salvar formulário');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar formulário');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialtyList.includes(newSpecialty.trim())) {
      setSpecialtyList([...specialtyList, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    setSpecialtyList(specialtyList.filter((_, i) => i !== index));
  };

  const copyFormLink = () => {
    if (session?.user?.id) {
      const link = `${window.location.origin}/consultation/${session.user.id}`;
      navigator.clipboard.writeText(link);
      alert('Link do formulário copiado!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Formulário de Consulta
          </h1>
          <p className="text-slate-600">
            Personalize o formulário que seus pacientes preencherão para agendar consultas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configurações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Cog6ToothIcon className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-slate-700">Título do Formulário</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Agende sua consulta"
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700">Descrição</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Breve descrição do formulário"
                    rows={2}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="welcomeMessage" className="text-slate-700">Mensagem de Boas-vindas (opcional)</Label>
                  <Textarea
                    id="welcomeMessage"
                    value={form.welcomeMessage || ''}
                    onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
                    placeholder="Mensagem personalizada de boas-vindas"
                    rows={2}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="successMessage" className="text-slate-700">Mensagem de Sucesso</Label>
                  <Textarea
                    id="successMessage"
                    value={form.successMessage}
                    onChange={(e) => setForm({ ...form, successMessage: e.target.value })}
                    placeholder="Mensagem exibida após o envio"
                    rows={2}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Campos do Formulário */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <ClipboardDocumentIcon className="h-5 w-5" />
                  Campos do Formulário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campos Obrigatórios */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Campos Obrigatórios</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="nameLabel" className="text-slate-700">Label do Nome</Label>
                      <Input
                        id="nameLabel"
                        value={form.nameLabel}
                        onChange={(e) => setForm({ ...form, nameLabel: e.target.value })}
                        className="bg-white border-slate-300 text-slate-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailLabel" className="text-slate-700">Label do E-mail</Label>
                      <Input
                        id="emailLabel"
                        value={form.emailLabel}
                        onChange={(e) => setForm({ ...form, emailLabel: e.target.value })}
                        className="bg-white border-slate-300 text-slate-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsappLabel" className="text-slate-700">Label do WhatsApp</Label>
                      <Input
                        id="whatsappLabel"
                        value={form.whatsappLabel}
                        onChange={(e) => setForm({ ...form, whatsappLabel: e.target.value })}
                        className="bg-white border-slate-300 text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                {/* Campo Idade */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900">Campo Idade</h4>
                    <Switch
                      checked={form.showAgeField}
                      onCheckedChange={(checked) => setForm({ ...form, showAgeField: checked })}
                    />
                  </div>
                  {form.showAgeField && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ageLabel" className="text-slate-700">Label da Idade</Label>
                        <Input
                          id="ageLabel"
                          value={form.ageLabel}
                          onChange={(e) => setForm({ ...form, ageLabel: e.target.value })}
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          checked={form.ageRequired}
                          onCheckedChange={(checked) => setForm({ ...form, ageRequired: checked })}
                        />
                        <Label className="text-slate-700">Campo obrigatório</Label>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-200" />

                {/* Campo Especialidade */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900">Campo Especialidade</h4>
                    <Switch
                      checked={form.showSpecialtyField}
                      onCheckedChange={(checked) => setForm({ ...form, showSpecialtyField: checked })}
                    />
                  </div>
                  {form.showSpecialtyField && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="specialtyLabel" className="text-slate-700">Label da Especialidade</Label>
                          <Input
                            id="specialtyLabel"
                            value={form.specialtyLabel}
                            onChange={(e) => setForm({ ...form, specialtyLabel: e.target.value })}
                            className="bg-white border-slate-300 text-slate-900"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            checked={form.specialtyRequired}
                            onCheckedChange={(checked) => setForm({ ...form, specialtyRequired: checked })}
                          />
                          <Label className="text-slate-700">Campo obrigatório</Label>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-slate-700">Opções de Especialidade</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={newSpecialty}
                            onChange={(e) => setNewSpecialty(e.target.value)}
                            placeholder="Ex: Cardiologia"
                            onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                          />
                          <Button onClick={addSpecialty} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                            Adicionar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {specialtyList.map((specialty, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200"
                              onClick={() => removeSpecialty(index)}
                            >
                              {specialty} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-200" />

                {/* Campo Mensagem */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900">Campo Mensagem</h4>
                    <Switch
                      checked={form.showMessageField}
                      onCheckedChange={(checked) => setForm({ ...form, showMessageField: checked })}
                    />
                  </div>
                  {form.showMessageField && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="messageLabel" className="text-slate-700">Label da Mensagem</Label>
                        <Input
                          id="messageLabel"
                          value={form.messageLabel}
                          onChange={(e) => setForm({ ...form, messageLabel: e.target.value })}
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          checked={form.messageRequired}
                          onCheckedChange={(checked) => setForm({ ...form, messageRequired: checked })}
                        />
                        <Label className="text-slate-700">Campo obrigatório</Label>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configurações Avançadas */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <PaintBrushIcon className="h-5 w-5" />
                  Aparência e Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor" className="text-slate-700">Cor Principal</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="bg-white border-slate-300 h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="backgroundColor" className="text-slate-700">Cor de Fundo</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={form.backgroundColor}
                      onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                      className="bg-white border-slate-300 h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="textColor" className="text-slate-700">Cor do Texto</Label>
                    <Input
                      id="textColor"
                      type="color"
                      value={form.textColor}
                      onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                      className="bg-white border-slate-300 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700">Formulário Ativo</Label>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700">Exigir Código de Indicação</Label>
                    <Switch
                      checked={form.requireReferralCode}
                      onCheckedChange={(checked) => setForm({ ...form, requireReferralCode: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700">Resposta Automática</Label>
                    <Switch
                      checked={form.autoReply}
                      onCheckedChange={(checked) => setForm({ ...form, autoReply: checked })}
                    />
                  </div>
                </div>

                {form.autoReply && (
                  <div>
                    <Label htmlFor="autoReplyMessage" className="text-slate-700">Mensagem de Resposta Automática</Label>
                    <Textarea
                      id="autoReplyMessage"
                      value={form.autoReplyMessage || ''}
                      onChange={(e) => setForm({ ...form, autoReplyMessage: e.target.value })}
                      placeholder="Mensagem enviada automaticamente por email"
                      rows={3}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview e Ações */}
          <div className="space-y-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <EyeIcon className="h-5 w-5" />
                  Ações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Salvando...' : 'Salvar Formulário'}
                </Button>
                
                <Button 
                  onClick={copyFormLink}
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                
                <Button 
                  onClick={() => window.open(`/consultation/${session?.user?.id}`, '_blank')}
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Preview</CardTitle>
                <CardDescription className="text-slate-600">Como o formulário aparecerá</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="p-4 rounded-lg border-2 border-dashed"
                  style={{ 
                    backgroundColor: form.backgroundColor,
                    color: form.textColor,
                    borderColor: form.primaryColor + '40'
                  }}
                >
                  <h3 className="text-lg font-semibold mb-2">{form.title}</h3>
                  <p className="text-sm mb-4">{form.description}</p>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium">{form.nameLabel} *</label>
                      <div className="h-6 bg-gray-200 rounded mt-1"></div>
                    </div>
                    
                    <div>
                      <label className="block font-medium">{form.emailLabel} *</label>
                      <div className="h-6 bg-gray-200 rounded mt-1"></div>
                    </div>
                    
                    <div>
                      <label className="block font-medium">{form.whatsappLabel} *</label>
                      <div className="h-6 bg-gray-200 rounded mt-1"></div>
                    </div>
                    
                    {form.showAgeField && (
                      <div>
                        <label className="block font-medium">
                          {form.ageLabel} {form.ageRequired && '*'}
                        </label>
                        <div className="h-6 bg-gray-200 rounded mt-1"></div>
                      </div>
                    )}
                    
                    {form.showSpecialtyField && (
                      <div>
                        <label className="block font-medium">
                          {form.specialtyLabel} {form.specialtyRequired && '*'}
                        </label>
                        <div className="h-6 bg-gray-200 rounded mt-1"></div>
                      </div>
                    )}
                    
                    {form.showMessageField && (
                      <div>
                        <label className="block font-medium">
                          {form.messageLabel} {form.messageRequired && '*'}
                        </label>
                        <div className="h-12 bg-gray-200 rounded mt-1"></div>
                      </div>
                    )}
                    
                    <div 
                      className="h-8 rounded text-white text-center leading-8 text-xs font-medium"
                      style={{ backgroundColor: form.primaryColor }}
                    >
                      Enviar
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 