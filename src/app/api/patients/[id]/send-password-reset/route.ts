import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// Configuração do transporter com SMTP do Pulse
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true para porta 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Para desenvolvimento local
  }
});

// Função para enviar email de redefinição de senha
async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/set-password?token=${token}`;
    
    const mailOptions = {
      from: `"CXLUS" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Redefinição de Senha',
      html: `
        <p>Você solicitou a redefinição de senha para sua conta CXLUS.</p>
        <p>Clique no link abaixo para definir uma nova senha:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Se você não solicitou esta redefinição, por favor ignore este email.</p>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado via SMTP Pulse:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

// Usando a nova sintaxe do Next.js para rotas dinâmicas
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the doctor's ID from the session user's email
    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Obtenha o ID do paciente de forma segura
    const patientId = params.id;

    // Check if doctor has access to this patient
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: patientId,
        isActive: true
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!relationship || !relationship.patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patient = relationship.patient;

    // For now, just return a success message
    // TODO: Implement actual email sending functionality
    // Gerar um token simples para redefinição de senha
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Em uma implementação real, você salvaria este token em algum lugar
    // e o associaria ao usuário com um tempo de expiração
    
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/set-password?token=${token}`;
    
    console.log(`Sending password reset email to ${patient.email}`);
    
    const emailSent = await sendPasswordResetEmail(
      patient.email,
      token
    );
    
    console.log(`Email sent: ${emailSent}`);
    
    return NextResponse.json({
      message: 'Password reset email sent successfully',
      resetUrl: resetUrl // For testing purposes
    });

  } catch (error) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 