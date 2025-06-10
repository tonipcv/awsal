# 🔐 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE

## 📋 **VARIÁVEIS OBRIGATÓRIAS**

### 1. Criar arquivo `.env.local` na raiz do projeto:

```bash
# Database (OBRIGATÓRIO)
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT Secret para autenticação mobile (OBRIGATÓRIO)
NEXTAUTH_SECRET="sua-chave-super-secreta-aqui-minimo-32-caracteres-para-seguranca"

# URL da aplicação (OBRIGATÓRIO)
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Para produção, altere a URL:
```bash
NEXTAUTH_URL="https://seu-dominio.com"
```

---

## 🔑 **COMO GERAR O NEXTAUTH_SECRET**

### Opção 1 - Terminal/CMD:
```bash
# No terminal, execute:
openssl rand -base64 32
```

### Opção 2 - Node.js:
```javascript
// Execute no console do navegador ou Node.js:
require('crypto').randomBytes(32).toString('base64')
```

### Opção 3 - Online (use com cuidado):
- Acesse: https://generate-secret.vercel.app/32
- **IMPORTANTE**: Use apenas para desenvolvimento, nunca para produção

---

## 📱 **VARIÁVEIS OPCIONAIS (para funcionalidades extras)**

```bash
# Google OAuth (para login com Google)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"

# OpenAI (para transcrição de áudio e IA)
OPENAI_API_KEY="sua-openai-api-key"

# Email (para envio de emails)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="seu-email@gmail.com"
EMAIL_SERVER_PASSWORD="sua-senha-de-app"
EMAIL_FROM="seu-email@gmail.com"
```

---

## 🚀 **CONFIGURAÇÃO PARA PRODUÇÃO**

### Vercel:
1. Vá em **Settings** > **Environment Variables**
2. Adicione cada variável:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

### Outras plataformas:
- **Railway**: Settings > Variables
- **Heroku**: Settings > Config Vars
- **DigitalOcean**: App Settings > Environment Variables

---

## ✅ **CHECKLIST DE SEGURANÇA**

- [ ] ✅ `.env*` está no `.gitignore` (já configurado)
- [ ] ✅ `NEXTAUTH_SECRET` tem pelo menos 32 caracteres
- [ ] ✅ `DATABASE_URL` aponta para o banco correto
- [ ] ✅ `NEXTAUTH_URL` está correto para o ambiente
- [ ] ❌ **NUNCA** commite arquivos `.env` no Git
- [ ] ❌ **NUNCA** compartilhe suas chaves secretas

---

## 🔧 **TESTANDO A CONFIGURAÇÃO**

### 1. Verificar se as variáveis estão carregando:
```javascript
// Adicione temporariamente em qualquer API route:
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
```

### 2. Testar autenticação mobile:
```bash
# Teste o login mobile:
curl -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"paciente@teste.com","password":"senha123"}'
```

---

## 🆘 **PROBLEMAS COMUNS**

### "JWT_SECRET is undefined":
- ✅ Verifique se `NEXTAUTH_SECRET` está no `.env.local`
- ✅ Reinicie o servidor: `npm run dev`

### "Database connection failed":
- ✅ Verifique se `DATABASE_URL` está correto
- ✅ Teste a conexão com o banco

### "Token inválido":
- ✅ Verifique se o `NEXTAUTH_SECRET` é o mesmo usado para gerar e verificar
- ✅ Certifique-se que não há espaços extras na variável

---

## 📝 **EXEMPLO COMPLETO DO .env.local**

```bash
# Banco de dados PostgreSQL
DATABASE_URL="postgresql://postgres:minhasenha@localhost:5432/meu_sistema_medico"

# Chave secreta para JWT (GERE UMA NOVA!)
NEXTAUTH_SECRET="minha-chave-super-secreta-de-32-caracteres-ou-mais-para-maxima-seguranca"

# URL da aplicação
NEXTAUTH_URL="http://localhost:3000"

# OpenAI para IA (opcional)
OPENAI_API_KEY="sk-..."
```

**⚠️ IMPORTANTE**: Substitua todos os valores de exemplo pelos seus valores reais! 