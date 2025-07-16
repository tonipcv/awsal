# 📱 API Mobile - Sistema de Hábitos

## 🔐 Autenticação

Todos os endpoints mobile requerem autenticação via JWT token no header `Authorization`:

```http
Authorization: Bearer {jwt_token}
```

## 📋 Endpoints Disponíveis

### 1. Listar Hábitos
```http
GET /api/mobile/habits?month=2024-01-01T00:00:00.000Z
Authorization: Bearer {token}
```

**Query Parameters:**
- `month` (opcional): Mês para filtrar progresso (formato ISO)

**Response (200):**
```json
{
  "success": true,
  "habits": [
    {
      "id": "clx123...",
      "title": "Meditar 10 minutos",
      "category": "personal",
      "progress": [
        {
          "date": "2024-01-15",
          "isChecked": true
        }
      ]
    }
  ],
  "total": 1
}
```

**Response (401):**
```json
{
  "error": "Não autorizado"
}
```

### 2. Criar Hábito
```http
POST /api/mobile/habits
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Novo hábito",
  "category": "health"
}
```

**Request Body:**
- `title` (obrigatório): Nome do hábito
- `category` (opcional): Categoria (personal, health, work) - padrão: "personal"

**Response (201):**
```json
{
  "success": true,
  "habit": {
    "id": "clx123...",
    "title": "Novo hábito",
    "category": "health",
    "progress": []
  },
  "message": "Hábito criado com sucesso!"
}
```

**Response (400):**
```json
{
  "error": "Dados inválidos",
  "details": [...]
}
```

### 3. Atualizar Hábito
```http
PUT /api/mobile/habits/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Hábito atualizado",
  "category": "work"
}
```

**Request Body:**
- `title` (obrigatório): Novo nome do hábito
- `category` (opcional): Nova categoria

**Response (200):**
```json
{
  "success": true,
  "habit": {
    "id": "clx123...",
    "title": "Hábito atualizado",
    "category": "work",
    "progress": [...]
  },
  "message": "Hábito atualizado com sucesso!"
}
```

**Response (404):**
```json
{
  "error": "Hábito não encontrado"
}
```

### 4. Deletar Hábito
```http
DELETE /api/mobile/habits/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Hábito deletado com sucesso!"
}
```

**Response (404):**
```json
{
  "error": "Hábito não encontrado"
}
```

### 5. Atualizar Progresso
```http
POST /api/mobile/habits/progress
Authorization: Bearer {token}
Content-Type: application/json

{
  "habitId": "clx123...",
  "date": "2024-01-15"
}
```

**Request Body:**
- `habitId` (obrigatório): ID do hábito
- `date` (obrigatório): Data no formato YYYY-MM-DD

**Response (200):**
```json
{
  "success": true,
  "habitId": "clx123...",
  "date": "2024-01-15",
  "isChecked": true,
  "message": "Progresso marcado com sucesso!",
  "isUpdate": false
}
```

**Response (404):**
```json
{
  "error": "Hábito não encontrado"
}
```

## 🔄 Fluxo de Uso Típico

### 1. Carregar Hábitos
```typescript
const response = await fetch('/api/mobile/habits', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
// data.habits contém a lista de hábitos
```

### 2. Criar Novo Hábito
```typescript
const response = await fetch('/api/mobile/habits', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Beber água',
    category: 'health'
  })
});
const data = await response.json();
// data.habit contém o hábito criado
```

### 3. Marcar Progresso
```typescript
const response = await fetch('/api/mobile/habits/progress', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    habitId: 'clx123...',
    date: '2024-01-15'
  })
});
const data = await response.json();
// data.isChecked indica se foi marcado/desmarcado
```

## 🛡️ Segurança

### Validações Implementadas:
- ✅ **Autenticação JWT** obrigatória
- ✅ **Verificação de propriedade** (usuário só acessa seus próprios hábitos)
- ✅ **Validação de dados** com Zod
- ✅ **Sanitização** de inputs
- ✅ **Tratamento de erros** consistente

### Validações de Dados:
- **Título**: Obrigatório, string não vazia
- **Categoria**: Opcional, string válida
- **Data**: Formato YYYY-MM-DD
- **ID do hábito**: String válida

## 📊 Códigos de Status HTTP

| Código | Descrição | Uso |
|--------|-----------|-----|
| 200 | OK | Operação bem-sucedida |
| 201 | Created | Hábito criado com sucesso |
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Token inválido ou ausente |
| 404 | Not Found | Hábito não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

## 🔧 Tratamento de Erros

### Estrutura de Erro Padrão:
```json
{
  "error": "Mensagem de erro",
  "details": [] // Para erros de validação
}
```

### Tipos de Erro:
1. **Autenticação**: Token inválido ou ausente
2. **Validação**: Dados de entrada inválidos
3. **Autorização**: Tentativa de acessar hábito de outro usuário
4. **Recurso não encontrado**: Hábito inexistente
5. **Erro interno**: Problemas no servidor

## 📱 Integração com React Native

### Exemplo de Hook Customizado:
```typescript
import { useState, useEffect } from 'react';

export const useHabits = (token: string) => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mobile/habits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setHabits(data.habits);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao carregar hábitos');
    } finally {
      setLoading(false);
    }
  };

  const toggleProgress = async (habitId: string, date: string) => {
    try {
      const response = await fetch('/api/mobile/habits/progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ habitId, date })
      });
      
      const data = await response.json();
      if (data.success) {
        // Atualizar estado local
        fetchHabits();
      }
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [token]);

  return { habits, loading, error, toggleProgress, refetch: fetchHabits };
};
```

## 🚀 Performance

### Otimizações Implementadas:
- ✅ **Índices de banco** otimizados
- ✅ **Queries eficientes** com Prisma
- ✅ **Validação rápida** com Zod
- ✅ **Respostas compactas** para mobile
- ✅ **Cache de autenticação** no middleware

### Métricas Esperadas:
- **Tempo de resposta**: < 200ms para listagem
- **Throughput**: 1000+ requests/minuto
- **Uso de memória**: < 50MB por request
- **Taxa de erro**: < 1%

## 🔮 Próximas Funcionalidades

### Planejadas:
- [ ] **Notificações push** para lembretes
- [ ] **Sincronização offline** com queue
- [ ] **Batch operations** para múltiplos hábitos
- [ ] **Webhooks** para integrações
- [ ] **Rate limiting** por usuário
- [ ] **Analytics** de uso

### Melhorias Técnicas:
- [ ] **Cache Redis** para performance
- [ ] **Compressão gzip** nas respostas
- [ ] **Logging estruturado** com Winston
- [ ] **Monitoramento** com Prometheus
- [ ] **Testes automatizados** com Jest 