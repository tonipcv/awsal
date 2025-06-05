import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { text, context } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });
    }

    // Define o prompt baseado no contexto
    let systemPrompt = '';
    
    switch (context) {
      case 'medical_notes':
        systemPrompt = `Você é um assistente médico especializado em melhorar notas clínicas. 
        Sua tarefa é melhorar o texto fornecido mantendo:
        - Precisão médica e terminologia apropriada
        - Clareza e objetividade
        - Estrutura profissional
        - Todas as informações importantes do texto original
        
        Melhore o texto tornando-o mais claro, profissional e bem estruturado, mas mantenha o mesmo significado e informações.
        Responda APENAS com o texto melhorado, sem explicações adicionais.`;
        break;
      default:
        systemPrompt = `Você é um assistente especializado em melhorar textos.
        Sua tarefa é melhorar o texto fornecido mantendo:
        - O significado original
        - Clareza e objetividade
        - Estrutura profissional
        - Todas as informações importantes
        
        Melhore o texto tornando-o mais claro, profissional e bem estruturado.
        Responda APENAS com o texto melhorado, sem explicações adicionais.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const improvedText = completion.choices[0]?.message?.content || text;

    return NextResponse.json({ 
      improvedText: improvedText.trim(),
      originalText: text 
    });

  } catch (error) {
    console.error('Error improving text:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 