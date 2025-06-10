# 📱 ENDPOINTS PARA REACT NATIVE - PACIENTE

> **⚠️ IMPORTANTE**: Antes de usar, configure as variáveis de ambiente seguindo o guia em `ENV_SETUP.md`

## 🔐 **AUTENTICAÇÃO**

### 1. Login Mobile
```
POST /api/auth/mobile/login
Content-Type: application/json

Body:
{
  "email": "paciente@email.com",
  "password": "senha123"
}

Response (200):
{
  "user": {
    "id": "user_id",
    "email": "paciente@email.com", 
    "name": "Nome do Paciente",
    "image": "url_da_foto"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (401):
{
  "error": "Credenciais inválidas"
}
```

### 2. Validar Token
```
POST /api/auth/mobile/validate
Authorization: Bearer {token}

Response (200):
{
  "valid": true,
  "user": {
    "id": "user_id",
    "email": "paciente@email.com",
    "name": "Nome do Paciente", 
    "image": "url_da_foto"
  }
}

Response (401):
{
  "error": "Token inválido ou expirado",
  "valid": false
}
```

---

## 👤 **PERFIL DO PACIENTE**

### 3. Buscar Perfil Completo
```
GET /api/patient/profile
Authorization: Bearer {token}

Response (200):
{
  "user": {
    "id": "user_id",
    "name": "Nome do Paciente",
    "email": "paciente@email.com",
    "phone": "+5511999999999",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "gender": "M",
    "address": "Rua Example, 123",
    "emergencyContact": "Nome do Contato",
    "emergencyPhone": "+5511888888888",
    "medicalHistory": "Histórico médico...",
    "allergies": "Alergia a...",
    "medications": "Medicação atual...",
    "notes": "Observações...",
    "image": "url_da_foto",
    "role": "PATIENT",
    "doctorId": "doctor_id",
    "doctor": {
      "id": "doctor_id",
      "name": "Dr. Nome",
      "email": "doutor@email.com",
      "phone": "+5511777777777",
      "image": "url_foto_doutor"
    }
  }
}

Response (401):
{
  "error": "Unauthorized"
}

Response (403):
{
  "error": "Access denied. Only patients can access this endpoint."
}
```

---

## 📋 **PROTOCOLOS DO PACIENTE**

### 4. Listar Protocolos Atribuídos
```
GET /api/protocols/assignments
Authorization: Bearer {token}

Response (200):
[
  {
    "id": "assignment_id",
    "userId": "user_id",
    "protocolId": "protocol_id",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-30T00:00:00.000Z",
    "isActive": true,
    "status": "ACTIVE", // ACTIVE, INACTIVE, UNAVAILABLE
    "createdAt": "2024-01-01T00:00:00.000Z",
    "protocol": {
      "id": "protocol_id",
      "name": "Protocolo de Reabilitação",
      "duration": 30,
      "description": "Descrição do protocolo...",
      "doctor": {
        "id": "doctor_id",
        "name": "Dr. Nome",
        "email": "doutor@email.com",
        "image": "url_foto_doutor"
      },
      "days": [
        {
          "id": "day_id",
          "dayNumber": 1,
          "title": "Dia 1 - Avaliação Inicial",
          "description": "Descrição do dia...",
          "sessions": [
            {
              "id": "session_id",
              "sessionNumber": 1,
              "title": "Sessão Matinal",
              "description": "Descrição da sessão...",
              "tasks": [
                {
                  "id": "task_id",
                  "title": "Exercício de Respiração",
                  "description": "Descrição da tarefa...",
                  "orderIndex": 0
                }
              ]
            }
          ]
        }
      ]
    }
  }
]

Response (401):
{
  "error": "Não autorizado"
}

Response (403):
{
  "error": "Acesso negado. Apenas pacientes podem acessar esta funcionalidade."
}
```

---

## 📊 **PROGRESSO DOS PROTOCOLOS**

### 5. Marcar Tarefa como Concluída/Não Concluída
```
POST /api/protocols/progress
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "protocolTaskId": "task_id_aqui",
  "date": "2024-01-15",
  "notes": "Observações opcionais"
}

Response (200):
{
  "success": true,
  "progress": {
    "id": "progress_id",
    "userId": "user_id",
    "protocolId": "protocol_id",
    "protocolTaskId": "task_id",
    "dayNumber": 1,
    "date": "2024-01-15T00:00:00.000Z",
    "isCompleted": true,
    "notes": "Observações...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "protocolTask": {
      "id": "task_id",
      "title": "Exercício de Respiração",
      "description": "Descrição da tarefa...",
      "type": "task",
      "duration": 10,
      "orderIndex": 0,
      "protocolSession": {
        "id": "session_id",
        "title": "Sessão Matinal",
        "sessionNumber": 1,
        "protocolDay": {
          "id": "day_id",
          "dayNumber": 1,
          "title": "Dia 1 - Avaliação",
          "protocol": {
            "id": "protocol_id",
            "name": "Protocolo de Reabilitação",
            "duration": 30
          }
        }
      }
    },
    "user": {
      "id": "user_id",
      "name": "Nome do Paciente",
      "email": "paciente@email.com"
    }
  },
  "action": "created", // ou "toggled"
  "isCompleted": true
}

Response (404):
{
  "error": "Tarefa não encontrada"
}

Response (403):
{
  "error": "Acesso negado a esta tarefa"
}
```

### 6. Buscar Progresso do Protocolo
```
GET /api/protocols/progress?protocolId={protocol_id}&date={date}
Authorization: Bearer {token}

Parâmetros opcionais:
- protocolId: ID do protocolo específico
- date: Data específica (formato: YYYY-MM-DD)
- userId: ID do usuário (apenas para médicos)

Response (200):
[
  {
    "id": "progress_id",
    "userId": "user_id",
    "protocolId": "protocol_id",
    "protocolTaskId": "task_id",
    "dayNumber": 1,
    "date": "2024-01-15T00:00:00.000Z",
    "isCompleted": true,
    "notes": "Tarefa concluída com sucesso",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "protocolTask": {
      "id": "task_id",
      "title": "Exercício de Respiração",
      "description": "Respiração profunda por 5 minutos",
      "type": "task",
      "duration": 5,
      "orderIndex": 0,
      "protocolSession": {
        "id": "session_id",
        "title": "Sessão Matinal",
        "sessionNumber": 1,
        "protocolDay": {
          "id": "day_id",
          "dayNumber": 1,
          "title": "Dia 1 - Avaliação Inicial",
          "protocol": {
            "id": "protocol_id",
            "name": "Protocolo de Reabilitação Cardíaca",
            "duration": 30
          }
        }
      }
    },
    "user": {
      "id": "user_id",
      "name": "Nome do Paciente",
      "email": "paciente@email.com"
    }
  }
]
```

---

## 🔧 **COMO USAR NO REACT NATIVE**

### Configuração do Axios
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ SUBSTITUA pela URL do seu servidor
const API_BASE_URL = 'https://sua-api.com'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar token expirado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado - fazer logout
      await AsyncStorage.removeItem('userToken');
      // Redirecionar para login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Funções de API
```javascript
// Login
export const login = async (email, password) => {
  const response = await api.post('/api/auth/mobile/login', {
    email,
    password
  });
  return response.data;
};

// Validar token
export const validateToken = async () => {
  const response = await api.post('/api/auth/mobile/validate');
  return response.data;
};

// Buscar perfil
export const getProfile = async () => {
  const response = await api.get('/api/patient/profile');
  return response.data;
};

// Buscar protocolos
export const getProtocols = async () => {
  const response = await api.get('/api/protocols/assignments');
  return response.data;
};

// Marcar tarefa como concluída
export const toggleTaskProgress = async (protocolTaskId, date, notes = '') => {
  const response = await api.post('/api/protocols/progress', {
    protocolTaskId,
    date,
    notes
  });
  return response.data;
};

// Buscar progresso do protocolo
export const getProtocolProgress = async (protocolId, date = null) => {
  const params = new URLSearchParams();
  if (protocolId) params.append('protocolId', protocolId);
  if (date) params.append('date', date);
  
  const response = await api.get(`/api/protocols/progress?${params.toString()}`);
  return response.data;
};
```

### Exemplo de Uso - Tela de Checklist
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { getProtocols, getProtocolProgress, toggleTaskProgress } from './api';

const ProtocolChecklistScreen = ({ route }) => {
  const { protocolId } = route.params;
  const [protocol, setProtocol] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProtocolData();
  }, []);

  const loadProtocolData = async () => {
    try {
      // Carregar protocolo e progresso
      const [protocolsData, progressData] = await Promise.all([
        getProtocols(),
        getProtocolProgress(protocolId)
      ]);

      const currentProtocol = protocolsData.find(p => p.protocolId === protocolId);
      setProtocol(currentProtocol);
      setProgress(progressData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, date) => {
    try {
      // Atualização otimista
      setProgress(prev => {
        const existing = prev.find(p => p.protocolTaskId === taskId && p.date.startsWith(date));
        if (existing) {
          return prev.map(p => 
            p.protocolTaskId === taskId && p.date.startsWith(date)
              ? { ...p, isCompleted: !p.isCompleted }
              : p
          );
        } else {
          return [...prev, {
            protocolTaskId: taskId,
            date: `${date}T00:00:00.000Z`,
            isCompleted: true,
            _optimistic: true
          }];
        }
      });

      // Chamada da API
      const result = await toggleTaskProgress(taskId, date);
      
      // Atualizar com dados reais
      setProgress(prev => 
        prev.map(p => 
          p.protocolTaskId === taskId && p.date.startsWith(date)
            ? result.progress
            : p
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      // Reverter mudança otimista
      loadProtocolData();
    }
  };

  const isTaskCompleted = (taskId, date) => {
    const progressItem = progress.find(p => 
      p.protocolTaskId === taskId && p.date.startsWith(date)
    );
    return progressItem?.isCompleted || false;
  };

  const renderTask = ({ item: task, index }) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const isCompleted = isTaskCompleted(task.id, today);

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          isCompleted && styles.taskCompleted
        ]}
        onPress={() => handleToggleTask(task.id, today)}
      >
        <View style={styles.checkbox}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {task.description && (
            <Text style={styles.taskDescription}>{task.description}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Text>Carregando...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{protocol?.protocol.name}</Text>
      
      <FlatList
        data={protocol?.protocol.days[0]?.sessions[0]?.tasks || []}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = {
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  taskCompleted: {
    backgroundColor: '#e8f5e8',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'green',
    fontWeight: 'bold',
  },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '500' },
  taskDescription: { fontSize: 14, color: '#666', marginTop: 4 },
};

export default ProtocolChecklistScreen;
```

---

## ✅ **STATUS DOS ENDPOINTS**

- ✅ **Login Mobile**: `/api/auth/mobile/login` - **PRONTO**
- ✅ **Validar Token**: `/api/auth/mobile/validate` - **CRIADO**
- ✅ **Perfil Paciente**: `/api/patient/profile` - **ATUALIZADO** (suporte mobile)
- ✅ **Protocolos**: `/api/protocols/assignments` - **CRIADO**
- ✅ **Marcar Progresso**: `/api/protocols/progress` - **ATUALIZADO** (suporte mobile)
- ✅ **Buscar Progresso**: `/api/protocols/progress` - **ATUALIZADO** (suporte mobile)

---

## 🔒 **SEGURANÇA**

- **JWT Token**: Expira em 30 dias
- **Autenticação Dupla**: Suporta web (NextAuth) + mobile (JWT)
- **Validação de Role**: Apenas pacientes acessam endpoints de paciente
- **Headers Obrigatórios**: `Authorization: Bearer {token}`
- **Variáveis de Ambiente**: Todas as chaves secretas estão protegidas

---

## 🚀 **CONFIGURAÇÃO PARA PRODUÇÃO**

1. **Configure as variáveis de ambiente** seguindo `ENV_SETUP.md`
2. **Substitua `API_BASE_URL`** pela URL do seu servidor
3. **Teste todos os endpoints** antes de publicar
4. **Configure CORS** se necessário para React Native

---

## 📱 **PRÓXIMOS ENDPOINTS (OPCIONAIS)**

Se quiser expandir o app, estes endpoints já existem:
- `/api/symptom-reports` - Relatórios de sintomas
- `/api/patient/ai-chat` - Chat com IA
- `/api/transcribe-audio` - Transcrição de áudio
- `/api/patient/stats` - Estatísticas do paciente 