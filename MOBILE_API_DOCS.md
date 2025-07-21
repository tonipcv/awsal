# API de Protocolos - Documentação

## Buscar Protocolo Específico

```http
GET /api/protocols/assignments/:id
```

Retorna os detalhes de um protocolo específico junto com sua prescrição ativa.

### Parâmetros da URL

| Parâmetro | Tipo   | Descrição                |
|-----------|--------|--------------------------|
| id        | string | ID do protocolo (CUID)   |

### Headers

| Nome          | Valor                |
|---------------|----------------------|
| Authorization | Bearer {token}       |

### Resposta de Sucesso

```json
{
  "id": "string",
  "userId": "string",
  "protocolId": "string",
  "startDate": "string",
  "endDate": "string",
  "status": "string",
  "currentDay": number,
  "isActive": boolean,
  "protocol": {
    "id": "string",
    "name": "string",
    "description": "string",
    "duration": number,
    "doctor": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "days": [
      {
        "id": "string",
        "dayNumber": number,
        "title": "string",
        "sessions": [
          {
            "id": "string",
            "sessionNumber": number,
            "title": "string",
            "tasks": [
              {
                "id": "string",
                "title": "string",
                "description": "string",
                "type": "string",
                "hasMoreInfo": boolean,
                "videoUrl": "string",
                "fullExplanation": "string"
              }
            ]
          }
        ]
      }
    ]
  },
  "prescription": {
    "id": "string",
    "status": "string",
    "actualStartDate": "string",
    "currentDay": number,
    "plannedEndDate": "string"
  }
}
```

### Códigos de Erro

| Código | Descrição                                |
|--------|------------------------------------------|
| 401    | Token inválido ou expirado              |
| 404    | Protocolo não encontrado                 |

## Buscar Progresso do Protocolo

```http
GET /api/protocols/:id/prescriptions/:prescriptionId/progress
```

Retorna o progresso detalhado de uma prescrição de protocolo.

### Parâmetros da URL

| Parâmetro      | Tipo   | Descrição                    |
|----------------|--------|------------------------------|
| id             | string | ID do protocolo (CUID)       |
| prescriptionId | string | ID da prescrição (CUID)      |

### Headers

| Nome          | Valor                |
|---------------|----------------------|
| Authorization | Bearer {token}       |

### Resposta de Sucesso

```json
{
  "adherenceRate": number,
  "currentDay": number,
  "completedTasks": number,
  "totalTasks": number,
  "lastActivity": "string",
  "streakDays": number,
  "status": "string"
}
```

### Códigos de Erro

| Código | Descrição                                |
|--------|------------------------------------------|
| 401    | Token inválido ou expirado              |
| 404    | Protocolo ou prescrição não encontrada   |

### Exemplos de Uso

#### Buscar Protocolo Específico

```bash
curl -X GET \
  'https://app.cxlus.com/api/protocols/assignments/cmd5rjtuq000djgddn000rsk6' \
  -H 'Authorization: Bearer {token}'
```

#### Buscar Progresso do Protocolo

```bash
curl -X GET \
  'https://app.cxlus.com/api/protocols/cmd5rjtuq000djgddn000rsk6/prescriptions/cmd5rjtuq000djgddn000rsk6/progress' \
  -H 'Authorization: Bearer {token}'
``` 