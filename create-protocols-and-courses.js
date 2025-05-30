const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProtocolsAndCourses() {
  try {
    console.log('🔍 Verificando pacientes...');
    
    // Buscar todos os pacientes
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      include: {
        doctor: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    console.log(`📊 Total de pacientes: ${patients.length}`);
    
    if (patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado');
      return;
    }
    
    // Buscar todos os médicos para criar protocolos variados
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, name: true }
    });
    
    console.log(`👨‍⚕️ Total de médicos: ${doctors.length}`);
    
    // Protocolos base para criar
    const protocolTemplates = [
      {
        name: 'Protocolo de Hipertensão',
        description: 'Protocolo completo para controle da pressão arterial',
        days: [
          { dayNumber: 1, tasks: [
            { title: 'Medição da Pressão', description: 'Medir pressão arterial 2x ao dia', order: 1 },
            { title: 'Medicação', description: 'Tomar medicamento conforme prescrição', order: 2 }
          ]},
          { dayNumber: 2, tasks: [
            { title: 'Exercícios', description: 'Caminhada de 30 minutos', order: 1 },
            { title: 'Dieta', description: 'Reduzir sal e gorduras', order: 2 }
          ]}
        ]
      },
      {
        name: 'Protocolo de Diabetes',
        description: 'Controle glicêmico e cuidados com diabetes',
        days: [
          { dayNumber: 1, tasks: [
            { title: 'Glicemia', description: 'Verificar glicose 3x ao dia', order: 1 },
            { title: 'Insulina', description: 'Aplicar insulina nos horários corretos', order: 2 }
          ]},
          { dayNumber: 2, tasks: [
            { title: 'Alimentação', description: 'Seguir dieta com baixo índice glicêmico', order: 1 },
            { title: 'Exercícios', description: 'Atividade física regular', order: 2 }
          ]}
        ]
      },
      {
        name: 'Protocolo Pós-Cirúrgico',
        description: 'Cuidados no pós-operatório',
        days: [
          { dayNumber: 1, tasks: [
            { title: 'Curativo', description: 'Trocar curativo diariamente', order: 1 },
            { title: 'Medicação', description: 'Antibiótico e analgésico conforme prescrição', order: 2 }
          ]},
          { dayNumber: 2, tasks: [
            { title: 'Repouso', description: 'Evitar esforços físicos', order: 1 },
            { title: 'Retorno', description: 'Agendar consulta de retorno', order: 2 }
          ]}
        ]
      },
      {
        name: 'Protocolo de Fisioterapia',
        description: 'Exercícios de reabilitação',
        days: [
          { dayNumber: 1, tasks: [
            { title: 'Aquecimento', description: 'Exercícios de aquecimento', order: 1 },
            { title: 'Alongamento', description: 'Alongar músculos específicos', order: 2 }
          ]},
          { dayNumber: 2, tasks: [
            { title: 'Fortalecimento', description: 'Exercícios de fortalecimento', order: 1 },
            { title: 'Relaxamento', description: 'Técnicas de relaxamento', order: 2 }
          ]}
        ]
      },
      {
        name: 'Protocolo Pré-Natal',
        description: 'Acompanhamento durante a gravidez',
        days: [
          { dayNumber: 1, tasks: [
            { title: 'Vitaminas', description: 'Tomar ácido fólico e vitaminas', order: 1 },
            { title: 'Exames', description: 'Realizar exames de rotina', order: 2 }
          ]},
          { dayNumber: 2, tasks: [
            { title: 'Consultas', description: 'Consultas mensais', order: 1 },
            { title: 'Exercícios', description: 'Exercícios para gestantes', order: 2 }
          ]}
        ]
      }
    ];
    
    // Cursos base para criar
    const courseTemplates = [
      {
        name: 'Curso de Alimentação Saudável',
        description: 'Aprenda a ter uma alimentação equilibrada',
        modules: [
          {
            name: 'Introdução à Nutrição',
            description: 'Conceitos básicos de nutrição',
            order: 1,
            lessons: [
              { title: 'O que são macronutrientes', content: 'Carboidratos, proteínas e gorduras são os macronutrientes essenciais...', order: 1 },
              { title: 'Micronutrientes essenciais', content: 'Vitaminas e minerais são fundamentais para o bom funcionamento...', order: 2 }
            ]
          },
          {
            name: 'Planejamento de Refeições',
            description: 'Como planejar suas refeições',
            order: 2,
            lessons: [
              { title: 'Montando um prato equilibrado', content: 'Um prato equilibrado deve conter 50% de vegetais...', order: 1 },
              { title: 'Receitas saudáveis', content: 'Aqui estão algumas receitas práticas e nutritivas...', order: 2 }
            ]
          }
        ]
      },
      {
        name: 'Curso de Exercícios em Casa',
        description: 'Exercícios que você pode fazer em casa',
        modules: [
          {
            name: 'Exercícios Básicos',
            description: 'Exercícios para iniciantes',
            order: 1,
            lessons: [
              { title: 'Aquecimento', content: 'Sempre aqueça antes de exercitar-se...', order: 1 },
              { title: 'Exercícios cardio', content: 'Exercícios cardiovasculares melhoram a saúde do coração...', order: 2 }
            ]
          },
          {
            name: 'Fortalecimento',
            description: 'Exercícios de fortalecimento muscular',
            order: 2,
            lessons: [
              { title: 'Exercícios para braços', content: 'Flexões e exercícios com peso corporal...', order: 1 },
              { title: 'Exercícios para pernas', content: 'Agachamentos e afundos são excelentes...', order: 2 }
            ]
          }
        ]
      },
      {
        name: 'Curso de Controle do Estresse',
        description: 'Técnicas para gerenciar o estresse',
        modules: [
          {
            name: 'Entendendo o Estresse',
            description: 'O que é estresse e como nos afeta',
            order: 1,
            lessons: [
              { title: 'Tipos de estresse', content: 'Estresse agudo é temporário, estresse crônico é prolongado...', order: 1 },
              { title: 'Sintomas do estresse', content: 'Ansiedade, irritabilidade, fadiga são sinais comuns...', order: 2 }
            ]
          },
          {
            name: 'Técnicas de Relaxamento',
            description: 'Métodos para relaxar',
            order: 2,
            lessons: [
              { title: 'Respiração profunda', content: 'Inspire pelo nariz por 4 segundos, segure por 4...', order: 1 },
              { title: 'Meditação básica', content: 'Encontre um local silencioso e concentre-se na respiração...', order: 2 }
            ]
          }
        ]
      }
    ];
    
    console.log('🏥 Criando protocolos...');
    
    // Criar protocolos para cada médico
    const createdProtocols = [];
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      const protocolTemplate = protocolTemplates[i % protocolTemplates.length];
      
      const protocol = await prisma.protocol.create({
        data: {
          name: protocolTemplate.name,
          description: protocolTemplate.description,
          doctorId: doctor.id,
          isActive: true
        }
      });
      
      // Criar dias e tarefas do protocolo
      for (const dayTemplate of protocolTemplate.days) {
        const protocolDay = await prisma.protocolDay.create({
          data: {
            dayNumber: dayTemplate.dayNumber,
            protocolId: protocol.id
          }
        });
        
        for (const task of dayTemplate.tasks) {
          await prisma.protocolTask.create({
            data: {
              title: task.title,
              description: task.description,
              order: task.order,
              protocolDayId: protocolDay.id
            }
          });
        }
      }
      
      createdProtocols.push(protocol);
      console.log(`✅ Protocolo "${protocol.name}" criado para ${doctor.name}`);
    }
    
    console.log('📚 Criando cursos...');
    
    // Criar cursos para cada médico
    const createdCourses = [];
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      const courseTemplate = courseTemplates[i % courseTemplates.length];
      
      const course = await prisma.course.create({
        data: {
          name: courseTemplate.name,
          description: courseTemplate.description,
          doctorId: doctor.id
        }
      });
      
      // Criar módulos e lições
      for (const moduleTemplate of courseTemplate.modules) {
        const module = await prisma.module.create({
          data: {
            name: moduleTemplate.name,
            description: moduleTemplate.description,
            order: moduleTemplate.order,
            courseId: course.id
          }
        });
        
        for (const lessonTemplate of moduleTemplate.lessons) {
          await prisma.lesson.create({
            data: {
              title: lessonTemplate.title,
              content: lessonTemplate.content,
              order: lessonTemplate.order,
              courseId: course.id,
              moduleId: module.id
            }
          });
        }
      }
      
      createdCourses.push(course);
      console.log(`✅ Curso "${course.name}" criado para ${doctor.name}`);
    }
    
    console.log('👥 Atribuindo protocolos e cursos aos pacientes...');
    
    // Atribuir protocolos e cursos aos pacientes
    for (const patient of patients) {
      // Escolher protocolo aleatório
      const randomProtocol = createdProtocols[Math.floor(Math.random() * createdProtocols.length)];
      
      // Atribuir protocolo ao paciente
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30); // 30 dias padrão
      
      await prisma.userProtocol.create({
        data: {
          userId: patient.id,
          protocolId: randomProtocol.id,
          startDate: startDate,
          endDate: endDate,
          status: 'ACTIVE'
        }
      });
      
      // Escolher curso aleatório
      const randomCourse = createdCourses[Math.floor(Math.random() * createdCourses.length)];
      
      // Inscrever paciente no curso
      await prisma.userCourse.create({
        data: {
          userId: patient.id,
          courseId: randomCourse.id,
          status: 'active',
          startDate: new Date()
        }
      });
      
      console.log(`✅ Paciente ${patient.name} recebeu protocolo "${randomProtocol.name}" e curso "${randomCourse.name}"`);
    }
    
    console.log(`\n🎉 Processo concluído!`);
    console.log(`📋 ${createdProtocols.length} protocolos criados`);
    console.log(`📚 ${createdCourses.length} cursos criados`);
    console.log(`👥 ${patients.length} pacientes receberam protocolos e cursos`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProtocolsAndCourses(); 