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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-16 h-16 mx-auto mb-6"
          />
          <p className="text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8 space-y-8">
        
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Produtos
              </h1>
              <p className="text-gray-600 font-medium">
                Gerencie os produtos recomendados em seus protocolos
              </p>
            </div>
            <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold">
              <Link href="/doctor/products/create">
                <PlusIcon className="h-4 w-4 mr-2" />
                Novo Produto
              </Link>
            </Button>
          </div>

          {/* Search */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                />
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                  </h3>
                  <p className="text-gray-600 font-medium mb-6">
                    {searchTerm 
                      ? 'Tente ajustar os termos de busca.' 
                      : 'Comece criando seu primeiro produto para recomendar aos pacientes.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold">
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
                <Card key={product.id} className="bg-white border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                          {product.name}
                        </CardTitle>
                        {product.brand && (
                          <p className="text-sm text-[#5154e7] font-semibold">{product.brand}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!product.isActive && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 font-semibold">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Image */}
                    <div className="w-full h-40 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBagIcon className="h-10 w-10 text-gray-400" />
                      )}
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-gray-600 font-medium line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Price */}
                    {(product.originalPrice || product.discountPrice) && (
                      <div className="flex items-center gap-3">
                        {product.discountPrice && product.originalPrice ? (
                          <>
                            <span className="text-lg font-bold text-[#5154e7]">
                              {formatPrice(product.discountPrice)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                            {product.discountPercentage && (
                              <Badge className="bg-[#5154e7] text-white border-[#5154e7] font-semibold">
                                -{product.discountPercentage}%
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(product.originalPrice || product.discountPrice)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600 font-medium">
                      <span>{product._count.protocolProducts} protocolos</span>
                      {product.usageStats > 0 && (
                        <span>{product.usageStats}% dos pacientes</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 font-semibold"
                        onClick={() => loadProductDetails(product.id)}
                        disabled={isLoadingProduct}
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 font-semibold" 
                        asChild
                      >
                        <Link href={`/doctor/products/${product.id}/edit`}>
                          <PencilIcon className="h-4 w-4 mr-2" />
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Detalhes do Produto
                </DialogTitle>
              </DialogHeader>
              
              {selectedProduct && (
                <div className="space-y-8">
                  {/* Product Image and Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="w-full h-64 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                      {selectedProduct.imageUrl ? (
                        <img 
                          src={selectedProduct.imageUrl} 
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBagIcon className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedProduct.name}
                        </h3>
                        {selectedProduct.brand && (
                          <p className="text-lg text-[#5154e7] font-semibold">{selectedProduct.brand}</p>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-3">
                        {selectedProduct.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 font-semibold">
                            Inativo
                          </Badge>
                        )}
                      </div>

                      {/* Price */}
                      {(selectedProduct.originalPrice || selectedProduct.discountPrice) && (
                        <div className="space-y-3">
                          <h4 className="text-lg font-bold text-gray-900">Preço</h4>
                          <div className="flex items-center gap-3">
                            {selectedProduct.discountPrice && selectedProduct.originalPrice ? (
                              <>
                                <span className="text-2xl font-bold text-[#5154e7]">
                                  {formatPrice(selectedProduct.discountPrice)}
                                </span>
                                <span className="text-lg text-gray-400 line-through">
                                  {formatPrice(selectedProduct.originalPrice)}
                                </span>
                                {selectedProduct.discountPercentage && (
                                  <Badge className="bg-[#5154e7] text-white border-[#5154e7] font-semibold">
                                    -{selectedProduct.discountPercentage}%
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-2xl font-bold text-gray-900">
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
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-gray-900">Descrição</h4>
                      <p className="text-gray-600 font-medium">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  {/* Purchase URL */}
                  {selectedProduct.purchaseUrl && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-gray-900">Link de Compra</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                      >
                        <a href={selectedProduct.purchaseUrl} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Abrir Link
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-gray-900">Protocolos</h4>
                      <p className="text-gray-600 font-medium">
                        {selectedProduct._count?.protocolProducts || 0} protocolos associados
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-gray-900">Uso pelos Pacientes</h4>
                      <p className="text-gray-600 font-medium">
                        {selectedProduct.usageStats}% dos pacientes
                      </p>
                    </div>
                  </div>

                  {/* Protocol Associations */}
                  {selectedProduct.protocolProducts && selectedProduct.protocolProducts.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-gray-900">Protocolos Associados</h4>
                      <div className="space-y-3">
                        {selectedProduct.protocolProducts.map((pp) => (
                          <div key={pp.protocol.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="font-bold text-gray-900">{pp.protocol.name}</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-8 px-3 font-semibold"
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
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-gray-900">Data de Criação</h4>
                    <p className="text-gray-600 font-medium">
                      {formatDate(selectedProduct.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 font-semibold" 
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
                      className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 px-6 font-semibold"
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
    </div>
  );
} 