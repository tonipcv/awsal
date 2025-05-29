/* eslint-disable */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Thought, Habit, Checkpoint } from '@prisma/client'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface FormattedThought {
  content: string;
  date: string;
}

interface FormattedHabit {
  title: string;
  category: string;
  completionRate: string;
}

interface FormattedCheckpoint {
  emotion: string;
  description: string;
  date: string;
}

interface UserContext {
  thoughts: FormattedThought[];
  habits: FormattedHabit[];
  checkpoints: FormattedCheckpoint[];
}

async function getUserContext(): Promise<UserContext | null> {
  try {
    // Buscar pensamentos
    const thoughts = await prisma.thought.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10 // Últimos 10 pensamentos
    });

    // Buscar hábitos e progresso
    const habits = await prisma.habit.findMany({
      include: {
        progress: {
          orderBy: { date: 'desc' },
          take: 30 // Últimos 30 dias
        }
      }
    });

    // Buscar checkpoints
    const checkpoints = await prisma.checkpoint.findMany({
      orderBy: { date: 'desc' },
      take: 10 // Últimos 10 checkpoints
    });

    // Formatar dados para o contexto
    const formattedThoughts = thoughts.map((t: Thought) => ({
      content: t.content,
      date: format(t.createdAt, "d 'de' MMMM", { locale: ptBR })
    }));

    const formattedHabits = habits.map((h: Habit & { progress: { isChecked: boolean }[] }) => ({
      title: h.title,
      category: h.category,
      completionRate: h.progress.length > 0 
        ? (h.progress.filter(p => p.isChecked).length / h.progress.length * 100).toFixed(1) + '%'
        : '0%'
    }));

    const formattedCheckpoints = checkpoints
      .filter((c): c is Checkpoint & { emotion: string } => c.emotion !== null)
      .map((c) => ({
        emotion: c.emotion,
        description: c.isCompleted ? 'Concluído' : 'Pendente',
        date: format(c.date, "d 'de' MMMM", { locale: ptBR })
      }));

    return {
      thoughts: formattedThoughts,
      habits: formattedHabits,
      checkpoints: formattedCheckpoints
    };
  } catch (error) {
    console.error('Erro ao buscar contexto do usuário:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'O campo "messages" é obrigatório e deve ser um array.' },
        { status: 400 }
      )
    }

    // Buscar contexto do usuário
    const userContext = await getUserContext();
    
    const systemPrompt = `Você é um assistente pessoal inteligente e empático, especializado em análise comportamental e desenvolvimento pessoal.

CONTEXTO DO USUÁRIO:
${userContext ? `
Pensamentos Recentes:
${userContext.thoughts.map(t => `- ${t.date}: ${t.content}`).join('\n')}

Hábitos e Progresso:
${userContext.habits.map(h => `- ${h.title} (${h.category}): ${h.completionRate} de conclusão`).join('\n')}

Checkpoints Emocionais:
${userContext.checkpoints.map(c => `- ${c.date}: ${c.emotion} - ${c.description}`).join('\n')}
` : 'Não foi possível acessar o contexto do usuário.'}

SUAS CAPACIDADES:
1. Analisar padrões nos pensamentos e emoções do usuário
2. Identificar áreas de melhoria nos hábitos
3. Sugerir estratégias personalizadas para desenvolvimento pessoal
4. Fornecer insights baseados no histórico do usuário
5. Manter um tom empático e construtivo

Por favor, use este contexto para fornecer respostas mais personalizadas e relevantes. Mantenha suas respostas concisas e práticas.`

    const { messages } = body
    console.log('Iniciando requisição para Deepseek com mensagens:', messages)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 2000
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log('Status da resposta:', response.status)

      const rawResponse = await response.text()
      console.log('Corpo da resposta:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: rawResponse.substring(0, 200)
      })

      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}: ${rawResponse}`)
      }

      let data
      try {
        data = JSON.parse(rawResponse)
      } catch (e) {
        console.error('Erro ao parsear JSON:', e)
        throw new Error(`Falha ao parsear resposta: ${rawResponse}`)
      }

      if (!data?.choices?.[0]?.message?.content) {
        console.error('Resposta inválida:', data)
        throw new Error('Resposta sem conteúdo válido')
      }

      return NextResponse.json({
        response: data.choices[0].message.content
      })

    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout: A API demorou mais de 60 segundos para responder')
      }
      throw fetchError
    } finally {
      clearTimeout(timeoutId)
    }

  } catch (error: any) {
    console.error('Erro completo:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })

    return NextResponse.json(
      { 
        error: 'Erro ao processar a requisição: ' + error.message,
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          cause: error.cause
        } : undefined
      },
      { status: 500 }
    )
  }
} 