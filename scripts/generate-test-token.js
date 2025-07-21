const jwt = require('jsonwebtoken');

// Configuração
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret';
const TEST_USER_ID = process.argv[2]; // Passar o ID do usuário como argumento

if (!TEST_USER_ID) {
  console.error('Por favor, forneça o ID do usuário como argumento.');
  console.error('Exemplo: node scripts/generate-test-token.js user_id_aqui');
  process.exit(1);
}

// Gerar token
const token = jwt.sign(
  {
    sub: TEST_USER_ID,
    email: 'test@example.com',
    name: 'Test User'
  },
  JWT_SECRET,
  { expiresIn: '1d' }
);

console.log('Token JWT gerado:');
console.log(token); 