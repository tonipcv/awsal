const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedHabits() {
  try {
    console.log('🌱 Iniciando seed de hábitos de exemplo...');

    // Buscar um usuário paciente para adicionar hábitos
    const patient = await prisma.user.findFirst({
      where: {
        role: 'PATIENT'
      }
    });

    if (!patient) {
      console.log('⚠️  Nenhum paciente encontrado. Criando hábitos de exemplo sem usuário...');
      return;
    }

    console.log(`👤 Usando paciente: ${patient.name || patient.email}`);

    // Hábitos de exemplo
    const sampleHabits = [
      {
        title: 'Meditar 10 minutos',
        category: 'personal'
      },
      {
        title: 'Beber 2L de água',
        category: 'health'
      },
      {
        title: 'Fazer exercícios',
        category: 'health'
      },
      {
        title: 'Ler 30 minutos',
        category: 'personal'
      },
      {
        title: 'Organizar tarefas do dia',
        category: 'work'
      }
    ];

    const createdHabits = [];

    for (const habitData of sampleHabits) {
      const habit = await prisma.habit.create({
        data: {
          userId: patient.id,
          title: habitData.title,
          category: habitData.category,
        }
      });

      createdHabits.push(habit);
      console.log(`✅ Hábito criado: ${habit.title}`);
    }

    // Adicionar alguns progressos de exemplo para os últimos 7 dias
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Para cada hábito, adicionar progresso aleatório
      for (const habit of createdHabits) {
        const isChecked = Math.random() > 0.3; // 70% de chance de estar marcado
        
        if (isChecked) {
          await prisma.habitProgress.create({
            data: {
              habitId: habit.id,
              date: date,
              isChecked: true
            }
          });
        }
      }
    }

    console.log('📊 Progresso de exemplo adicionado para os últimos 7 dias');

    // Verificar os hábitos criados
    const habitsCount = await prisma.habit.count({
      where: {
        userId: patient.id
      }
    });

    const progressCount = await prisma.habitProgress.count({
      where: {
        habit: {
          userId: patient.id
        }
      }
    });

    console.log('📈 Estatísticas finais:');
    console.log(`   - Hábitos criados: ${habitsCount}`);
    console.log(`   - Progressos criados: ${progressCount}`);

    console.log('🎉 Seed de hábitos concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed
seedHabits()
  .then(() => {
    console.log('✅ Script de seed executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }); 