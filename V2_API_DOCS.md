# API v2 - Documentação

## Índice
- [Autenticação](#autenticação)
- [Perfil do Paciente](#perfil-do-paciente)
- [Protocolos e Prescrições](#protocolos-e-prescrições)
- [Relatórios de Sintomas](#relatórios-de-sintomas)
- [Check-in Diário](#check-in-diário)
- [Cursos](#cursos)
- [Hábitos](#hábitos)
- [Indicações](#indicações)

## Autenticação

### Login Mobile

```http
POST /api/v2/auth/mobile/login
```

Endpoint para autenticação mobile usando email e senha.

**Corpo da Requisição**
```json
{
  "email": "string",
  "password": "string"
}
```

**Resposta de Sucesso (200)**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",  // Token JWT
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "image": "string"
    },
    "expiresIn": 86400  // 24h em segundos
  },
  "message": "Login realizado com sucesso"
}
```

**Resposta de Erro (401)**
```json
{
  "error": "Credenciais inválidas"
}
```

**Resposta de Erro (400) - Dados Inválidos**
```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "code": "invalid_string",
      "validation": "email",
      "message": "Email inválido",
      "path": ["email"]
    }
  ]
}
```

### Usando o Token

Todas as requisições subsequentes devem incluir o token no header Authorization:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Estrutura do Token JWT

O token JWT contém as seguintes informações no payload:

```json
{
  "sub": "user_id",           // ID do usuário
  "email": "user@email.com",  // Email do usuário
  "name": "User Name",        // Nome do usuário
  "role": "PATIENT",          // Papel do usuário
  "iat": 1616161616,         // Timestamp de emissão
  "exp": 1616248016         // Timestamp de expiração (24h)
}
```

### Erros de Autenticação

| Código | Descrição | Solução |
|--------|-----------|---------|
| 401 | Token ausente | Adicionar header Authorization |
| 401 | Token inválido | Fazer login novamente |
| 401 | Token expirado | Fazer login novamente |
| 403 | Acesso negado | Verificar permissões do usuário |

### Exemplo de Uso

**Login**
```bash
curl -X POST https://api.exemplo.com/api/v2/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

**Usando o Token**
```bash
curl -X GET https://api.exemplo.com/api/v2/patients/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Perfil do Paciente

### Buscar Perfil
```http
GET /api/v2/patients/profile
```

**Resposta**
```json
{
  "success": true,
  "profile": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "birth_date": "string",
    "gender": "string",
    "height": "number",
    "weight": "number",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "zip_code": "string",
    "image": "string",
    "created_at": "string",
    "updated_at": "string"
  },
  "message": "Perfil carregado com sucesso"
}
```

### Atualizar Perfil
```http
PATCH /api/v2/patients/profile
```

**Corpo da Requisição**
```json
{
  "name": "string",
  "phone": "string",
  "birth_date": "string",
  "gender": "string",
  "height": "number",
  "weight": "number",
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "zip_code": "string"
}
```

**Resposta**
```json
{
  "success": true,
  "profile": {
    // Dados atualizados do perfil
  },
  "message": "Perfil atualizado com sucesso"
}
```

## Protocolos e Prescrições

### Listar Prescrições
```http
GET /api/v2/patients/prescriptions
```

**Parâmetros de Query**
- `status`: Filtrar por status (opcional)
- `limit`: Limite de itens por página (padrão: 20)
- `offset`: Offset para paginação (padrão: 0)

**Resposta**
```json
{
  "success": true,
  "prescriptions": [{
    "id": "string",
    "protocol": {
      "id": "string",
      "name": "string",
      "description": "string",
      "duration": "number",
      "cover_image": "string",
      "doctor": {
        "id": "string",
        "name": "string",
        "email": "string",
        "image": "string"
      }
    },
    "progress": [{
      "id": "string",
      "dayNumber": "number",
      "scheduledDate": "string",
      "completedAt": "string",
      "status": "string"
    }]
  }],
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number",
    "hasMore": "boolean"
  },
  "message": "Prescrições carregadas com sucesso"
}
```

### Detalhes da Prescrição
```http
GET /api/v2/patients/prescriptions/:id
```

**Resposta**
```json
{
  "success": true,
  "prescription": {
    "id": "string",
    "protocol": {
      "id": "string",
      "name": "string",
      "days": [{
        "id": "string",
        "dayNumber": "number",
        "title": "string",
        "sessions": [{
          "id": "string",
          "title": "string",
          "tasks": [{
            "id": "string",
            "title": "string",
            "description": "string",
            "type": "string",
            "content": []
          }]
        }]
      }]
    },
    "metrics": {
      "totalTasks": "number",
      "completedTasks": "number",
      "adherenceRate": "number",
      "currentDay": "number",
      "lastProgressDate": "string"
    }
  },
  "message": "Detalhes do protocolo carregados com sucesso"
}
```

### Registrar Progresso
```http
POST /api/v2/patients/prescriptions/:id/progress
```

**Corpo da Requisição**
```json
{
  "dayNumber": "number",
  "taskId": "string",
  "status": "PENDING | COMPLETED | MISSED | POSTPONED",
  "notes": "string",
  "scheduledDate": "YYYY-MM-DD"
}
```

**Resposta**
```json
{
  "success": true,
  "progress": {
    "id": "string",
    "status": "string",
    "completedAt": "string"
  },
  "message": "Progresso registrado com sucesso"
}
```

## Relatórios de Sintomas

### Listar Relatórios
```http
GET /api/v2/patients/symptom-reports
```

**Parâmetros de Query**
- `protocolId`: Filtrar por protocolo (opcional)
- `limit`: Limite de itens por página (padrão: 20)
- `offset`: Offset para paginação (padrão: 0)

**Resposta**
```json
{
  "success": true,
  "reports": [{
    "id": "string",
    "protocolId": "string",
    "dayNumber": "number",
    "symptoms": "string",
    "severity": "number",
    "reportTime": "string",
    "attachments": [{
      "id": "string",
      "fileName": "string",
      "fileUrl": "string"
    }]
  }],
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number",
    "hasMore": "boolean"
  },
  "message": "Relatórios carregados com sucesso"
}
```

### Criar Relatório
```http
POST /api/v2/patients/symptom-reports
```

**Corpo da Requisição**
```json
{
  "protocolId": "string",
  "dayNumber": "number",
  "symptoms": "string",
  "severity": "number",
  "reportTime": "string",
  "isNow": "boolean",
  "title": "string",
  "description": "string"
}
```

**Resposta**
```json
{
  "success": true,
  "report": {
    "id": "string",
    "symptoms": "string",
    "severity": "number",
    "reportTime": "string"
  },
  "message": "Relatório de sintomas criado com sucesso"
}
```

## Check-in Diário

### Listar Perguntas
```http
GET /api/v2/patients/checkin-questions
```

**Parâmetros de Query**
- `protocolId`: ID do protocolo (obrigatório)

**Resposta**
```json
{
  "success": true,
  "questions": [{
    "id": "string",
    "question": "string",
    "type": "string",
    "options": ["string"]
  }],
  "hasCheckinToday": "boolean",
  "existingResponses": {
    "questionId": "answer"
  },
  "date": "YYYY-MM-DD",
  "message": "Perguntas de check-in carregadas com sucesso"
}
```

### Registrar Respostas
```http
POST /api/v2/patients/checkin-responses
```

**Corpo da Requisição**
```json
{
  "protocolId": "string",
  "responses": [{
    "questionId": "string",
    "answer": "string"
  }]
}
```

**Resposta**
```json
{
  "success": true,
  "responses": [{
    "id": "string",
    "questionId": "string",
    "answer": "string"
  }],
  "message": "Check-in registrado com sucesso",
  "isUpdate": "boolean"
}
```

## Cursos

### Listar Cursos
```http
GET /api/v2/patients/courses
```

**Parâmetros de Query**
- `limit`: Limite de itens por página (padrão: 20)
- `offset`: Offset para paginação (padrão: 0)

**Resposta**
```json
{
  "success": true,
  "courses": [{
    "id": "string",
    "title": "string",
    "description": "string",
    "modules": [{
      "id": "string",
      "title": "string",
      "lessons": [{
        "id": "string",
        "title": "string",
        "completed": "boolean"
      }]
    }],
    "progress": {
      "startedAt": "string",
      "completedAt": "string",
      "progress": "number",
      "totalLessons": "number",
      "lessonsCompleted": "number"
    }
  }],
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number",
    "hasMore": "boolean"
  },
  "message": "Cursos carregados com sucesso"
}
```

### Registrar Progresso de Lição
```http
POST /api/v2/patients/courses/:courseId/lessons/:lessonId/progress
```

**Resposta**
```json
{
  "success": true,
  "progress": {
    "lessonId": "string",
    "courseId": "string",
    "completedAt": "string",
    "courseProgress": "number"
  },
  "message": "Progresso registrado com sucesso"
}
```

## Hábitos

### Listar Hábitos
```http
GET /api/v2/patients/habits
```

**Parâmetros de Query**
- `month`: Filtrar por mês (formato: YYYY-MM)

**Resposta**
```json
{
  "success": true,
  "habits": [{
    "id": "string",
    "title": "string",
    "category": "string",
    "progress": [{
      "date": "YYYY-MM-DD",
      "isChecked": "boolean"
    }]
  }],
  "total": "number",
  "message": "Hábitos carregados com sucesso"
}
```

### Registrar Progresso de Hábito
```http
POST /api/v2/patients/habits/:habitId/progress
```

**Corpo da Requisição**
```json
{
  "date": "YYYY-MM-DD"
}
```

**Resposta**
```json
{
  "success": true,
  "habitId": "string",
  "date": "YYYY-MM-DD",
  "isChecked": "boolean",
  "message": "Progresso registrado com sucesso",
  "isUpdate": "boolean"
}
```

## Indicações

### Listar Indicações
```http
GET /api/v2/patients/referrals
```

**Resposta**
```json
{
  "success": true,
  "referrals": [{
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "status": "string",
    "createdAt": "string",
    "convertedAt": "string",
    "creditAwarded": "boolean",
    "creditValue": "number"
  }],
  "total": "number",
  "message": "Indicações carregadas com sucesso"
}
```
### Criar Indicação
```http
POST /api/v2/patients/referrals
```

**Corpo da Requisição**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "notes": "string"
}
```

**Resposta**
```json
{
  "success": true,
  "referral": {
    "id": "string",
    "name": "string",
    "email": "string",
    "status": "string",
    "createdAt": "string"
  },
  "message": "Indicação criada com sucesso"
}
```

## Códigos de Erro

Todas as rotas podem retornar os seguintes erros:

- `401`: Não autorizado
  ```json
  {
    "error": "Unauthorized"
  }
  ```

- `400`: Dados inválidos
  ```json
  {
    "error": "Dados inválidos",
    "details": [
      {
        "code": "invalid_type",
        "path": ["field"],
        "message": "Mensagem de erro"
      }
    ]
  }
  ```

- `404`: Recurso não encontrado
  ```json
  {
    "error": "Resource not found"
  }
  ```

- `500`: Erro interno do servidor
  ```json
  {
    "error": "Internal server error"
  }
  ``` 
