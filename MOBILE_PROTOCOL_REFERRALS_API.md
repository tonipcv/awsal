# 📱 API Mobile - Indicação de Protocolos

## 🔐 Autenticação

Todos os endpoints mobile requerem autenticação via JWT token no header `Authorization`:

```http
Authorization: Bearer {jwt_token}
```

## 📋 Endpoint de Indicação de Protocolo

### Criar Indicação de Protocolo
```http
POST /api/mobile/protocols/{protocolId}/referrals
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+5571999999999",
  "notes": "Interessado neste protocolo"
}
```

**URL Parameters:**
- `protocolId`: ID do protocolo a ser indicado

**Request Body:**
- `name` (obrigatório): Nome da pessoa indicada
- `email` (obrigatório): Email válido
- `phone` (opcional): Telefone
- `notes` (opcional): Observações

**Response (200):**
```json
{
  "success": true,
  "referral": {
    "id": "clx123...",
    "protocolId": "cmd123...",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z",
    "patientEmail": "joao@example.com",
    "patientName": "João Silva"
  },
  "message": "Indicação de protocolo criada com sucesso!"
}
```

**Response (400) - Email já cadastrado:**
```json
{
  "error": "Esta pessoa já possui uma conta no sistema"
}
```

**Response (400) - Indicação duplicada:**
```json
{
  "error": "Já existe uma indicação pendente deste protocolo para esta pessoa"
}
```

**Response (404) - Protocolo não encontrado:**
```json
{
  "error": "Protocolo não encontrado ou inativo"
}
```

## 🔄 Exemplo de Uso

```typescript
const createProtocolReferral = async ({
  token,
  protocolId,
  referralData
}: {
  token: string;
  protocolId: string;
  referralData: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  }
}) => {
  try {
    const response = await fetch(`/api/mobile/protocols/${protocolId}/referrals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(referralData)
    });
    
    const data = await response.json();
    if (data.success) {
      return { success: true, referral: data.referral };
    } else {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error('Erro ao criar indicação:', err);
    return { success: false, error: 'Erro ao criar indicação' };
  }
};
```

## 🛡️ Segurança

### Validações Implementadas:
- ✅ **Autenticação JWT** obrigatória
- ✅ **Validação de dados** com Zod
- ✅ **Verificação de protocolo** ativo
- ✅ **Verificação de duplicidade** de email e indicação
- ✅ **Tratamento de usuários** existentes

### Validações de Dados:
- **Nome**: Obrigatório, string não vazia
- **Email**: Obrigatório, formato válido
- **Telefone**: Opcional, string
- **Notas**: Opcional, string
- **Protocol ID**: UUID/CUID válido

## 📊 Códigos de Status HTTP

| Código | Descrição | Uso |
|--------|-----------|-----|
| 200 | OK | Indicação criada com sucesso |
| 400 | Bad Request | Dados inválidos ou duplicados |
| 401 | Unauthorized | Token inválido ou ausente |
| 404 | Not Found | Protocolo não encontrado |
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
3. **Duplicidade**: Email já cadastrado ou indicação existente
4. **Protocolo**: Não encontrado ou inativo
5. **Sistema**: Erros internos do servidor

## 🚀 Performance

### Otimizações Implementadas:
- ✅ **Queries otimizadas** com Prisma
- ✅ **Validação rápida** com Zod
- ✅ **Respostas compactas** para mobile
- ✅ **Debug condicional** em desenvolvimento
- ✅ **Cache de autenticação** no middleware

### Métricas Esperadas:
- **Tempo de resposta**: < 300ms
- **Throughput**: 500+ requests/minuto
- **Uso de memória**: < 50MB por request
- **Taxa de erro**: < 1%

## 🔮 Próximas Funcionalidades

### Planejadas:
- [ ] **Notificações push** para status
- [ ] **Preview do protocolo** para indicado
- [ ] **Link de convite** personalizado
- [ ] **Compartilhamento** via WhatsApp
- [ ] **Rastreamento** de conversão

### Melhorias Técnicas:
- [ ] **Cache Redis** para protocolos
- [ ] **Rate limiting** por usuário
- [ ] **Webhooks** para integrações
- [ ] **Testes E2E** com Cypress
- [ ] **Monitoramento** com Sentry

## 📝 Exemplo de Curl

```bash
# 1. Login para obter o token
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  https://app.cxlus.com/api/auth/mobile/login

# 2. Criar indicação de protocolo
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5571999999999",
    "notes": "Interessado neste protocolo"
  }' \
  https://app.cxlus.com/api/mobile/protocols/cmd123.../referrals
``` 