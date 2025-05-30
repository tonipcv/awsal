import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/products - Listar produtos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    let session;
    if (userEmail) {
      // Buscar usuário pelo email para casos especiais
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      if (user) {
        session = { user: { id: user.id } };
      }
    } else {
      session = await getServerSession(authOptions);
    }
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem visualizar produtos.' }, { status: 403 });
    }

    try {
      // Buscar todos os produtos (já que não há doctorId na tabela)
      const products = await prisma.products.findMany({
        include: {
          _count: {
            select: {
              protocol_products: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transformar para o formato esperado pelo frontend
      const transformedProducts = products.map((product: any) => ({
        ...product,
        // Adicionar campos que o frontend espera mas que não existem na tabela
        brand: null,
        imageUrl: null,
        originalPrice: product.price,
        discountPrice: null,
        discountPercentage: null,
        purchaseUrl: null,
        usageStats: 0,
        doctorId: session.user.id, // Simular que pertence ao médico atual
        _count: {
          protocolProducts: product._count?.protocol_products || 0
        }
      }));

      return NextResponse.json(transformedProducts);
    } catch (dbError) {
      console.error('❌ Erro ao buscar produtos:', dbError);
      return NextResponse.json({ error: 'Erro ao buscar produtos no banco de dados' }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

// POST /api/products - Criar novo produto
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem criar produtos.' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      originalPrice,
      category = 'Geral'
    } = body;

    // Validar campos obrigatórios
    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Gerar ID único
    const { createId } = await import('@paralleldrive/cuid2');

    const product = await prisma.products.create({
      data: {
        id: createId(),
        name,
        description,
        price: originalPrice ? parseFloat(originalPrice) : 0,
        category,
        isActive: true
      }
    });

    // Retornar no formato esperado pelo frontend
    const transformedProduct = {
      ...product,
      brand: null,
      imageUrl: null,
      originalPrice: product.price,
      discountPrice: null,
      discountPercentage: null,
      purchaseUrl: null,
      usageStats: 0,
      doctorId: session.user.id
    };

    return NextResponse.json(transformedProduct, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating product:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
} 