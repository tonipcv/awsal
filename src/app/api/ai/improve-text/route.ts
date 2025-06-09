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
      case 'protocol_name':
        systemPrompt = `Você é um assistente médico especializado em melhorar nomes de protocolos médicos.
        Sua tarefa é melhorar o nome do protocolo fornecido mantendo:
        - Clareza e profissionalismo médico
        - Terminologia médica apropriada
        - Concisão e objetividade
        - O significado e propósito original do protocolo
        
        Melhore o nome tornando-o mais claro, profissional e descritivo, mas mantenha o mesmo significado.
        Responda APENAS com o nome melhorado, sem explicações adicionais.`;
        break;
      case 'protocol_description':
        systemPrompt = `Você é um assistente médico especializado em melhorar descrições de protocolos médicos.
        Sua tarefa é melhorar a descrição do protocolo fornecida mantendo:
        - Precisão médica e terminologia apropriada
        - Clareza e objetividade profissional
        - Estrutura bem organizada
        - Todas as informações importantes do texto original
        - Foco no propósito e benefícios do protocolo
        
        Melhore a descrição tornando-a mais clara, profissional e informativa, mas mantenha o mesmo significado e informações.
        Responda APENAS com a descrição melhorada, sem explicações adicionais.`;
        break;
      case 'task_title':
        systemPrompt = `Você é um assistente médico especializado em melhorar títulos de tarefas em protocolos médicos.
        Sua tarefa é melhorar o título da tarefa fornecido mantendo:
        - Clareza e concisão
        - Terminologia médica apropriada quando necessário
        - Ação específica e objetiva
        - O significado e propósito original da tarefa
        
        Melhore o título tornando-o mais claro, específico e profissional, mas mantenha o mesmo significado.
        Responda APENAS com o título melhorado, sem explicações adicionais.`;
        break;
      case 'task_description':
        systemPrompt = `Você é um assistente médico especializado em melhorar descrições de tarefas em protocolos médicos.
        Sua tarefa é melhorar a descrição da tarefa fornecida mantendo:
        - Clareza e objetividade
        - Instruções específicas e práticas
        - Terminologia médica apropriada
        - Todas as informações importantes do texto original
        - Foco na execução prática da tarefa
        
        Melhore a descrição tornando-a mais clara, específica e útil para o paciente, mas mantenha o mesmo significado e informações.
        Responda APENAS com a descrição melhorada, sem explicações adicionais.`;
        break;
      case 'task_explanation':
        systemPrompt = `Você é um assistente médico especializado em melhorar explicações detalhadas de tarefas em protocolos médicos.
        Sua tarefa é melhorar a explicação completa da tarefa fornecida mantendo:
        - Precisão médica e científica
        - Clareza e didática para pacientes
        - Estrutura bem organizada
        - Todas as informações importantes do texto original
        - Foco educativo e informativo
        
        Melhore a explicação tornando-a mais clara, educativa e bem estruturada, mas mantenha o mesmo significado e informações.
        Responda APENAS com a explicação melhorada, sem explicações adicionais.`;
        break;
      case 'session_name':
        systemPrompt = `Você é um assistente médico especializado em melhorar nomes de sessões em protocolos médicos.
        Sua tarefa é melhorar o nome da sessão fornecido mantendo:
        - Clareza e concisão
        - Terminologia médica apropriada quando necessário
        - Descrição específica do conjunto de atividades
        - O significado e propósito original da sessão
        
        Melhore o nome tornando-o mais claro, específico e profissional, mas mantenha o mesmo significado.
        Responda APENAS com o nome melhorado, sem explicações adicionais.`;
        break;
      case 'session_description':
        systemPrompt = `Você é um assistente médico especializado em melhorar descrições de sessões em protocolos médicos.
        Sua tarefa é melhorar a descrição da sessão fornecida mantendo:
        - Clareza e objetividade
        - Visão geral das atividades da sessão
        - Terminologia médica apropriada
        - Todas as informações importantes do texto original
        - Foco no propósito e organização da sessão
        
        Melhore a descrição tornando-a mais clara, informativa e bem estruturada, mas mantenha o mesmo significado e informações.
        Responda APENAS com a descrição melhorada, sem explicações adicionais.`;
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