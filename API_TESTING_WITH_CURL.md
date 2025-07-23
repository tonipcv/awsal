# Guia de Testes de API com cURL

## Pré-requisitos
1. **Credenciais válidas:**
   - Email: vuomlife@gmail.com
   - Senha: 12be14To!
2. **Acesso ao ambiente:**
   - Produção: https://app.cxlus.com
   - Local: http://localhost:3000
3. **Ferramentas:**
   - cURL (já instalado no macOS)
   - jq (para processamento JSON): `brew install jq`

## Fluxo Completo de Teste

### 1. Obter Token de Autenticação
Para autenticar, faça uma requisição POST para o endpoint `/api/v2/auth/mobile` com email e senha:
```bash
curl -X POST 'https://app.cxlus.com/api/v2/auth/mobile' \
  -H 'Content-Type: application/json' \
  -d '{"email":"vuomlife@gmail.com", "password":"12be14To!"}'
```

**Resposta Esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Dr. Albert Alves",
    "role": "DOCTOR"
  }
}
```

### 2. Extrair Token (automatizado)
```bash
TOKEN=$(curl -s -X POST 'https://app.cxlus.com/api/v2/auth/mobile' \
  -H 'Content-Type: application/json' \
  -d '{"email":"vuomlife@gmail.com", "password":"12be14To!"}' | jq -r '.token')

echo "Token obtido: $TOKEN"
```

### 3. Listar Protocolos Disponíveis
```bash
curl -X GET 'https://app.cxlus.com/api/v2/doctor/protocols' \
  -H "Authorization: Bearer $TOKEN"
```

**Exemplo de Protocolo:**
```json
{
  "id": 123,
  "name": "Protocolo de Hipertensão",
  "description": "Tratamento completo para hipertensão..."
}
```

### 4. Listar Pacientes
```bash
curl -X GET 'https://app.cxlus.com/api/v2/doctor/patients' \
  -H "Authorization: Bearer $TOKEN"
```

**Exemplo de Paciente:**
```json
{
  "id": 456,
  "name": "Maria Silva",
  "email": "maria@exemplo.com"
}
```

### 5. Criar Prescrição (Endpoint Principal)
```bash
curl -X POST 'https://app.cxlus.com/api/v2/doctor/prescriptions' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "protocol_id": "ID_DO_PROTOCOLO",
    "user_id": "ID_DO_PACIENTE",  # Opcional: pode ser substituído por "email"
    "email": "email@do.paciente", # Opcional: se user_id não for fornecido
    "planned_start_date": "2025-07-25",
    "planned_end_date": "2025-08-25", # Opcional
    "consultation_date": "2025-07-20" # Opcional
  }'
```

**Parâmetros Obrigatórios:**
- `protocol_id`: ID do protocolo (obtido no passo 3)
- `planned_start_date`: Data de início do tratamento (YYYY-MM-DD)

**Parâmetros Opcionais:**
- `user_id`: ID do paciente (obtido no passo 4)
- `email`: Email do paciente (alternativa ao user_id)
- `planned_end_date`: Data final planejada do tratamento
- `consultation_date`: Data da consulta

**Notas:**
- Se nenhum identificador de paciente (user_id ou email) for fornecido, o sistema usará o paciente mais recente associado ao médico
- Se um email for fornecido, o sistema criará automaticamente uma relação médico-paciente se necessário

### 6. Atualizar Prescrição
```bash
curl -X PATCH 'https://app.cxlus.com/api/v2/doctor/prescriptions/ID_DA_PRESCRICAO' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "planned_start_date": "2025-07-26",
    "planned_end_date": "2025-08-26",
    "consultation_date": "2025-07-21",
    "status": "ACTIVE"  # Pode ser: PRESCRIBED, ACTIVE, COMPLETED, CANCELLED
  }'
```

**Parâmetros Opcionais:**
- `planned_start_date`: Nova data de início
- `planned_end_date`: Nova data final
- `consultation_date`: Nova data da consulta
- `status`: Novo status da prescrição

### 7. Excluir Prescrição
```bash
curl -X DELETE 'https://app.cxlus.com/api/v2/doctor/prescriptions/ID_DA_PRESCRICAO' \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Verificar Prescrições
```bash
curl -X GET 'https://app.cxlus.com/api/v2/doctor/prescriptions' \
  -H "Authorization: Bearer $TOKEN"
```

## Dicas Avançadas
### Depuração Detalhada
```bash
# Log completo da requisição e resposta
curl -v -X POST 'https://app.cxlus.com/api/v2/doctor/prescriptions' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{...}'
```

### Teste Local
```bash
# 1. Obter token local
TOKEN=$(curl -s -X POST 'http://localhost:3000/api/v2/auth/mobile' \
  -H 'Content-Type: application/json' \
  -d '{"email":"vuomlife@gmail.com", "password":"12be14To!"}' | jq -r '.token')

# 2. Criar prescrição local
curl -X POST 'http://localhost:3000/api/v2/doctor/prescriptions' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"protocol_id":1,"user_id":1,"planned_start_date":"2025-07-25"}'
```

## Solução de Problemas Comuns
1. **Erro 401 (Unauthorized):**
   - Token inválido/expirado: Refazer login
   - Header Authorization ausente/malformatado
   - Usuário sem permissão DOCTOR

2. **Erro 400 (Bad Request):**
   - Parâmetros obrigatórios faltando
   - Formato de data inválido (usar YYYY-MM-DD)
   - IDs de protocolo ou paciente inválidos

3. **Erro 500 (Internal Server Error):**
   - Verificar logs do servidor
   - Problemas de conexão com banco de dados

## Estrutura de Pastas Relevante
```
src/app/api/v2/doctor/
├── prescriptions/       # Prescrições
│   └── route.ts
├── protocols/           # Protocolos
│   └── route.ts
└── patients/            # Pacientes
    └── route.ts
```
