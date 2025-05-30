'use client';

import React, { useState, useEffect } from 'react';
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
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  originalPrice?: number;
  discountPrice?: number;
  discountPercentage?: number;
  purchaseUrl?: string;
  usageStats: number;
  isActive: boolean;
  _count: {
    protocolProducts: number;
  };
  protocolProducts: Array<{
    protocol: {
      id: string;
      name: string;
    };
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productId, setProductId] = useState<string>('');
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

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          brand: data.brand || '',
          imageUrl: data.imageUrl || '',
          originalPrice: data.originalPrice?.toString() || '',
          discountPrice: data.discountPrice?.toString() || '',
          discountPercentage: data.discountPercentage?.toString() || '',
          purchaseUrl: data.purchaseUrl || '',
          usageStats: data.usageStats?.toString() || '0',
          isActive: data.isActive
        });
      } else {
        router.push('/doctor/products');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      router.push('/doctor/products');
    } finally {
      setIsLoading(false);
    }
  };

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
      setIsSaving(true);
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/doctor/products');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar produto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Erro ao atualizar produto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/doctor/products');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erro ao excluir produto');
    } finally {
      setIsDeleting(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Carregando produto...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Produto não encontrado</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6 lg:pl-72">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
            <Link href="/doctor/products">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-light text-slate-800">
              Editar Produto
            </h1>
            <p className="text-sm text-slate-600">
              Atualize as informações do produto
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                Excluindo...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Excluir
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Information */}
              <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-800">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: Protetor Solar Ultra Light"
                      required
                      className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand" className="text-slate-800">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Ex: La Roche-Posay"
                      className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-slate-800">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descreva o produto e seus benefícios..."
                      rows={3}
                      className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageUrl" className="text-slate-800">URL da Imagem</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      type="url"
                      className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Preços</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="originalPrice" className="text-slate-800">Preço Original</Label>
                      <Input
                        id="originalPrice"
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        min="0"
                        className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discountPrice" className="text-slate-800">Preço com Desconto</Label>
                      <Input
                        id="discountPrice"
                        value={formData.discountPrice}
                        onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        min="0"
                        className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {getDiscountPercentage() > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">
                        Desconto calculado: {getDiscountPercentage()}%
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Purchase Details */}
              <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Detalhes de Compra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="purchaseUrl" className="text-slate-800">Link de Compra</Label>
                    <Input
                      id="purchaseUrl"
                      value={formData.purchaseUrl}
                      onChange={(e) => handleInputChange('purchaseUrl', e.target.value)}
                      placeholder="https://loja.com/produto"
                      type="url"
                      className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="usageStats" className="text-slate-800">Estatísticas de Uso (%)</Label>
                    <Input
                      id="usageStats"
                      value={formData.usageStats}
                      onChange={(e) => handleInputChange('usageStats', e.target.value)}
                      placeholder="0"
                      type="number"
                      min="0"
                      max="100"
                      className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Porcentagem de pacientes que usam este produto
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isActive" className="text-slate-800">Produto Ativo</Label>
                      <p className="text-sm text-slate-600">
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

              {/* Protocol Associations */}
              {product.protocolProducts.length > 0 && (
                <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800">Protocolos Associados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {product.protocolProducts.map((pp) => (
                        <div key={pp.protocol.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-sm text-slate-800">{pp.protocol.name}</span>
                          <Button variant="outline" size="sm" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                            <Link href={`/doctor/protocols/${pp.protocol.id}`}>
                              Ver Protocolo
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
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
            <Card className="sticky top-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Product Image */}
                  <div className="w-full h-32 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
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
                      <ShoppingBagIcon className="h-8 w-8 text-slate-400" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <h3 className="font-medium text-slate-800">
                      {formData.name || 'Nome do Produto'}
                    </h3>
                    {formData.brand && (
                      <p className="text-sm text-blue-600">{formData.brand}</p>
                    )}
                  </div>

                  {formData.description && (
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {formData.description}
                    </p>
                  )}

                  {/* Price */}
                  {(formData.originalPrice || formData.discountPrice) && (
                    <div className="flex items-center gap-2">
                      {formData.discountPrice && formData.originalPrice ? (
                        <>
                          <span className="text-sm font-medium text-blue-600">
                            {formatPrice(formData.discountPrice)}
                          </span>
                          <span className="text-sm text-slate-400 line-through">
                            {formatPrice(formData.originalPrice)}
                          </span>
                          {getDiscountPercentage() > 0 && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                              -{getDiscountPercentage()}%
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-sm font-medium text-slate-800">
                          {formatPrice(formData.originalPrice || formData.discountPrice)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {formData.isActive ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-slate-200">
                        Inativo
                      </Badge>
                    )}
                    {formData.usageStats && parseInt(formData.usageStats) > 0 && (
                      <span className="text-xs text-slate-500">
                        {formData.usageStats}% dos pacientes
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-xs text-slate-500">
                    <p>{product._count.protocolProducts} protocolos associados</p>
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