import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAddPatient, canCreateProtocol, canCreateCourse, canCreateProduct } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Tipo de verificação não especificado' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'patients':
        result = await canAddPatient(session.user.id);
        break;
      case 'protocols':
        result = await canCreateProtocol(session.user.id);
        break;
      case 'courses':
        result = await canCreateCourse(session.user.id);
        break;
      case 'products':
        result = await canCreateProduct(session.user.id);
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo de verificação inválido' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao verificar limite:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 