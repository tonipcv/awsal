import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    // Validações básicas
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ 
        error: 'Nome, email e senha são obrigatórios' 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Senha deve ter pelo menos 6 caracteres' 
      }, { status: 400 });
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Este email já está cadastrado' 
      }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário sem médico (role PATIENT_NOCLINIC)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim() || null,
        role: 'PATIENT_NOCLINIC', // Role específica para pacientes sem clínica
        doctorId: null, // Sem médico inicialmente
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        doctorId: true,
        createdAt: true
      }
    });

    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        hasClinic: false,
        needsClinic: true,
        createdAt: user.createdAt
      },
      token,
      status: 'noclinic' // Indica que precisa ser vinculado a uma clínica
    });

  } catch (error) {
    console.error('Erro no registro mobile:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 