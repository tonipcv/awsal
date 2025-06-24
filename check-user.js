const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { 
        email: 'xppsalvador@gmail.com' 
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        doctorId: true,
        isActive: true
      }
    });
    
    console.log('User:', user);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser(); 