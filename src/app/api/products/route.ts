import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/products - Listar produtos do médico
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

    let products;
    try {
      // Tentar usar o Prisma client primeiro
      products = await prisma.products.findMany({
        where: {
          doctorId: session.user.id
        },
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
    } catch (prismaError) {
      // Fallback para query raw
      const rawProducts = await prisma.$queryRaw`
        SELECT * FROM products WHERE doctorId = ${session.user.id} ORDER BY createdAt DESC
      `;
      
      // Buscar contagem de protocol_products para cada produto
      const productsWithCount = await Promise.all(
        (rawProducts as any[]).map(async (product) => {
          const countResult = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM protocol_products WHERE productId = ${product.id}
          `;
          return {
            ...product,
            _count: {
              protocol_products: (countResult as any[])[0]?.count || 0
            }
          };
        })
      );
      
      products = productsWithCount;
    }

    // Transformar para o formato esperado pelo frontend
    const transformedProducts = products.map((product: any) => ({
      ...product,
      _count: {
        protocolProducts: product._count?.protocol_products || product._count?.protocolProducts || 0
      }
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
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
      brand, 
      imageUrl, 
      originalPrice, 
      discountPrice, 
      discountPercentage, 
      purchaseUrl, 
      usageStats, 
      isActive 
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
        brand,
        imageUrl,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        discountPercentage: discountPercentage ? parseInt(discountPercentage) : null,
        purchaseUrl,
        usageStats: usageStats ? parseInt(usageStats) : 0,
        isActive: isActive !== undefined ? isActive : true,
        doctorId: session.user.id
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
} 