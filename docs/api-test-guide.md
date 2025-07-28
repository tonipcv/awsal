# Guia de Teste de API - Endpoints de Paciente e Médico

Este documento fornece instruções para testar os endpoints da API relacionados à interação entre pacientes e médicos. Inclui tanto os endpoints originais que exigem o ID do paciente na URL quanto os novos endpoints que obtêm o ID do paciente diretamente do token JWT.

## Pré-requisitos

- Servidor Next.js rodando localmente na porta 3000
- Token JWT válido de um paciente autenticado
- IDs válidos de paciente e médico para teste

## Autenticação

Antes de testar os endpoints protegidos, você precisa obter um token JWT válido:

```bash
# Autenticação Mobile - Obter token JWT
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "paciente@exemplo.com", "password": "senha123"}'
```

A resposta incluirá um token JWT que deve ser usado nos cabeçalhos de autorização para as próximas requisições:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id_aqui",
      "name": "Nome do Usuário",
      "email": "paciente@exemplo.com",
      "role": "PATIENT"
    },
    "token": "seu_token_jwt_aqui"
  }
}
```

## Endpoints de Paciente-Médico

### Endpoints com ID do Paciente na URL

#### 1. Listar todos os médicos relacionados a um paciente

Este endpoint retorna todos os médicos que já prescreveram protocolos para o paciente.

```bash
# Substituir {patientId} pelo ID do paciente e {token} pelo token JWT obtido
curl -X GET http://localhost:3000/api/v2/patients/{patientId}/doctors \
  -H "Authorization: Bearer {token}"
```

Resposta esperada:

```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "doctor_id_1",
        "name": "Dr. Nome do Médico",
        "email": "medico@exemplo.com",
        "role": "DOCTOR",
        "image": "url_da_imagem"
      },
      // Outros médicos...
    ]
  }
}
```

#### 2. Obter detalhes de um médico específico e suas prescrições para o paciente

Este endpoint retorna informações detalhadas sobre um médico específico e todas as prescrições que ele fez para o paciente.

```bash
# Substituir {patientId} pelo ID do paciente, {doctorId} pelo ID do médico e {token} pelo token JWT
curl -X GET http://localhost:3000/api/v2/patients/{patientId}/doctors/{doctorId} \
  -H "Authorization: Bearer {token}"
```

### Novos Endpoints (ID do Paciente do Token JWT)

#### 1. Listar todos os médicos relacionados ao paciente autenticado

Este endpoint usa o ID do paciente diretamente do token JWT, sem necessidade de especificá-lo na URL.

```bash
# Substituir {token} pelo token JWT obtido
curl -X GET http://localhost:3000/api/v2/patients/doctors \
  -H "Authorization: Bearer {token}"
```

Resposta esperada:

```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "doctor_id_1",
        "name": "Dr. Nome do Médico",
        "email": "medico@exemplo.com",
        "role": "DOCTOR",
        "image": "url_da_imagem"
      },
      // Outros médicos...
    ]
  }
}
```

#### 2. Obter detalhes de um médico específico e suas prescrições para o paciente autenticado

Este endpoint usa o ID do médico da URL e o ID do paciente do token JWT.

```bash
# Substituir {doctorId} pelo ID do médico e {token} pelo token JWT
curl -X GET http://localhost:3000/api/v2/patients/doctors/{doctorId} \
  -H "Authorization: Bearer {token}"
```

Resposta esperada:

```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "doctor_id",
      "name": "Dr. Nome do Médico",
      "email": "medico@exemplo.com",
      "role": "DOCTOR",
      "image": "url_da_imagem",
      "prescriptions": [
        {
          "id": "prescription_id",
          "protocolId": "protocol_id",
          "status": "ACTIVE",
          "plannedStartDate": "2023-01-01T00:00:00.000Z",
          "plannedEndDate": "2023-02-01T00:00:00.000Z",
          "prescribedAt": "2022-12-25T00:00:00.000Z",
          "protocol": {
            "id": "protocol_id",
            "name": "Nome do Protocolo",
            "description": "Descrição do protocolo",
            "products": [
              {
                "id": "product_id",
                "name": "Nome do Produto",
                "description": "Descrição do produto",
                "imageUrl": ""
              }
              // Outros produtos...
            ]
          }
        }
        // Outras prescrições...
      ]
    }
  }
}
```

## Testando com ngrok

Se você precisar testar os endpoints de fora da sua rede local, use o ngrok para expor seu servidor local:

```bash
# Iniciar o ngrok na porta 3000
ngrok http 3000
```

Depois, substitua `http://localhost:3000` pela URL fornecida pelo ngrok nas requisições cURL.

## Solução de Problemas

### Erro 401 (Não Autorizado)
- Verifique se o token JWT é válido e não expirou
- Confirme que está usando o formato correto no cabeçalho Authorization

### Erro 403 (Proibido)
- Verifique se o ID do paciente na URL corresponde ao ID do usuário autenticado
- Confirme que o usuário tem permissão para acessar os dados solicitados

### Erro 404 (Não Encontrado)
- Verifique se os IDs de paciente e médico estão corretos
- Confirme que o servidor Next.js está rodando na porta correta
- Se estiver usando ngrok, verifique se o túnel está ativo e funcionando

### Erro de Conexão
- Verifique se o servidor Next.js está rodando (`npm run dev` ou `yarn dev`)
- Se estiver usando ngrok, verifique se o túnel está ativo
