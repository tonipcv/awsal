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

## 🎁 **SISTEMA DE INDICAÇÕES**

### 7. Buscar Dashboard de Indicações
```
GET /api/referrals/patient
Authorization: Bearer {token}

Response (200):
{
  "stats": {
    "totalReferrals": 5,
    "convertedReferrals": 2,
    "totalCreditsEarned": 10,
    "totalCreditsUsed": 3,
    "currentBalance": 7
  },
  "creditsBalance": 7,
  "creditsHistory": [
    {
      "id": "credit_id",
      "amount": 5,
      "type": "SUCCESSFUL_REFERRAL",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lead": {
        "name": "João Silva",
        "email": "joao@email.com",
        "status": "CONVERTED"
      }
    }
  ],
  "referralsMade": [
    {
      "id": "referral_id",
      "name": "João Silva",
      "email": "joao@email.com",
      "status": "CONVERTED",
      "createdAt": "2024-01-10T10:30:00.000Z",
      "doctor": {
        "id": "doctor_id",
        "name": "Dr. Nome"
      },
      "credits": [
        {
          "id": "credit_id",
          "amount": 5,
          "status": "AVAILABLE"
        }
      ]
    }
  ],
  "availableRewards": [
    {
      "id": "reward_id",
      "title": "Desconto de 20%",
      "description": "20% de desconto na próxima consulta",
      "creditsRequired": 10,
      "maxRedemptions": 50,
      "currentRedemptions": 15,
      "isActive": true
    }
  ],
  "redemptionsHistory": [
    {
      "id": "redemption_id",
      "creditsUsed": 10,
      "status": "PENDING",
      "redeemedAt": "2024-01-20T10:30:00.000Z",
      "reward": {
        "title": "Desconto de 20%",
        "description": "20% de desconto na próxima consulta",
        "creditsRequired": 10
      }
    }
  ],
  "doctorId": "doctor_id",
  "referralCode": "ABC123"
}
```

### 8. Criar Nova Indicação
```
POST /api/referrals/create
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "+5511999999999",
  "notes": "Amigo interessado em tratamento"
}

Response (200):
{
  "success": true,
  "referral": {
    "id": "referral_id",
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "+5511999999999",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "doctor": {
      "id": "doctor_id",
      "name": "Dr. Nome",
      "email": "doutor@email.com"
    }
  },
  "message": "Indicação criada com sucesso! O médico será notificado."
}

Response (400):
{
  "error": "Esta pessoa já possui uma conta no sistema"
}

Response (400):
{
  "error": "Já existe uma indicação pendente para este email"
}
```

### 9. Resgatar Recompensa
```
POST /api/referrals/patient
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "rewardId": "reward_id_aqui"
}

Response (200):
{
  "success": true,
  "redemption": {
    "id": "redemption_id",
    "userId": "user_id",
    "rewardId": "reward_id",
    "creditsUsed": 10,
    "status": "PENDING",
    "redeemedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Recompensa resgatada com sucesso! Aguarde a confirmação do seu médico."
}

Response (400):
{
  "error": "Créditos insuficientes. Você tem 5, mas precisa de 10"
}

Response (400):
{
  "error": "Você já resgatou esta recompensa nas últimas 24 horas"
}
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

// Buscar dashboard de indicações
export const getReferralsDashboard = async () => {
  const response = await api.get('/api/referrals/patient');
  return response.data;
};

// Criar nova indicação
export const createReferral = async (name, email, phone = '', notes = '') => {
  const response = await api.post('/api/referrals/create', {
    name,
    email,
    phone,
    notes
  });
  return response.data;
};

// Resgatar recompensa
export const redeemReward = async (rewardId) => {
  const response = await api.post('/api/referrals/patient', {
    rewardId
  });
  return response.data;
};
```

### Exemplo de Uso - Tela de Indicações
```javascript
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ScrollView 
} from 'react-native';
import { getReferralsDashboard, createReferral, redeemReward } from './api';

const ReferralsScreen = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getReferralsDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Erro', 'Nome e email são obrigatórios');
      return;
    }

    try {
      await createReferral(
        formData.name,
        formData.email,
        formData.phone,
        formData.notes
      );
      
      Alert.alert('Sucesso', 'Indicação criada com sucesso!');
      setFormData({ name: '', email: '', phone: '', notes: '' });
      setShowCreateForm(false);
      loadDashboard(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao criar indicação:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao criar indicação');
    }
  };

  const handleRedeemReward = async (rewardId) => {
    try {
      await redeemReward(rewardId);
      Alert.alert('Sucesso', 'Recompensa resgatada! Aguarde a confirmação do médico.');
      loadDashboard(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao resgatar recompensa:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao resgatar recompensa');
    }
  };

  const renderReferral = ({ item }) => (
    <View style={styles.referralItem}>
      <Text style={styles.referralName}>{item.name}</Text>
      <Text style={styles.referralEmail}>{item.email}</Text>
      <Text style={[styles.status, styles[`status${item.status}`]]}>
        {item.status === 'PENDING' ? 'Pendente' : 
         item.status === 'CONTACTED' ? 'Contatado' : 
         item.status === 'CONVERTED' ? 'Convertido' : 'Rejeitado'}
      </Text>
      {item.credits.length > 0 && (
        <Text style={styles.credits}>
          Créditos: {item.credits.reduce((sum, c) => sum + c.amount, 0)}
        </Text>
      )}
    </View>
  );

  const renderReward = ({ item }) => (
    <View style={styles.rewardItem}>
      <Text style={styles.rewardTitle}>{item.title}</Text>
      <Text style={styles.rewardDescription}>{item.description}</Text>
      <Text style={styles.rewardCredits}>
        {item.creditsRequired} créditos
      </Text>
      <TouchableOpacity
        style={[
          styles.redeemButton,
          dashboard.creditsBalance < item.creditsRequired && styles.redeemButtonDisabled
        ]}
        onPress={() => handleRedeemReward(item.id)}
        disabled={dashboard.creditsBalance < item.creditsRequired}
      >
        <Text style={styles.redeemButtonText}>
          {dashboard.creditsBalance >= item.creditsRequired ? 'Resgatar' : 'Créditos Insuficientes'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header com estatísticas */}
      <View style={styles.statsContainer}>
        <Text style={styles.title}>Minhas Indicações</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dashboard.stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dashboard.stats.convertedReferrals}</Text>
            <Text style={styles.statLabel}>Convertidas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dashboard.creditsBalance}</Text>
            <Text style={styles.statLabel}>Créditos</Text>
          </View>
        </View>
      </View>

      {/* Botão para criar nova indicação */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateForm(!showCreateForm)}
      >
        <Text style={styles.createButtonText}>
          {showCreateForm ? 'Cancelar' : '+ Nova Indicação'}
        </Text>
      </TouchableOpacity>

      {/* Formulário de criação */}
      {showCreateForm && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Telefone (opcional)"
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Observações (opcional)"
            value={formData.notes}
            onChangeText={(text) => setFormData({...formData, notes: text})}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreateReferral}
          >
            <Text style={styles.submitButtonText}>Criar Indicação</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de indicações */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minhas Indicações</Text>
        <FlatList
          data={dashboard.referralsMade}
          renderItem={renderReferral}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      {/* Recompensas disponíveis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recompensas Disponíveis</Text>
        <FlatList
          data={dashboard.availableRewards}
          renderItem={renderReward}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      {/* Código de indicação */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seu Código de Indicação</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.referralCode}>{dashboard.referralCode}</Text>
          <Text style={styles.codeDescription}>
            Compartilhe este código com seus amigos
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statsContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { fontSize: 14, color: '#666' },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '500' },
  formContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '500' },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  referralItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  referralName: { fontSize: 16, fontWeight: '500' },
  referralEmail: { fontSize: 14, color: '#666', marginTop: 2 },
  status: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  statusPENDING: { color: '#FF9500' },
  statusCONTACTED: { color: '#007AFF' },
  statusCONVERTED: { color: '#34C759' },
  statusREJECTED: { color: '#FF3B30' },
  credits: { fontSize: 12, color: '#34C759', marginTop: 2 },
  rewardItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rewardTitle: { fontSize: 16, fontWeight: '500' },
  rewardDescription: { fontSize: 14, color: '#666', marginTop: 2 },
  rewardCredits: { fontSize: 14, color: '#007AFF', marginTop: 4 },
  redeemButton: {
    backgroundColor: '#34C759',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  redeemButtonDisabled: { backgroundColor: '#ccc' },
  redeemButtonText: { color: 'white', fontSize: 14, fontWeight: '500' },
  codeContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: 2,
  },
  codeDescription: { fontSize: 14, color: '#666', marginTop: 8 },
};

export default ReferralsScreen;
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
- ✅ **Dashboard Indicações**: `/api/referrals/patient` - **ATUALIZADO** (suporte mobile)
- ✅ **Criar Indicação**: `/api/referrals/create` - **CRIADO**
- ✅ **Resgatar Recompensa**: `/api/referrals/patient` - **ATUALIZADO** (suporte mobile)

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