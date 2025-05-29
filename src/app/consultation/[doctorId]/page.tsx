'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
}

interface FormData {
  name: string;
  email: string;
  whatsapp: string;
  age?: string;
  specialty?: string;
  message?: string;
  referralCode?: string;
}

export default function ConsultationFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.doctorId as string;
  const referralCode = searchParams.get('code');

  const [form, setForm] = useState<ConsultationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [specialtyOptions, setSpecialtyOptions] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    whatsapp: '',
    age: '',
    specialty: '',
    message: '',
    referralCode: referralCode || ''
  });

  useEffect(() => {
    fetchForm();
  }, [doctorId]);

  useEffect(() => {
    if (form?.specialtyOptions) {
      try {
        setSpecialtyOptions(JSON.parse(form.specialtyOptions));
      } catch {
        setSpecialtyOptions([]);
      }
    }
  }, [form?.specialtyOptions]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/consultation-form/${doctorId}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data);
      } else {
        setError('Formulário não encontrado ou inativo');
      }
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      setError('Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validações
    if (!formData.name.trim() || !formData.email.trim() || !formData.whatsapp.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (form.ageRequired && form.showAgeField && !formData.age?.trim()) {
      setError(`${form.ageLabel} é obrigatório`);
      return;
    }

    if (form.specialtyRequired && form.showSpecialtyField && !formData.specialty?.trim()) {
      setError(`${form.specialtyLabel} é obrigatório`);
      return;
    }

    if (form.messageRequired && form.showMessageField && !formData.message?.trim()) {
      setError(`${form.messageLabel} é obrigatório`);
      return;
    }

    if (form.requireReferralCode && !formData.referralCode?.trim()) {
      setError('Código de indicação é obrigatório');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/consultation-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          doctorId,
          ...formData,
          age: formData.age ? parseInt(formData.age) : null
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao enviar formulário');
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
      setError('Erro ao enviar formulário');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Formulário Indisponível</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted && form) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: form.backgroundColor }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2" style={{ color: form.textColor }}>
                Formulário Enviado!
              </h2>
              <p className="text-gray-600">{form.successMessage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: form.backgroundColor }}
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: form.textColor }}>
              {form.title}
            </CardTitle>
            <CardDescription>
              {form.description}
            </CardDescription>
            {form.welcomeMessage && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">{form.welcomeMessage}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Nome */}
              <div>
                <Label htmlFor="name" className="required">
                  {form.nameLabel} *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Digite seu ${form.nameLabel.toLowerCase()}`}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="required">
                  {form.emailLabel} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={`Digite seu ${form.emailLabel.toLowerCase()}`}
                  required
                />
              </div>

              {/* WhatsApp */}
              <div>
                <Label htmlFor="whatsapp" className="required">
                  {form.whatsappLabel} *
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              {/* Idade */}
              {form.showAgeField && (
                <div>
                  <Label htmlFor="age" className={form.ageRequired ? 'required' : ''}>
                    {form.ageLabel} {form.ageRequired && '*'}
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Digite sua idade"
                    required={form.ageRequired}
                  />
                </div>
              )}

              {/* Especialidade */}
              {form.showSpecialtyField && specialtyOptions.length > 0 && (
                <div>
                  <Label htmlFor="specialty" className={form.specialtyRequired ? 'required' : ''}>
                    {form.specialtyLabel} {form.specialtyRequired && '*'}
                  </Label>
                  <Select
                    value={formData.specialty}
                    onValueChange={(value) => setFormData({ ...formData, specialty: value })}
                    required={form.specialtyRequired}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Selecione ${form.specialtyLabel.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {specialtyOptions.map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Mensagem */}
              {form.showMessageField && (
                <div>
                  <Label htmlFor="message" className={form.messageRequired ? 'required' : ''}>
                    {form.messageLabel} {form.messageRequired && '*'}
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Digite sua mensagem"
                    rows={4}
                    required={form.messageRequired}
                  />
                </div>
              )}

              {/* Código de Indicação */}
              {(form.requireReferralCode || referralCode) && (
                <div>
                  <Label htmlFor="referralCode" className={form.requireReferralCode ? 'required' : ''}>
                    Código de Indicação {form.requireReferralCode && '*'}
                  </Label>
                  <Input
                    id="referralCode"
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                    placeholder="Digite o código de indicação"
                    required={form.requireReferralCode}
                    readOnly={!!referralCode}
                  />
                  {referralCode && (
                    <p className="text-sm text-gray-600 mt-1">
                      Você foi indicado por alguém especial! 🎉
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
                style={{ backgroundColor: form.primaryColor }}
              >
                {submitting ? 'Enviando...' : 'Enviar Formulário'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 