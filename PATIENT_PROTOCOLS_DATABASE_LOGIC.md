# Lógica de Banco de Dados - Página de Protocolos do Paciente

## Visão Geral

A página `/patient/protocols` é responsável por exibir todos os protocolos disponíveis para um paciente específico, organizados por status e com diferentes estados de interação. Este documento explica como a aplicação se conecta com o banco de dados e processa as informações.

## Estrutura de Dados

### Modelos Principais

#### 1. **Protocol** (Protocolo)
```typescript
interface Protocol {
  id: string;
  name: string;
  duration: number; // Duração em dias
  description?: string;
  consultation_date?: string | null;
  showDoctorInfo?: boolean;
  modalTitle?: string;
  modalVideoUrl?: string;
  modalDescription?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
  coverImage?: string;
  onboardingTemplateId?: string | null;
  days: ProtocolDay[];
  doctor: Doctor;
  assignments: Assignment[];
}
```

#### 2. **ActiveProtocol** (Protocolo Ativo)
```typescript
interface ActiveProtocol {
  id: string;
  userId: string;
  protocolId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  status: string; // 'ACTIVE' | 'INACTIVE' | 'UNAVAILABLE' | 'SOON'
  currentDay: number;
  preConsultationStatus?: string;
  protocol: Protocol;
}
```

#### 3. **ProtocolDay** (Dia do Protocolo)
```typescript
interface ProtocolDay {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  sessions: ProtocolSession[];
  tasks?: ProtocolTask[];
}
```

## Fluxo de Dados

### 1. **Carregamento Inicial**

```typescript
const loadProtocols = async () => {
  // 1. Verificar se o usuário está autenticado
  if (!session?.user?.id) return;

  // 2. Detectar slug da clínica (multi-tenant)
  let clinicSlug = sessionStorage.getItem('clinicSlug') || 
                   localStorage.getItem('clinicSlug');

  // 3. Fallback: buscar slug via API se não encontrado
  if (!clinicSlug) {
    const clinicResponse = await fetch('/api/patient/clinic-slug');
    if (clinicResponse.ok) {
      const clinicData = await clinicResponse.json();
      clinicSlug = clinicData.clinicSlug;
    }
  }

  // 4. Construir URL da API com contexto da clínica
  let apiUrl = '/api/protocols/assign';
  if (clinicSlug) {
    apiUrl += `?clinicSlug=${encodeURIComponent(clinicSlug)}`;
  }

  // 5. Buscar protocolos atribuídos ao paciente
  const response = await fetch(apiUrl);
  const data = await response.json();
  setProtocols(data || []);
};
```

### 2. **API Endpoint: `/api/protocols/assign`**

Este endpoint retorna todos os protocolos atribuídos ao paciente autenticado:

```sql
-- Query equivalente (simplificada)
SELECT 
  up.*,
  p.*,
  d.name as doctor_name,
  d.email as doctor_email,
  d.image as doctor_image
FROM user_protocols up
JOIN protocols p ON up.protocol_id = p.id
JOIN users d ON p.doctor_id = d.id
WHERE up.user_id = ? 
  AND p.clinic_slug = ? (se aplicável)
ORDER BY up.created_at DESC;
```

### 3. **Processamento de Status**

A aplicação categoriza os protocolos em diferentes grupos:

```typescript
// Separação por status com hierarquia de prioridade
const unavailableProtocols = protocols.filter(p => p.status === 'UNAVAILABLE');
const soonProtocols = protocols.filter(p => p.status === 'SOON' && p.isActive);
const activeProtocols = protocols.filter(p => 
  p.status === 'ACTIVE' && p.isActive
);
const inactiveProtocols = protocols.filter(p => 
  p.status !== 'UNAVAILABLE' && (p.status === 'INACTIVE' || !p.isActive)
);
```

### 4. **Cálculo de Progresso**

```typescript
const getProtocolProgress = (protocol: ActiveProtocol) => {
  const today = new Date();
  const startDate = new Date(protocol.startDate);
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const currentDay = Math.max(1, Math.min(diffDays, protocol.protocol.duration));
  const progressPercentage = Math.round((currentDay / protocol.protocol.duration) * 100);
  
  return {
    currentDay,
    totalDays: protocol.protocol.duration,
    progressPercentage
  };
};
```

## Estados dos Protocolos

### 1. **ACTIVE** (Ativo)
- Protocolo em andamento
- Paciente pode continuar as tarefas
- Mostra progresso atual
- Botão: "Continuar" ou "Ver Progresso" (se completo)

### 2. **SOON** (Em Breve)
- Protocolo agendado para iniciar
- Pode ter consulta marcada
- Onboarding pode estar disponível
- Botão: "Preencher onboard" ou "Aguardando consulta"

### 3. **UNAVAILABLE** (Indisponível)
- Protocolo não acessível no momento
- Exibido em escala de cinza
- Apenas visualização de detalhes (se configurado)
- Sem botão de ação

### 4. **INACTIVE** (Inativo)
- Protocolo pausado ou concluído
- Histórico mantido
- Exibido com menor destaque
- Botão: "Ver detalhes" (se configurado)

## Funcionalidades Específicas

### 1. **Multi-tenant (Clínicas)**
```typescript
// Detecção automática da clínica
let clinicSlug = sessionStorage.getItem('clinicSlug') || 
                 localStorage.getItem('clinicSlug');

// Filtro por clínica na API
if (clinicSlug) {
  apiUrl += `?clinicSlug=${encodeURIComponent(clinicSlug)}`;
}
```

### 2. **Onboarding Integration**
```typescript
const handleOnboardClick = async (templateId: string, patientId: string) => {
  const response = await fetch('/api/onboarding/generate-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, patientId }),
  });

  const data = await response.json();
  router.push(`/onboarding/${data.token}`);
};
```

### 3. **Progress Tracking**
```typescript
const getTotalTasks = (protocol: Protocol) => {
  return protocol.days.reduce((acc, day) => {
    // Tarefas das sessões
    const sessionTasks = day.sessions?.reduce((sessionAcc, session) => 
      sessionAcc + (session.tasks?.length || 0), 0) || 0;
    
    // Tarefas diretas do dia
    const directTasks = day.tasks?.length || 0;
    
    return acc + sessionTasks + directTasks;
  }, 0);
};
```

## Navegação e Links

### 1. **Protocolo Completo**
```typescript
// Quando isCompleted = true
<Link href={`/patient/checklist/${assignment.protocol.id}`}>
  <button>Ver Progresso</button>
</Link>
```

### 2. **Protocolo Ativo**
```typescript
// Quando onboarding está completo
<Link href={`/patient/checklist/${assignment.protocol.id}`}>
  <button>Continuar</button>
</Link>
```

### 3. **Onboarding Pendente**
```typescript
// Quando onboarding é necessário
<button onClick={() => handleOnboardClick(templateId, patientId)}>
  Preencher onboard
</button>
```

## Otimizações de Performance

### 1. **Lazy Loading**
- Protocolos carregados apenas quando necessário
- Imagens de capa com loading otimizado
- Estados de loading específicos

### 2. **Caching**
- Slug da clínica armazenado em sessionStorage/localStorage
- Dados do médico reutilizados entre protocolos

### 3. **Error Handling**
- Fallbacks para dados ausentes
- Estados de erro específicos
- Retry automático em falhas de rede

## Segurança

### 1. **Autenticação**
```typescript
// Verificação de sessão em todas as operações
if (!session?.user?.id) return;
```

### 2. **Autorização**
- Pacientes só veem seus próprios protocolos
- Filtro por relacionamento médico-paciente
- Validação de permissões no backend

### 3. **Sanitização**
- Dados de entrada validados
- URLs de imagem verificadas
- Prevenção de XSS em conteúdo dinâmico

## Monitoramento e Debug

### 1. **Logging**
```typescript
console.log('Active protocols:', protocols.filter(p => p.status === 'ACTIVE'));
console.log('Soon protocols:', protocols.filter(p => p.status === 'SOON'));
```

### 2. **Error Tracking**
```typescript
try {
  // Operação de banco
} catch (error) {
  console.error('Error loading protocols:', error);
  setError('Erro ao carregar protocolos. Tente novamente.');
}
```

### 3. **Performance Metrics**
- Tempo de carregamento dos protocolos
- Taxa de sucesso das operações
- Uso de recursos do cliente

## Conclusão

A página de protocolos do paciente implementa uma arquitetura robusta que:

1. **Separa responsabilidades** entre frontend e backend
2. **Otimiza performance** com carregamento inteligente
3. **Garante segurança** com validações múltiplas
4. **Oferece flexibilidade** para diferentes tipos de protocolo
5. **Mantém consistência** de dados entre sessões
6. **Suporta multi-tenancy** para diferentes clínicas

Esta estrutura permite escalabilidade e manutenibilidade, facilitando futuras expansões e modificações do sistema. 