import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()

    const thought = await prisma.thought.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!thought) {
      return NextResponse.json({ error: 'Thought not found' }, { status: 404 })
    }

    const updatedThought = await prisma.thought.update({
      where: { id },
      data: { content: content.trim() },
    })

    return NextResponse.json(updatedThought)
  } catch (error) {
    console.error('Error updating thought:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json({ error: 'Error updating thought' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()

    const thought = await prisma.thought.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!thought) {
      return NextResponse.json({ error: 'Thought not found' }, { status: 404 })
    }

    await prisma.thought.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting thought:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json({ error: 'Error deleting thought' }, { status: 500 })
  }
} 