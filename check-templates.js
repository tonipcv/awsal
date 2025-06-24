const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get all templates with their relationships
    const templates = await prisma.onboardingTemplate.findMany({
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        steps: true,
        responses: true
      }
    });

    console.log('\n=== Templates Overview ===');
    console.log(`Total templates: ${templates.length}`);

    // Log details for each template
    templates.forEach((template, index) => {
      console.log(`\n--- Template ${index + 1} ---`);
      console.log(`ID: ${template.id}`);
      console.log(`Name: ${template.name}`);
      console.log(`Description: ${template.description || 'No description'}`);
      console.log(`Doctor: ${template.doctor.name} (${template.doctor.email})`);
      console.log(`Is Public: ${template.isPublic}`);
      console.log(`Is Active: ${template.isActive}`);
      console.log(`Steps: ${template.steps.length}`);
      console.log(`Responses: ${template.responses.length}`);
      console.log(`Created At: ${template.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 