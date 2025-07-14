# Fluxo de Início de Protocolo no Mobile

## Visão Geral

O fluxo de início de protocolo no mobile envolve algumas etapas principais:

1. Autenticação do paciente
2. Listagem dos protocolos disponíveis
3. Preenchimento do onboarding (se necessário)
4. Início do protocolo

## Detalhes do Fluxo

### 1. Autenticação

O paciente precisa estar autenticado para acessar seus protocolos. A autenticação é feita via:

```
POST /api/auth/mobile/login
Content-Type: application/json

{
  "email": "email@exemplo.com",
  "password": "senha"
}
```

O endpoint retorna um token JWT que deve ser usado em todas as requisições subsequentes.

### 2. Listagem de Protocolos

Após autenticação, o paciente pode listar seus protocolos atribuídos:

```
GET /api/protocols/assignments
Authorization: Bearer {token}
```

Os protocolos são retornados com os seguintes status possíveis:
- `ACTIVE`: Protocolo ativo e pronto para começar
- `INACTIVE`: Protocolo inativo
- `SOON`: Protocolo que estará disponível em breve
- `UNAVAILABLE`: Protocolo indisponível

### 3. Onboarding (Se Necessário)

Se o protocolo tiver um `onboardingTemplateId`, o paciente precisa preencher o onboarding antes de começar:

1. O frontend verifica se existe `onboardingTemplateId` no protocolo
2. Se existir, redireciona para a tela de onboarding
3. Após completar o onboarding, o status do protocolo é atualizado

### 4. Início do Protocolo

Para iniciar um protocolo, o paciente precisa:

1. Ter completado o onboarding (se necessário)
2. O protocolo precisa estar com status `PRESCRIBED`
3. Fazer uma requisição POST para iniciar:

```
POST /api/protocols/{protocolId}/prescriptions/{prescriptionId}/start
Authorization: Bearer {token}
```

O endpoint:
- Verifica a autenticação (web ou mobile)
- Valida se o usuário tem acesso ao protocolo
- Atualiza o status para `ACTIVE`
- Define a data de início (`actualStartDate`) como a data atual
- Define o dia atual (`currentDay`) como 1

## Observações Importantes

1. **Autenticação**: O sistema suporta tanto autenticação web (NextAuth) quanto mobile (JWT)
2. **Data de Início**: É definida automaticamente quando o protocolo é iniciado
3. **Progresso**: O sistema começa a rastrear o progresso a partir do dia 1
4. **Acesso**: O paciente só pode iniciar protocolos que foram prescritos para ele
5. **Onboarding**: É um pré-requisito para alguns protocolos e deve ser completado antes do início

## Erros Comuns

- 401: Não autorizado (token inválido ou expirado)
- 404: Prescrição não encontrada
- 400: Prescrição não está no estado correto para início
- 500: Erro interno do servidor

## Fluxo de Telas no Mobile

1. Login → Autenticação
2. Lista de Protocolos → Mostra protocolos disponíveis
3. Onboarding (se necessário) → Formulário inicial
4. Detalhes do Protocolo → Informações e botão de início
5. Protocolo Ativo → Checklist e tarefas do dia 1 