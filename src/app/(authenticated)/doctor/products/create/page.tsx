'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  ShoppingBagIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    imageUrl: '',
    originalPrice: '',
    discountPrice: '',
    discountPercentage: '',
    purchaseUrl: '',
    usageStats: '0',
    isActive: true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate discount percentage
    if (field === 'originalPrice' || field === 'discountPrice') {
      const original = field === 'originalPrice' ? parseFloat(value as string) : parseFloat(formData.originalPrice);
      const discount = field === 'discountPrice' ? parseFloat(value as string) : parseFloat(formData.discountPrice);
      
      if (original && discount && original > discount) {
        const percentage = Math.round(((original - discount) / original) * 100);
        setFormData(prev => ({
          ...prev,
          [field]: value,
          discountPercentage: percentage.toString()
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/doctor/products');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar produto');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Erro ao criar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    const num = parseFloat(price);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getDiscountPercentage = () => {
    const original = parseFloat(formData.originalPrice);
    const discount = parseFloat(formData.discountPrice);
    if (original && discount && original > discount) {
      return Math.round(((original - discount) / original) * 100);
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8 space-y-8">
        
          {/* Header */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-3">
              <Link href="/doctor/products">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Novo Produto
              </h1>
              <p className="text-gray-600 font-medium">
                Adicione um novo produto para recomendar aos pacientes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Basic Information */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-gray-900 font-semibold">Nome do Produto *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Ex: Protetor Solar Ultra Light"
                        required
                        className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="brand" className="text-gray-900 font-semibold">Marca</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="Ex: La Roche-Posay"
                        className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-gray-900 font-semibold">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descreva o produto e seus benefícios..."
                        rows={4}
                        className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="imageUrl" className="text-gray-900 font-semibold">URL da Imagem</Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                        placeholder="https://exemplo.com/imagem.jpg"
                        type="url"
                        className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">Preços</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="originalPrice" className="text-gray-900 font-semibold">Preço Original</Label>
                        <Input
                          id="originalPrice"
                          value={formData.originalPrice}
                          onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          min="0"
                          className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                        />
                      </div>

                      <div>
                        <Label htmlFor="discountPrice" className="text-gray-900 font-semibold">Preço com Desconto</Label>
                        <Input
                          id="discountPrice"
                          value={formData.discountPrice}
                          onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          min="0"
                          className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                        />
                      </div>
                    </div>

                    {getDiscountPercentage() > 0 && (
                      <div className="p-4 bg-[#5154e7] bg-opacity-10 rounded-xl border border-[#5154e7] border-opacity-20">
                        <p className="text-[#5154e7] font-semibold">
                          Desconto calculado: {getDiscountPercentage()}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Purchase Details */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">Detalhes de Compra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="purchaseUrl" className="text-gray-900 font-semibold">Link de Compra</Label>
                      <Input
                        id="purchaseUrl"
                        value={formData.purchaseUrl}
                        onChange={(e) => handleInputChange('purchaseUrl', e.target.value)}
                        placeholder="https://loja.com/produto"
                        type="url"
                        className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="usageStats" className="text-gray-900 font-semibold">Estatísticas de Uso (%)</Label>
                      <Input
                        id="usageStats"
                        value={formData.usageStats}
                        onChange={(e) => handleInputChange('usageStats', e.target.value)}
                        placeholder="0"
                        type="number"
                        min="0"
                        max="100"
                        className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                      />
                      <p className="text-sm text-gray-600 font-medium mt-2">
                        Porcentagem de pacientes que usam este produto
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Status */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="isActive" className="text-gray-900 font-semibold">Produto Ativo</Label>
                        <p className="text-gray-600 font-medium mt-1">
                          Produtos ativos podem ser recomendados em protocolos
                        </p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Criando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Criar Produto
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 px-6 font-semibold">
                    <Link href="/doctor/products">
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Cancelar
                    </Link>
                  </Button>
                </div>
              </form>
            </div>

            {/* Preview */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6 bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Product Image */}
                    <div className="w-full h-40 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                      {formData.imageUrl ? (
                        <img 
                          src={formData.imageUrl} 
                          alt={formData.name || 'Produto'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <ShoppingBagIcon className="h-10 w-10 text-gray-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {formData.name || 'Nome do Produto'}
                      </h3>
                      {formData.brand && (
                        <p className="text-[#5154e7] font-semibold mt-1">{formData.brand}</p>
                      )}
                    </div>

                    {formData.description && (
                      <p className="text-gray-600 font-medium line-clamp-3">
                        {formData.description}
                      </p>
                    )}

                    {/* Price */}
                    {(formData.originalPrice || formData.discountPrice) && (
                      <div className="flex items-center gap-3">
                        {formData.discountPrice && formData.originalPrice ? (
                          <>
                            <span className="text-lg font-bold text-[#5154e7]">
                              {formatPrice(formData.discountPrice)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(formData.originalPrice)}
                            </span>
                            {getDiscountPercentage() > 0 && (
                              <Badge className="bg-[#5154e7] text-white border-[#5154e7] font-semibold">
                                -{getDiscountPercentage()}%
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(formData.originalPrice || formData.discountPrice)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-3">
                      {formData.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 font-semibold">
                          Inativo
                        </Badge>
                      )}
                      {formData.usageStats && parseInt(formData.usageStats) > 0 && (
                        <span className="text-sm text-gray-600 font-medium">
                          {formData.usageStats}% dos pacientes
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 