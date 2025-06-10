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

## 📚 **SISTEMA DE CURSOS**

### 10. Buscar Cursos Disponíveis
```
GET /api/courses/available
Authorization: Bearer {token}

Response (200):
{
  "active": [
    {
      "id": "course_id",
      "name": "Curso de Reabilitação Cardíaca",
      "description": "Curso completo sobre reabilitação...",
      "coverImage": "url_da_imagem",
      "status": "active",
      "doctor": {
        "id": "doctor_id",
        "name": "Dr. Nome",
        "email": "doutor@email.com"
      },
      "modules": [
        {
          "id": "module_id",
          "name": "Módulo 1 - Introdução",
          "description": "Descrição do módulo...",
          "lessons": [
            {
              "id": "lesson_id",
              "title": "Lição 1 - Conceitos Básicos",
              "duration": 15
            }
          ]
        }
      ],
      "_count": {
        "modules": 3
      }
    }
  ],
  "unavailable": [
    {
      "id": "course_id_2",
      "name": "Curso Avançado",
      "description": "Curso não disponível para você...",
      "status": "unavailable",
      "modalTitle": "Curso Premium",
      "modalDescription": "Este curso está disponível apenas para pacientes premium",
      "modalVideoUrl": "url_do_video",
      "modalButtonText": "Saber mais",
      "modalButtonUrl": "https://link-externo.com"
    }
  ]
}
```

### 11. Buscar Curso Específico
```
GET /api/courses/{course_id}
Authorization: Bearer {token}

Response (200):
{
  "id": "course_id",
  "name": "Curso de Reabilitação Cardíaca",
  "description": "Curso completo sobre reabilitação...",
  "coverImage": "url_da_imagem",
  "modules": [
    {
      "id": "module_id",
      "name": "Módulo 1 - Introdução",
      "description": "Descrição do módulo...",
      "order": 0,
      "lessons": [
        {
          "id": "lesson_id",
          "title": "Lição 1 - Conceitos Básicos",
          "content": "Conteúdo da lição...",
          "videoUrl": "url_do_video",
          "duration": 15,
          "order": 0,
          "completed": true,
          "completedAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  ],
  "assignment": {
    "id": "assignment_id",
    "enrolledAt": "2024-01-01T00:00:00.000Z",
    "completedAt": null,
    "progress": 75
  }
}

Response (403):
{
  "error": "Curso não atribuído a você"
}
```

### 12. Marcar Lição como Concluída
```
POST /api/courses/lessons/complete
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "lessonId": "lesson_id_aqui"
}

Response (200):
{
  "success": true,
  "userLesson": {
    "id": "user_lesson_id",
    "userId": "user_id",
    "lessonId": "lesson_id",
    "completedAt": "2024-01-15T10:30:00.000Z",
    "isCompleted": true,
    "lesson": {
      "id": "lesson_id",
      "title": "Lição 1 - Conceitos Básicos",
      "duration": 15,
      "course": {
        "id": "course_id",
        "name": "Curso de Reabilitação Cardíaca"
      }
    }
  },
  "action": "created", // ou "toggled"
  "isCompleted": true
}

Response (404):
{
  "error": "Lição não encontrada"
}

Response (403):
{
  "error": "Você não tem acesso a esta lição"
}
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
- ✅ **Cursos Disponíveis**: `/api/courses/available` - **ATUALIZADO** (suporte mobile)
- ✅ **Curso Específico**: `/api/courses/{id}` - **ATUALIZADO** (suporte mobile)
- ✅ **Marcar Lição**: `/api/courses/lessons/complete` - **CRIADO**

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
// ========== AUTENTICAÇÃO ==========
export const login = async (email, password) => {
  const response = await api.post('/api/auth/mobile/login', {
    email,
    password
  });
  return response.data;
};

export const validateToken = async () => {
  const response = await api.post('/api/auth/mobile/validate');
  return response.data;
};

// ========== PERFIL ==========
export const getProfile = async () => {
  const response = await api.get('/api/patient/profile');
  return response.data;
};

// ========== PROTOCOLOS ==========
export const getProtocols = async () => {
  const response = await api.get('/api/protocols/assignments');
  return response.data;
};

export const toggleTaskProgress = async (protocolTaskId, date, notes = '') => {
  const response = await api.post('/api/protocols/progress', {
    protocolTaskId,
    date,
    notes
  });
  return response.data;
};

export const getProtocolProgress = async (protocolId, date = null) => {
  const params = new URLSearchParams();
  if (protocolId) params.append('protocolId', protocolId);
  if (date) params.append('date', date);
  
  const response = await api.get(`/api/protocols/progress?${params.toString()}`);
  return response.data;
};

// ========== INDICAÇÕES ==========
export const getReferralsDashboard = async () => {
  const response = await api.get('/api/referrals/patient');
  return response.data;
};

export const createReferral = async (name, email, phone = '', notes = '') => {
  const response = await api.post('/api/referrals/create', {
    name,
    email,
    phone,
    notes
  });
  return response.data;
};

export const redeemReward = async (rewardId) => {
  const response = await api.post('/api/referrals/patient', {
    rewardId
  });
  return response.data;
};

// ========== CURSOS ==========
export const getAvailableCourses = async () => {
  const response = await api.get('/api/courses/available');
  return response.data;
};

export const getCourse = async (courseId) => {
  const response = await api.get(`/api/courses/${courseId}`);
  return response.data;
};

export const completeLessonToggle = async (lessonId) => {
  const response = await api.post('/api/courses/lessons/complete', {
    lessonId
  });
  return response.data;
};
```

### Exemplo de Uso - Tela de Cursos
```javascript
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ScrollView,
  Image 
} from 'react-native';
import { getAvailableCourses, getCourse } from './api';

const CoursesScreen = ({ navigation }) => {
  const [coursesData, setCoursesData] = useState({ active: [], unavailable: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getAvailableCourses();
      setCoursesData(data);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os cursos');
    } finally {
      setLoading(false);
    }
  };

  const getTotalLessons = (course) => {
    return course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  };

  const getTotalDuration = (course) => {
    return course.modules.reduce((acc, module) => 
      acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0), 0
    );
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const renderActiveCourse = ({ item }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
    >
      {item.coverImage && (
        <Image source={{ uri: item.coverImage }} style={styles.courseImage} />
      )}
      <View style={styles.courseContent}>
        <Text style={styles.courseTitle}>{item.name}</Text>
        <Text style={styles.courseDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.courseStats}>
          <Text style={styles.statText}>
            📚 {getTotalLessons(item)} lições
          </Text>
          <Text style={styles.statText}>
            ⏱️ {formatDuration(getTotalDuration(item))}
          </Text>
        </View>
        <Text style={styles.doctorName}>
          👨‍⚕️ {item.doctor.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderUnavailableCourse = ({ item }) => (
    <TouchableOpacity
      style={[styles.courseCard, styles.unavailableCourse]}
      onPress={() => {
        if (item.modalTitle) {
          Alert.alert(
            item.modalTitle,
            item.modalDescription,
            [
              { text: 'Fechar', style: 'cancel' },
              ...(item.modalButtonUrl ? [{
                text: item.modalButtonText || 'Saber mais',
                onPress: () => {
                  // Abrir URL externa ou navegar
                  console.log('Abrir:', item.modalButtonUrl);
                }
              }] : [])
            ]
          );
        }
      }}
    >
      {item.coverImage && (
        <Image source={{ uri: item.coverImage }} style={styles.courseImage} />
      )}
      <View style={styles.courseContent}>
        <Text style={styles.courseTitle}>{item.name}</Text>
        <Text style={styles.courseDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.unavailableText}>
          🔒 Curso não disponível
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando cursos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Cursos Ativos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meus Cursos</Text>
        {coursesData.active.length > 0 ? (
          <FlatList
            data={coursesData.active}
            renderItem={renderActiveCourse}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>
            Nenhum curso atribuído ainda
          </Text>
        )}
      </View>

      {/* Cursos Indisponíveis */}
      {coursesData.unavailable.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outros Cursos</Text>
          <FlatList
            data={coursesData.unavailable}
            renderItem={renderUnavailableCourse}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  courseCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  unavailableCourse: {
    opacity: 0.7,
  },
  courseImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  courseContent: { padding: 12 },
  courseTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  courseDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statText: { fontSize: 12, color: '#007AFF' },
  doctorName: { fontSize: 12, color: '#666' },
  unavailableText: { fontSize: 12, color: '#FF9500', fontWeight: '500' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', padding: 20 },
};

export default CoursesScreen;
```

### Exemplo de Uso - Tela de Curso Específico
```javascript
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  ScrollView 
} from 'react-native';
import { getCourse, completeLessonToggle } from './api';

const CourseDetailScreen = ({ route }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, []);

  const loadCourse = async () => {
    try {
      const data = await getCourse(courseId);
      setCourse(data);
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      Alert.alert('Erro', 'Não foi possível carregar o curso');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLesson = async (lessonId) => {
    try {
      // Atualização otimista
      setCourse(prev => ({
        ...prev,
        modules: prev.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, completed: !lesson.completed }
              : lesson
          )
        }))
      }));

      const result = await completeLessonToggle(lessonId);
      
      // Recarregar curso para atualizar progresso
      loadCourse();
    } catch (error) {
      console.error('Erro ao atualizar lição:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a lição');
      // Reverter mudança otimista
      loadCourse();
    }
  };

  const renderLesson = ({ item: lesson }) => (
    <TouchableOpacity
      style={[
        styles.lessonItem,
        lesson.completed && styles.lessonCompleted
      ]}
      onPress={() => handleToggleLesson(lesson.id)}
    >
      <View style={styles.checkbox}>
        {lesson.completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.lessonContent}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        {lesson.duration && (
          <Text style={styles.lessonDuration}>
            ⏱️ {lesson.duration} min
          </Text>
        )}
        {lesson.videoUrl && (
          <Text style={styles.hasVideo}>🎥 Vídeo disponível</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderModule = ({ item: module }) => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleTitle}>{module.name}</Text>
      {module.description && (
        <Text style={styles.moduleDescription}>{module.description}</Text>
      )}
      <FlatList
        data={module.lessons}
        renderItem={renderLesson}
        keyExtractor={(lesson) => lesson.id}
        scrollEnabled={false}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando curso...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.container}>
        <Text>Curso não encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header do Curso */}
      <View style={styles.header}>
        <Text style={styles.courseTitle}>{course.name}</Text>
        {course.description && (
          <Text style={styles.courseDescription}>{course.description}</Text>
        )}
        
        {/* Progresso */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progresso: {course.assignment.progress}%
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${course.assignment.progress}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Módulos e Lições */}
      <FlatList
        data={course.modules}
        renderItem={renderModule}
        keyExtractor={(module) => module.id}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  courseTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  courseDescription: { fontSize: 16, color: '#666', marginBottom: 16 },
  progressContainer: { marginTop: 8 },
  progressText: { fontSize: 14, color: '#007AFF', marginBottom: 8 },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  moduleContainer: {
    backgroundColor: 'white',
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  moduleTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  moduleDescription: { fontSize: 14, color: '#666', marginBottom: 12 },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  lessonCompleted: {
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
  lessonContent: { flex: 1 },
  lessonTitle: { fontSize: 16, fontWeight: '500' },
  lessonDuration: { fontSize: 12, color: '#007AFF', marginTop: 2 },
  hasVideo: { fontSize: 12, color: '#FF9500', marginTop: 2 },
};

export default CourseDetailScreen; 