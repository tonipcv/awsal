const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleCourse() {
  try {
    console.log('🚀 Iniciando criação do curso de exemplo...');

    // Primeiro, vamos buscar um médico para associar o curso
    let doctor = await prisma.user.findFirst({
      where: { role: 'DOCTOR' }
    });

    if (!doctor) {
      console.log('❌ Nenhum médico encontrado. Criando um médico de exemplo...');
      
      doctor = await prisma.user.create({
        data: {
          name: 'Dr. João Silva',
          email: 'dr.joao@exemplo.com',
          role: 'DOCTOR',
          password: 'senha123'
        }
      });
      
      console.log('✅ Médico criado:', doctor.name);
    } else {
      console.log('✅ Médico encontrado:', doctor.name);
    }

    // 1. Criar o curso primeiro
    const course = await prisma.course.create({
      data: {
        name: 'Curso de Mindfulness e Bem-estar',
        description: 'Um curso completo sobre técnicas de mindfulness, meditação e bem-estar mental para uma vida mais equilibrada.',
        status: 'active',
        modalTitle: 'Transforme sua vida com Mindfulness',
        modalDescription: 'Descubra técnicas poderosas de mindfulness que irão revolucionar sua relação com o estresse e ansiedade.',
        modalVideoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        modalButtonText: 'Quero saber mais',
        modalButtonUrl: 'https://exemplo.com/mindfulness',
        doctorId: doctor.id
      }
    });

    console.log('✅ Curso criado:', course.name);

    // 2. Criar módulos
    const module1 = await prisma.module.create({
      data: {
        name: 'Fundamentos do Mindfulness',
        description: 'Introdução aos conceitos básicos e história do mindfulness',
        order: 0,
        courseId: course.id
      }
    });

    const module2 = await prisma.module.create({
      data: {
        name: 'Técnicas Básicas',
        description: 'Aprenda as principais técnicas de mindfulness',
        order: 1,
        courseId: course.id
      }
    });

    const module3 = await prisma.module.create({
      data: {
        name: 'Aplicação no Dia a Dia',
        description: 'Como integrar mindfulness na rotina diária',
        order: 2,
        courseId: course.id
      }
    });

    console.log('✅ Módulos criados:', module1.name, module2.name, module3.name);

    // 3. Criar aulas do módulo 1
    await prisma.lesson.create({
      data: {
        title: 'O que é Mindfulness?',
        description: 'Entenda os conceitos fundamentais da atenção plena',
        content: 'Mindfulness é a prática de estar presente no momento atual, observando pensamentos e sensações sem julgamento...',
        videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        duration: 15,
        order: 0,
        courseId: course.id,
        moduleId: module1.id
      }
    });

    await prisma.lesson.create({
      data: {
        title: 'História e Origens',
        description: 'Conheça as raízes históricas do mindfulness',
        content: 'O mindfulness tem suas origens nas tradições budistas, mas foi adaptado para o contexto ocidental...',
        videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        duration: 20,
        order: 1,
        courseId: course.id,
        moduleId: module1.id
      }
    });

    await prisma.lesson.create({
      data: {
        title: 'Benefícios Científicos',
        description: 'Descubra o que a ciência diz sobre mindfulness',
        content: 'Estudos mostram que a prática regular de mindfulness pode reduzir estresse, ansiedade e melhorar o foco...',
        videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        duration: 25,
        order: 2,
        courseId: course.id,
        moduleId: module1.id
      }
    });

    // 4. Criar aulas do módulo 2
    await prisma.lesson.create({
      data: {
        title: 'Respiração Consciente',
        description: 'Técnica fundamental de observação da respiração',
        content: 'A respiração é nossa âncora para o presente. Nesta aula, você aprenderá a usar a respiração como foco...',
        videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        duration: 30,
        order: 0,
        courseId: course.id,
        moduleId: module2.id
      }
    });

    await prisma.lesson.create({
      data: {
        title: 'Body Scan',
        description: 'Técnica de varredura corporal para relaxamento',
        content: 'O body scan é uma prática que envolve observar sistematicamente cada parte do corpo...',
        videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        duration: 35,
        order: 1,
        courseId: course.id,
        moduleId: module2.id
      }
    });

    // 5. Criar aulas do módulo 3
    await prisma.lesson.create({
      data: {
        title: 'Mindfulness no Trabalho',
        description: 'Técnicas para manter a calma no ambiente profissional',
        content: 'O ambiente de trabalho pode ser estressante. Aprenda estratégias para manter a atenção plena...',
        videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        duration: 20,
        order: 0,
        courseId: course.id,
        moduleId: module3.id
      }
    });

    await prisma.lesson.create({
      data: {
        title: 'Relacionamentos Conscientes',
        description: 'Como aplicar mindfulness nos relacionamentos',
        content: 'A atenção plena pode transformar a qualidade dos nossos relacionamentos...',
        videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        duration: 30,
        order: 1,
        courseId: course.id,
        moduleId: module3.id
      }
    });

    // 6. Criar aulas diretas (sem módulo)
    await prisma.lesson.create({
      data: {
        title: 'Bônus: Meditação Guiada de 10 Minutos',
        description: 'Uma sessão completa de meditação para iniciantes',
        content: 'Esta é uma meditação guiada especial que você pode fazer a qualquer momento...',
        videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        duration: 10,
        order: 0,
        courseId: course.id,
        moduleId: null
      }
    });

    await prisma.lesson.create({
      data: {
        title: 'Recursos Adicionais e Próximos Passos',
        description: 'Materiais complementares e como continuar sua jornada',
        content: 'Parabéns por completar o curso! Aqui estão recursos adicionais para continuar...',
        videoUrl: 'https://www.youtube.com/embed/ZToicYcHIOU',
        duration: 15,
        order: 1,
        courseId: course.id,
        moduleId: null
      }
    });

    console.log('✅ Aulas criadas com sucesso!');

    // 7. Buscar um paciente e atribuir o curso
    const patient = await prisma.user.findFirst({
      where: { role: 'PATIENT' }
    });

    if (patient) {
      await prisma.userCourse.create({
        data: {
          userId: patient.id,
          courseId: course.id,
          status: 'active'
        }
      });
      console.log(`✅ Curso atribuído ao paciente: ${patient.name || patient.email}`);
    } else {
      console.log('ℹ️ Nenhum paciente encontrado para atribuir o curso');
    }

    // 8. Mostrar estatísticas finais
    const finalCourse = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        modules: {
          include: {
            lessons: true
          }
        },
        lessons: {
          where: { moduleId: null }
        }
      }
    });

    const totalLessons = finalCourse.modules.reduce((acc, module) => acc + module.lessons.length, 0) + finalCourse.lessons.length;
    const totalDuration = finalCourse.modules.reduce((acc, module) => 
      acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0), 0
    ) + finalCourse.lessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0);

    console.log('\n🎉 Curso de exemplo criado com sucesso!');
    console.log(`📚 Nome: ${finalCourse.name}`);
    console.log(`🔢 ID: ${finalCourse.id}`);
    console.log(`👨‍⚕️ Médico: ${doctor.name}`);
    console.log(`📖 Módulos: ${finalCourse.modules.length}`);
    console.log(`🎓 Total de aulas: ${totalLessons}`);
    console.log(`⏱️ Duração total: ${Math.floor(totalDuration / 60)}h ${totalDuration % 60}min`);
    console.log('\nAgora você pode acessar:');
    console.log('- Como médico: /doctor/courses');
    console.log('- Como paciente: /courses');

  } catch (error) {
    console.error('❌ Erro ao criar curso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleCourse(); 