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
```

### Exemplo de Uso
```javascript
// Login
const handleLogin = async (email, password) => {
  try {
    const { user, token } = await login(email, password);
    await AsyncStorage.setItem('userToken', token);
    // Navegar para tela principal
  } catch (error) {
    console.error('Erro no login:', error.response?.data?.error);
  }
};

// Carregar perfil
const loadProfile = async () => {
  try {
    const { user } = await getProfile();
    setUserData(user);
  } catch (error) {
    console.error('Erro ao carregar perfil:', error.response?.data?.error);
  }
};

// Carregar protocolos
const loadProtocols = async () => {
  try {
    const protocols = await getProtocols();
    setProtocolsData(protocols);
  } catch (error) {
    console.error('Erro ao carregar protocolos:', error.response?.data?.error);
  }
};
```

---

## ✅ **STATUS DOS ENDPOINTS**

- ✅ **Login Mobile**: `/api/auth/mobile/login` - **PRONTO**
- ✅ **Validar Token**: `/api/auth/mobile/validate` - **CRIADO**
- ✅ **Perfil Paciente**: `/api/patient/profile` - **ATUALIZADO** (suporte mobile)
- ✅ **Protocolos**: `/api/protocols/assignments` - **CRIADO**

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