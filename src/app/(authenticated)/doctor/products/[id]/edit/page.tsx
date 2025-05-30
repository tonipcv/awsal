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
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
    price: '',
    category: '',
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
          price: data.price?.toString() || '',
          category: data.category || '',
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Name is required');
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
        alert(error.error || 'Error updating product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
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
        alert(error.error || 'Error deleting product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    const num = parseFloat(price);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 lg:ml-64">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#5154e7] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Loading Product</h3>
                <p className="text-sm text-gray-500">Please wait while we fetch the product details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 lg:ml-64">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Product Not Found</h3>
                <p className="text-sm text-gray-500">The product you're looking for doesn't exist or has been removed.</p>
              </div>
              <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white">
                <Link href="/doctor/products">Back to Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 lg:ml-64">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              asChild 
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg"
            >
              <Link href="/doctor/products">
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-sm text-gray-500">Update product information and settings</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-lg bg-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Product
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Information */}
              <Card className="shadow-sm border-gray-200 rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-900">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter product name"
                      required
                      className="h-11 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium text-gray-900">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      placeholder="Enter product category"
                      className="h-11 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-900">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the product and its benefits..."
                      rows={4}
                      className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-lg resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card className="shadow-sm border-gray-200 rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium text-gray-900">Price</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-11 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card className="shadow-sm border-gray-200 rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="isActive" className="text-sm font-medium text-gray-900">Active Product</Label>
                      <p className="text-sm text-gray-500">
                        Active products can be recommended in protocols
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      className="data-[state=checked]:bg-[#5154e7]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSaving} 
                  className="flex-1 bg-[#5154e7] hover:bg-[#4145d1] text-white h-11 rounded-lg font-medium"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  asChild 
                  className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 h-11 rounded-lg font-medium"
                >
                  <Link href="/doctor/products">
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-sm border-gray-200 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Product Icon */}
                  <div className="w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center">
                    <ShoppingBagIcon className="h-12 w-12 text-gray-400" />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {formData.name || 'Product Name'}
                    </h3>
                    {formData.category && (
                      <p className="text-sm text-[#5154e7] font-medium">{formData.category}</p>
                    )}
                  </div>

                  {formData.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {formData.description}
                    </p>
                  )}

                  {/* Price */}
                  {formData.price && (
                    <div className="pt-2">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(formData.price)}
                      </span>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2 pt-2">
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs font-medium",
                        formData.isActive 
                          ? "bg-green-100 text-green-700 border-green-200" 
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      )}
                    >
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Badge>
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