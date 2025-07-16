# 📋 Sistema de Hábitos - Checklist para Pacientes

## 🎯 Visão Geral

O sistema de hábitos permite que os pacientes criem e gerenciem seus próprios hábitos pessoais, de saúde e trabalho através de um checklist interativo com visualização mensal.

## 🗄️ Estrutura do Banco de Dados

### Modelos Prisma

#### `Habit` (Tabela: `habits`)
```prisma
model Habit {
  id          String        @id @default(cuid())
  userId      String
  title       String
  category    String        @default("personal")
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @default(now()) @updatedAt
  progress    HabitProgress[]
  user        User          @relation("UserHabits", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([category])
  @@index([isActive])
  @@map("habits")
}
```

#### `HabitProgress` (Tabela: `habit_progress`)
```prisma
model HabitProgress {
  id        String   @id @default(cuid())
  habitId   String
  date      DateTime @db.Date
  isChecked Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt
  habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, date])
  @@index([habitId])
  @@index([date])
  @@map("habit_progress")
}
```

## 🚀 APIs Implementadas

### 1. Listar Hábitos
```http
GET /api/habits?month=2024-01-01T00:00:00.000Z
Authorization: Bearer {token}
```

**Response:**
```json
[
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
]
```

### 2. Criar Hábito
```http
POST /api/habits
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Novo hábito",
  "category": "health"
}
```

### 3. Atualizar Hábito
```http
PUT /api/habits/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Hábito atualizado",
  "category": "work"
}
```

### 4. Deletar Hábito
```http
DELETE /api/habits/{id}
Authorization: Bearer {token}
```

### 5. Atualizar Progresso
```http
POST /api/habits/progress
Authorization: Bearer {token}
Content-Type: application/json

{
  "habitId": "clx123...",
  "date": "2024-01-15"
}
```

## 🎨 Interface do Usuário

### Página Principal
- **Rota:** `/patient/checklist`
- **Funcionalidades:**
  - Visualização mensal em formato de calendário
  - Adicionar novos hábitos
  - Editar hábitos existentes
  - Marcar/desmarcar progresso diário
  - Navegação entre meses
  - Coluna "hoje" com destaque especial

### Características da UI
- **Design Responsivo:** Funciona em desktop e mobile
- **Coluna Sticky:** A coluna "hoje" fica fixa durante o scroll
- **Categorias:** Personal, Saúde, Trabalho
- **Modais:** Para adicionar e editar hábitos
- **Confirmação:** Para deletar hábitos

## 🛠️ Como Usar

### 1. Acessar a Página
Navegue para `/patient/checklist` (apenas para usuários autenticados com role "PATIENT")

### 2. Adicionar Hábito
1. Clique no botão "+" no cabeçalho
2. Preencha o nome do hábito
3. Selecione uma categoria
4. Clique em "Adicionar"

### 3. Marcar Progresso
1. Clique no círculo do dia desejado
2. O hábito será marcado/desmarcado automaticamente
3. O progresso é salvo em tempo real

### 4. Editar Hábito
1. Clique no nome do hábito na primeira coluna
2. Modifique o título ou categoria
3. Clique em "Salvar"

### 5. Deletar Hábito
1. Abra o modal de edição
2. Clique em "Excluir hábito"
3. Confirme a exclusão

## 📊 Funcionalidades Técnicas

### Segurança
- ✅ Autenticação obrigatória
- ✅ Verificação de propriedade (usuário só acessa seus próprios hábitos)
- ✅ Validação de dados de entrada

### Performance
- ✅ Índices otimizados no banco de dados
- ✅ Carregamento lazy por mês
- ✅ Debounce em operações de toggle

### UX/UI
- ✅ Feedback visual imediato
- ✅ Estados de loading
- ✅ Tratamento de erros
- ✅ Design consistente com o resto da aplicação

## 🔧 Configuração e Deploy

### 1. Migração do Banco
```bash
node scripts/migrations/add-habits.js
```

### 2. Seed de Dados de Exemplo
```bash
node scripts/seed-habits.js
```

### 3. Gerar Cliente Prisma
```bash
npx prisma generate
```

## 📈 Estatísticas e Métricas

O sistema permite acompanhar:
- **Progresso Diário:** Marcação de hábitos por dia
- **Consistência:** Histórico de aderência aos hábitos
- **Categorização:** Distribuição por tipo de hábito
- **Tendências:** Evolução ao longo do tempo

## 🔮 Próximas Funcionalidades

### Planejadas
- [ ] Notificações push para lembretes
- [ ] Relatórios de progresso
- [ ] Metas e streaks
- [ ] Compartilhamento com médicos
- [ ] Integração com protocolos médicos

### Melhorias Técnicas
- [ ] Cache Redis para performance
- [ ] Webhooks para integrações
- [ ] API para mobile app
- [ ] Exportação de dados

## 🐛 Troubleshooting

### Problemas Comuns

1. **Hábitos não carregam**
   - Verificar se o usuário está autenticado
   - Verificar se as tabelas foram criadas
   - Verificar logs do servidor

2. **Erro ao marcar progresso**
   - Verificar se o hábito existe
   - Verificar se a data está no formato correto
   - Verificar permissões do usuário

3. **Coluna "hoje" não fica sticky**
   - Verificar se os estilos CSS foram carregados
   - Verificar se o JavaScript está funcionando
   - Verificar viewport no mobile

## 📝 Logs e Monitoramento

### Logs Importantes
- Criação de hábitos
- Atualizações de progresso
- Erros de autenticação
- Performance de queries

### Métricas a Monitorar
- Tempo de resposta das APIs
- Taxa de erro
- Uso de memória
- Número de hábitos por usuário 