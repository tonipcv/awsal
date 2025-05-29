import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET /api/products/[id] - Buscar produto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId = resolvedParams.id;

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem visualizar produtos.' }, { status: 403 });
    }

    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        doctorId: session.user.id
      },
      include: {
        _count: {
          select: {
            protocol_products: true
          }
        },
        protocol_products: {
          include: {
            protocols: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Transformar para o formato esperado pelo frontend
    const transformedProduct = {
      ...product,
      _count: {
        protocolProducts: product._count.protocol_products
      },
      protocolProducts: product.protocol_products.map(pp => ({
        protocol: {
          id: pp.protocols.id,
          name: pp.protocols.name
        }
      }))
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}

// PUT /api/products/[id] - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem editar produtos.' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      brand, 
      imageUrl, 
      originalPrice, 
      discountPrice, 
      discountPercentage, 
      purchaseUrl, 
      usageStats, 
      isActive 
    } = body;

    // Verificar se o produto pertence ao médico
    const existingProduct = await prisma.products.findFirst({
      where: {
        id: productId,
        doctorId: session.user.id
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Validar campos obrigatórios
    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const updatedProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        name,
        description,
        brand,
        imageUrl,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        discountPercentage: discountPercentage ? parseInt(discountPercentage) : null,
        purchaseUrl,
        usageStats: usageStats ? parseInt(usageStats) : 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Excluir produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem excluir produtos.' }, { status: 403 });
    }

    // Verificar se o produto pertence ao médico
    const existingProduct = await prisma.products.findFirst({
      where: {
        id: productId,
        doctorId: session.user.id
      },
      include: {
        protocol_products: true
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Verificar se há protocolos usando este produto
    if (existingProduct.protocol_products.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir produto que está sendo usado em protocolos. Remova das associações primeiro.' 
      }, { status: 400 });
    }

    // Excluir produto
    await prisma.products.delete({
      where: { id: productId }
    });

    return NextResponse.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 });
  }
} 