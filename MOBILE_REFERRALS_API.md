# 📱 API Mobile - Sistema de Indicações

## 🔐 Autenticação

Todos os endpoints mobile requerem autenticação via JWT token no header `Authorization`:

```http
Authorization: Bearer {jwt_token}
```

## 📋 Endpoints Disponíveis

### 1. Listar Indicações
```http
GET /api/mobile/referrals
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "referrals": [
    {
      "id": "clx123...",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "+5571999999999",
      "status": "PENDING",
      "createdAt": "2024-01-15T10:30:00Z",
      "convertedAt": null,
      "creditAwarded": false,
      "creditValue": 0
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

### 2. Criar Indicação
```http
POST /api/mobile/referrals
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+5571999999999",
  "notes": "Interessado em consulta"
}
```

**Request Body:**
- `name` (obrigatório): Nome da pessoa indicada
- `email` (obrigatório): Email válido
- `phone` (opcional): Telefone
- `notes` (opcional): Observações

**Response (201):**
```json
{
  "success": true,
  "referral": {
    "id": "clx123...",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5571999999999",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Indicação criada com sucesso! O médico será notificado."
}
```

**Response (400):**
```json
{
  "error": "Dados inválidos",
  "details": [...]
}
```

## 🔄 Fluxo de Uso Típico

### 1. Listar Indicações
```typescript
const response = await fetch('/api/mobile/referrals', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
// data.referrals contém a lista de indicações
```

### 2. Criar Indicação
```typescript
const response = await fetch('/api/mobile/referrals', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '+5571999999999',
    notes: 'Interessado em consulta'
  })
});
const data = await response.json();
// data.referral contém a indicação criada
```

## 🛡️ Segurança

### Validações Implementadas:
- ✅ **Autenticação JWT** obrigatória
- ✅ **Verificação de role** (apenas pacientes podem criar indicações)
- ✅ **Validação de dados** com Zod
- ✅ **Verificação de duplicidade** de email
- ✅ **Verificação de vínculo** com médico

### Validações de Dados:
- **Nome**: Obrigatório, string não vazia
- **Email**: Obrigatório, formato válido
- **Telefone**: Opcional, string
- **Notas**: Opcional, string

## 📊 Códigos de Status HTTP

| Código | Descrição | Uso |
|--------|-----------|-----|
| 200 | OK | Operação bem-sucedida |
| 201 | Created | Indicação criada com sucesso |
| 400 | Bad Request | Dados inválidos ou duplicados |
| 401 | Unauthorized | Token inválido ou ausente |
| 403 | Forbidden | Usuário não é paciente |
| 404 | Not Found | Médico não encontrado |
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
2. **Autorização**: Usuário não é paciente
3. **Validação**: Dados de entrada inválidos
4. **Duplicidade**: Email já cadastrado
5. **Vínculo**: Paciente sem médico vinculado

## 📱 Exemplo de Hook React Native

```typescript
import { useState, useEffect } from 'react';

export const useReferrals = (token: string) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mobile/referrals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.referrals);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao carregar indicações');
    } finally {
      setLoading(false);
    }
  };

  const createReferral = async (referralData: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  }) => {
    try {
      const response = await fetch('/api/mobile/referrals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(referralData)
      });
      
      const data = await response.json();
      if (data.success) {
        // Atualizar lista local
        fetchReferrals();
        return { success: true, referral: data.referral };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Erro ao criar indicação:', err);
      return { success: false, error: 'Erro ao criar indicação' };
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [token]);

  return { 
    referrals, 
    loading, 
    error, 
    createReferral,
    refetch: fetchReferrals 
  };
};
```

## 🚀 Performance

### Otimizações Implementadas:
- ✅ **Queries otimizadas** com Prisma
- ✅ **Validação rápida** com Zod
- ✅ **Respostas compactas** para mobile
- ✅ **Envio de email** assíncrono
- ✅ **Cache de autenticação** no middleware

### Métricas Esperadas:
- **Tempo de resposta**: < 200ms para listagem
- **Throughput**: 1000+ requests/minuto
- **Uso de memória**: < 50MB por request
- **Taxa de erro**: < 1%

## 🔮 Próximas Funcionalidades

### Planejadas:
- [ ] **Notificações push** para status
- [ ] **Compartilhamento** via redes sociais
- [ ] **QR Code** para indicação rápida
- [ ] **Link personalizado** por paciente
- [ ] **Gamificação** de indicações
- [ ] **Analytics** de conversão

### Melhorias Técnicas:
- [ ] **Cache Redis** para performance
- [ ] **Compressão gzip** nas respostas
- [ ] **Rate limiting** por usuário
- [ ] **Webhooks** para integrações
- [ ] **Testes automatizados** com Jest 