# Guia da API de Protocolos

## Conceitos Importantes

### Hierarquia de Dados
```
Protocol (Protocolo)
  └── ProtocolPrescription (Prescrição específica para um paciente)
       └── ProtocolDay (Dias do protocolo)
            └── ProtocolSession (Sessões dentro de cada dia)
                 └── ProtocolTask (Tarefas dentro de cada sessão)
                      └── ProtocolDayProgress (Progresso de cada tarefa)
```

### Fluxo de Uso

1. **Buscar Lista de Protocolos do Paciente**
```http
GET /api/protocols/assignments
```
- Retorna todos os protocolos atribuídos ao paciente
- Inclui detalhes básicos e prescrições ativas
- Use para obter os IDs necessários para as próximas chamadas

2. **Buscar Protocolo Específico**
```http
GET /api/protocols/assignments/:id
```
- Retorna um protocolo específico com sua prescrição ativa
- Use quando precisar carregar detalhes de um protocolo específico
- Mais eficiente que buscar todos os protocolos

3. **Verificar Acesso e Prescrição**
```http
GET /api/protocols/:id/access
```
- Verifica se o usuário tem acesso ao protocolo
- Retorna o ID da prescrição ativa
- Use antes de buscar o progresso

4. **Buscar Progresso do Protocolo**
```http
GET /api/protocols/:id/prescriptions/:prescriptionId/progress
```
- Endpoint definitivo para buscar progresso
- Retorna:
  - Taxa de adesão (adherenceRate)
  - Dia atual (currentDay)
  - Tarefas completadas vs total
  - Streak de dias consecutivos
  - Última atividade
  - Status geral

5. **Marcar Tarefa como Concluída/Não Concluída**
```http
POST /api/protocols/progress

Body:
{
  "protocolTaskId": "string",  // ID da tarefa
  "date": "YYYY-MM-DD"        // Data no formato ISO
}
```
- Alterna o estado da tarefa (toggle)
- Se não existir progresso, cria um novo
- Se existir, inverte o estado atual
- Retorna o novo estado e detalhes completos

### Exemplos de Uso

1. **Fluxo Completo**
```bash
# 1. Listar protocolos do paciente
curl -H "Authorization: Bearer TOKEN" "https://app.cxlus.com/api/protocols/assignments"

# 2. Buscar protocolo específico
curl -H "Authorization: Bearer TOKEN" "https://app.cxlus.com/api/protocols/assignments/PROTOCOL_ID"

# 3. Verificar acesso e obter ID da prescrição
curl -H "Authorization: Bearer TOKEN" "https://app.cxlus.com/api/protocols/PROTOCOL_ID/access"

# 4. Buscar progresso
curl -H "Authorization: Bearer TOKEN" "https://app.cxlus.com/api/protocols/PROTOCOL_ID/prescriptions/PRESCRIPTION_ID/progress"

# 5. Marcar tarefa como concluída
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"protocolTaskId":"TASK_ID","date":"2024-03-18"}' \
  "https://app.cxlus.com/api/protocols/progress"
```

### Observações Importantes

1. **Autenticação**
   - Todas as chamadas requerem o header `Authorization: Bearer TOKEN`
   - O token deve ser válido e pertencer ao paciente

2. **Formato de Data**
   - Use sempre o formato ISO `YYYY-MM-DD`
   - A data é convertida para UTC internamente

3. **Progresso**
   - O endpoint de progresso é idempotente
   - Cada chamada alterna o estado da tarefa
   - O mesmo endpoint serve para marcar/desmarcar

4. **Performance**
   - Use `/api/protocols/assignments/:id` para carregar um protocolo específico
   - Evite carregar todos os protocolos quando souber o ID
   - O endpoint de progresso já retorna todas as métricas necessárias

5. **Erros Comuns**
   - Verifique se o protocolo está ativo
   - Confirme se a data está no formato correto
   - Certifique-se de que o usuário tem acesso ao protocolo
   - Valide se a tarefa pertence ao protocolo correto 