'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

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
  createdAt: Date;
  _count: {
    protocolProducts: number;
  };
  protocolProducts?: Array<{
    protocol: {
      id: string;
      name: string;
    };
  }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductDetails = async (productId: string) => {
    try {
      setIsLoadingProduct(true);
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedProduct(data);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading product details:', error);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-light text-slate-800 mb-2">
              Produtos
            </h1>
            <p className="text-sm text-slate-600">
              Gerencie os produtos recomendados em seus protocolos
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/doctor/products/create">
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Produto
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center">
                <ShoppingBagIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-slate-800">
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca.' 
                    : 'Comece criando seu primeiro produto para recomendar aos pacientes.'
                  }
                </p>
                {!searchTerm && (
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/doctor/products/create">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Criar Primeiro Produto
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-white/80 border-slate-200/50 backdrop-blur-sm hover:bg-slate-50/80 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-medium text-slate-800 mb-1">
                        {product.name}
                      </CardTitle>
                      {product.brand && (
                        <p className="text-sm text-blue-600">{product.brand}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!product.isActive && (
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 border border-slate-200">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Image */}
                  <div className="w-full h-32 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBagIcon className="h-8 w-8 text-slate-400" />
                    )}
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  {(product.originalPrice || product.discountPrice) && (
                    <div className="flex items-center gap-2">
                      {product.discountPrice && product.originalPrice ? (
                        <>
                          <span className="text-sm font-medium text-blue-600">
                            {formatPrice(product.discountPrice)}
                          </span>
                          <span className="text-sm text-slate-400 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                          {product.discountPercentage && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border border-blue-200">
                              -{product.discountPercentage}%
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-sm font-medium text-slate-800">
                          {formatPrice(product.originalPrice || product.discountPrice)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{product._count.protocolProducts} protocolos</span>
                    {product.usageStats > 0 && (
                      <span>{product.usageStats}% dos pacientes</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => loadProductDetails(product.id)}
                      disabled={isLoadingProduct}
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900" 
                      asChild
                    >
                      <Link href={`/doctor/products/${product.id}/edit`}>
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Product Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-medium text-slate-800">
                Detalhes do Produto
              </DialogTitle>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="space-y-6">
                {/* Product Image and Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="w-full h-48 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    {selectedProduct.imageUrl ? (
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBagIcon className="h-12 w-12 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 mb-1">
                        {selectedProduct.name}
                      </h3>
                      {selectedProduct.brand && (
                        <p className="text-sm text-blue-600">{selectedProduct.brand}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {selectedProduct.isActive ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border border-green-200">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 border border-slate-200">
                          Inativo
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    {(selectedProduct.originalPrice || selectedProduct.discountPrice) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-800">Preço</h4>
                        <div className="flex items-center gap-2">
                          {selectedProduct.discountPrice && selectedProduct.originalPrice ? (
                            <>
                              <span className="text-lg font-medium text-blue-600">
                                {formatPrice(selectedProduct.discountPrice)}
                              </span>
                              <span className="text-sm text-slate-400 line-through">
                                {formatPrice(selectedProduct.originalPrice)}
                              </span>
                              {selectedProduct.discountPercentage && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border border-blue-200">
                                  -{selectedProduct.discountPercentage}%
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-lg font-medium text-slate-800">
                              {formatPrice(selectedProduct.originalPrice || selectedProduct.discountPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-800">Descrição</h4>
                    <p className="text-sm text-slate-600">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                {/* Purchase URL */}
                {selectedProduct.purchaseUrl && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-800">Link de Compra</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <a href={selectedProduct.purchaseUrl} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="h-3 w-3 mr-2" />
                        Abrir Link
                      </a>
                    </Button>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-800">Protocolos</h4>
                    <p className="text-sm text-slate-600">
                      {selectedProduct._count?.protocolProducts || 0} protocolos associados
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-800">Uso pelos Pacientes</h4>
                    <p className="text-sm text-slate-600">
                      {selectedProduct.usageStats}% dos pacientes
                    </p>
                  </div>
                </div>

                {/* Protocol Associations */}
                {selectedProduct.protocolProducts && selectedProduct.protocolProducts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-800">Protocolos Associados</h4>
                    <div className="space-y-2">
                      {selectedProduct.protocolProducts.map((pp) => (
                        <div key={pp.protocol.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-sm text-slate-800">{pp.protocol.name}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Link href={`/doctor/protocols/${pp.protocol.id}`}>
                              Ver Protocolo
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creation Date */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-800">Data de Criação</h4>
                  <p className="text-sm text-slate-600">
                    {formatDate(selectedProduct.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900" 
                    asChild
                  >
                    <Link href={`/doctor/products/${selectedProduct.id}/edit`}>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Editar Produto
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 