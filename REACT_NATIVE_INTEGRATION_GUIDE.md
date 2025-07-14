# 📱 Guia de Integração React Native

## 🔑 Autenticação

### Login
```typescript
POST /api/auth/mobile/login
Content-Type: application/json

Request:
{
  "email": string,
  "password": string
}

Response:
{
  "token": string,      // JWT token para usar em todas as requisições
  "user": {
    "id": string,
    "name": string,
    "email": string,
    "role": "PATIENT",
    "image": string | null
  }
}
```

### Validação de Token
```typescript
GET /api/auth/mobile/validate
Authorization: Bearer {token}

Response:
{
  "isValid": boolean,
  "user": {
    "id": string,
    "name": string,
    "email": string,
    "role": "PATIENT"
  }
}
```

## 📋 Protocolos

### Listar Protocolos do Usuário
```typescript
GET /api/protocols/assignments
Authorization: Bearer {token}

Response:
{
  "assignments": [
    {
      "id": string,
      "protocolId": string,
      "userId": string,
      "startDate": string,
      "endDate": string,
      "status": "PRESCRIBED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED",
      "isActive": boolean,
      "protocol": {
        "id": string,
        "name": string,
        "description": string,
        "duration": number,
        "coverImage": string,
        "doctor": {
          "id": string,
          "name": string,
          "email": string,
          "image": string
        },
        "days": [
          {
            "id": string,
            "dayNumber": number,
            "title": string,
            "sessions": [
              {
                "id": string,
                "sessionNumber": number,
                "title": string,
                "tasks": [
                  {
                    "id": string,
                    "title": string,
                    "description": string,
                    "type": string,
                    "orderIndex": number,
                    "hasMoreInfo": boolean,
                    "videoUrl": string,
                    "fullExplanation": string
                  }
                ]
              }
            ]
          }
        ]
      },
      "prescription": {
        "status": "PRESCRIBED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED",
        "plannedStartDate": string,
        "plannedEndDate": string,
        "actualStartDate": string | null,
        "actualEndDate": string | null,
        "adherenceRate": number,
        "currentDay": number,
        "pausedAt": string | null,
        "pauseReason": string | null,
        "abandonedAt": string | null,
        "abandonReason": string | null
      }
    }
  ]
}
```

### Detalhes do Protocolo
```typescript
GET /api/protocols/{id}
Authorization: Bearer {token}

Response:
{
  "protocol": {
    // Mesmos campos do protocolo acima
    // + campos adicionais
    "modalTitle": string,
    "modalVideoUrl": string,
    "modalDescription": string,
    "modalButtonText": string,
    "modalButtonUrl": string,
    "showDoctorInfo": boolean,
    "availableFrom": string | null,
    "availableUntil": string | null
  }
}
```

## 📚 Cursos do Protocolo

### Listar Cursos
```typescript
GET /api/protocols/{id}/courses
Authorization: Bearer {token}

Response:
{
  "courses": [
    {
      "id": string,
      "courseId": string,
      "orderIndex": number,
      "isRequired": boolean,
      "course": {
        "id": string,
        "name": string,
        "description": string,
        "coverImage": string,
        "modules": [
          {
            "id": string,
            "title": string,
            "description": string,
            "orderIndex": number,
            "lessons": [
              {
                "id": string,
                "title": string,
                "description": string,
                "videoUrl": string,
                "duration": number,
                "orderIndex": number
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## 🏥 Relatório de Sintomas

### Criar Relatório
```typescript
POST /api/mobile/symptom-reports
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "protocolId": string,
  "dayNumber": number,
  "symptoms": string,
  "severity": number (1-10),
  "reportTime": string | null,  // ISO date string
  "isNow": boolean,             // se true, usa hora atual
  "title": string | null,
  "description": string | null
}

Response:
{
  "id": string,
  "userId": string,
  "protocolId": string,
  "dayNumber": number,
  "symptoms": string,
  "severity": number,
  "reportTime": string,
  "status": "PENDING" | "REVIEWED" | "REQUIRES_ATTENTION" | "RESOLVED",
  "createdAt": string
}
```

### Listar Relatórios
```typescript
GET /api/mobile/symptom-reports
Authorization: Bearer {token}
Query Params:
  - protocolId: string (opcional)
  - limit: number (default: 20)
  - offset: number (default: 0)

Response:
{
  "reports": [
    {
      // Mesmos campos da resposta do POST
      "doctorNotes": string | null,
      "reviewedAt": string | null,
      "reviewedBy": {
        "id": string,
        "name": string
      }
    }
  ],
  "total": number,
  "hasMore": boolean
}
```

### Upload de Imagens para Relatório
```typescript
POST /api/mobile/symptom-reports/{id}/attachments
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
FormData:
  - file: File (imagem)

Suporte:
  - Formatos: JPEG, JPG, PNG, GIF, WebP, HEIC/HEIF
  - Tamanho máximo: 20MB
  - Processamento automático:
    * Redimensionamento: max 2048px largura
    * Compressão: 85% qualidade
    * Conversão: HEIC/HEIF → JPEG

Response (201):
{
  "success": true,
  "attachment": {
    "id": string,
    "fileName": string,
    "originalName": string,
    "fileSize": number,
    "mimeType": string,
    "fileUrl": string,
    "uploadedAt": string
  }
}

Response (400):
{
  "error": "No file uploaded" | "File type not allowed" | "File too large"
}

Response (404):
{
  "error": "Symptom report not found or access denied"
}
```

### Listar Anexos do Relatório
```typescript
GET /api/mobile/symptom-reports/{id}/attachments
Authorization: Bearer {token}

Response (200):
[
  {
    "id": string,
    "fileName": string,
    "originalName": string,
    "fileSize": number,
    "mimeType": string,
    "fileUrl": string,
    "uploadedAt": string
  }
]

Response (404):
{
  "error": "Symptom report not found or access denied"
}
```

## 💊 Prescrições

### Atualizar Status da Prescrição
```typescript
PUT /api/protocols/{id}/prescriptions/{prescriptionId}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "status": "ACTIVE" | "PAUSED" | "ABANDONED",
  "reason": string | null  // Obrigatório para PAUSED e ABANDONED
}

Response:
{
  "id": string,
  "status": string,
  "updatedAt": string,
  // ... outros campos da prescrição
}
```

### Iniciar Protocolo Prescrito
```typescript
POST /api/protocols/{id}/prescriptions/{prescriptionId}/start
Authorization: Bearer {token}

Response:
{
  "id": string,
  "status": "ACTIVE",
  "actualStartDate": string,
  "currentDay": number,
  "plannedEndDate": string
}
```

### Verificar Acesso ao Protocolo
```typescript
GET /api/protocols/{id}/access
Authorization: Bearer {token}

Response:
{
  "hasAccess": boolean,
  "prescription": {
    "id": string,
    "status": "PRESCRIBED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED",
    "plannedStartDate": string,
    "actualStartDate": string | null,
    "plannedEndDate": string,
    "currentDay": number,
    "adherenceRate": number | null
  } | null
}
```

### Progresso da Prescrição
```typescript
GET /api/protocols/{id}/prescriptions/{prescriptionId}/progress
Authorization: Bearer {token}

Response:
{
  "adherenceRate": number,
  "currentDay": number,
  "completedTasks": number,
  "totalTasks": number,
  "lastActivity": string,
  "streakDays": number
}
```

## 🔄 Ciclo de Vida do Protocolo

### Verificar Acesso ao Protocolo
```typescript
GET /api/protocols/{id}/access
Authorization: Bearer {token}

Response:
{
  "hasAccess": boolean,
  "prescription": {
    "id": string,
    "status": "PRESCRIBED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED",
    "actualStartDate": string | null,
    "currentDay": number,
    "plannedEndDate": string
  } | null
}
```

### Iniciar Protocolo
```typescript
POST /api/protocols/{id}/prescriptions/{prescriptionId}/start
Authorization: Bearer {token}

Response:
{
  "id": string,
  "status": "ACTIVE",
  "actualStartDate": string,
  "currentDay": number,
  "plannedEndDate": string,
  "adherenceRate": number | null
}
```

### Buscar Progresso do Protocolo
```typescript
GET /api/protocols/{id}/prescriptions/{prescriptionId}/progress
Authorization: Bearer {token}

Response:
{
  "adherenceRate": number,      // 0-100%
  "currentDay": number,         // Dia atual
  "completedTasks": number,     // Total de tarefas completadas
  "totalTasks": number,         // Total de tarefas
  "lastActivity": string,       // Data da última atividade
  "streakDays": number,        // Dias consecutivos
  "status": "PRESCRIBED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED"
}
```

### Pausar/Abandonar Protocolo
```typescript
PUT /api/protocols/{id}/prescriptions/{prescriptionId}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "status": "PAUSED" | "ABANDONED",
  "reason": string  // Obrigatório para PAUSED e ABANDONED
}

Response:
{
  "id": string,
  "status": string,
  "pausedAt": string | null,    // Se PAUSED
  "pauseReason": string | null, // Se PAUSED
  "abandonedAt": string | null, // Se ABANDONED
  "abandonReason": string | null // Se ABANDONED
}
```

## 👥 Indicações

### Criar Indicação
```typescript
POST /api/protocols/{id}/referrals
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": string,
  "email": string,
  "phone": string | null,
  "notes": string | null
}

Response:
{
  "id": string,
  "status": "PENDING",
  "createdAt": string
}
```

## 📝 Funcionalidades Adicionais

### Check-in Diário
```typescript
// Buscar perguntas do dia
GET /api/mobile/daily-checkin
Query Params:
  - protocolId: string
  - date: string (YYYY-MM-DD)

Response:
{
  "questions": [
    {
      "id": string,
      "question": string,
      "type": "TEXT" | "SCALE" | "BOOLEAN",
      "order": number
    }
  ],
  "hasAnswered": boolean,
  "responses": Record<string, string>
}

// Enviar respostas
POST /api/mobile/daily-checkin
Request:
{
  "protocolId": string,
  "responses": [
    {
      "questionId": string,
      "answer": string
    }
  ]
}
```

## 📸 Upload de Imagens no React Native

### Exemplo de Implementação

```javascript
// components/SymptomReportForm.js
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SymptomReportForm({ protocolId, dayNumber }) {
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Selecionar imagens da galeria ou câmera
  const handleSelectImage = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 5, // Máximo de 5 imagens por vez
    };

    try {
      const result = await ImagePicker.launchImageLibrary(options);
      if (result.assets) {
        setImages(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Enviar relatório com imagens
  const handleSubmit = async () => {
    try {
      setIsUploading(true);

      // 1. Criar o relatório primeiro
      const reportResponse = await fetch('https://api.example.com/api/mobile/symptom-reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolId,
          dayNumber,
          symptoms,
          severity,
          isNow: true
        })
      });

      const { report } = await reportResponse.json();

      // 2. Upload das imagens
      if (images.length > 0) {
        await Promise.all(images.map(async (image) => {
          const formData = new FormData();
          formData.append('file', {
            uri: image.uri,
            type: image.type,
            name: image.fileName || 'image.jpg'
          });

          await fetch(`https://api.example.com/api/mobile/symptom-reports/${report.id}/attachments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
              'Content-Type': 'multipart/form-data',
            },
            body: formData
          });
        }));
      }

      // Limpar form e mostrar sucesso
      setImages([]);
      Alert.alert('Success', 'Report submitted with images');

    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Outros campos do formulário */}

      {/* Preview de Imagens */}
      {images.length > 0 && (
        <ScrollView horizontal style={styles.imagePreview}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image
                source={{ uri: image.uri }}
                style={styles.previewImage}
              />
              <TouchableOpacity
                onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                style={styles.removeButton}
              >
                <Text>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Botão de Upload */}
      <TouchableOpacity
        onPress={handleSelectImage}
        style={styles.uploadButton}
        disabled={isUploading}
      >
        <Text>Add Images</Text>
      </TouchableOpacity>

      {/* Botão de Envio */}
      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={isUploading}
      >
        <Text>{isUploading ? 'Uploading...' : 'Submit Report'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  imagePreview: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  imageContainer: {
    marginRight: 8,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
```

### 📝 Considerações Importantes

1. **Permissões**
```javascript
// Adicione ao AndroidManifest.xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

// Solicite permissões no iOS (Info.plist)
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to take photos for symptom reports</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library to attach images to symptom reports</string>
```

2. **Otimização**
- O servidor processa automaticamente as imagens:
  - Redimensiona para max 2048px
  - Comprime com qualidade 85%
  - Converte HEIC para JPEG
- Considere compressão local antes do upload:
```javascript
import ImageResizer from 'react-native-image-resizer';

const optimizeImage = async (imageUri) => {
  const result = await ImageResizer.createResizedImage(
    imageUri,
    2048, // maxWidth
    2048, // maxHeight
    'JPEG',
    85, // quality
    0, // rotation
    null // outputPath (null = temp directory)
  );
  return result;
};
```

3. **Tratamento de Erros**
- Implemente retry para falhas de upload
- Mantenha estado local até confirmação do servidor
- Permita retomar uploads interrompidos
```javascript
const uploadWithRetry = async (formData, reportId, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await uploadImage(formData, reportId);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

4. **UI/UX**
- Mostre progresso de upload
- Permita cancelar uploads em andamento
- Mantenha preview de imagens
- Limite quantidade/tamanho de imagens
```javascript
const MAX_IMAGES = 5;
const MAX_SIZE_MB = 20;

const validateImage = (file) => {
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image must be smaller than ${MAX_SIZE_MB}MB`);
  }
  if (images.length >= MAX_IMAGES) {
    throw new Error(`Maximum ${MAX_IMAGES} images allowed`);
  }
};
```

5. **Cache e Offline**
- Armazene imagens localmente até upload completo
- Use fila de upload para modo offline
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_UPLOADS_KEY = 'pendingUploads';

const savePendingUpload = async (reportId, images) => {
  const pending = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
  const pendingUploads = pending ? JSON.parse(pending) : {};
  pendingUploads[reportId] = images;
  await AsyncStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(pendingUploads));
};

const processPendingUploads = async () => {
  const pending = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
  if (!pending) return;

  const pendingUploads = JSON.parse(pending);
  for (const [reportId, images] of Object.entries(pendingUploads)) {
    try {
      await uploadImages(images, reportId);
      delete pendingUploads[reportId];
    } catch (error) {
      console.error(`Failed to upload images for report ${reportId}:`, error);
    }
  }
  
  await AsyncStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(pendingUploads));
};
```

## 🔄 Sincronização

Para garantir uma boa experiência offline, recomendamos:

1. **Cache Local**
   - Armazenar dados do protocolo
   - Manter progresso offline
   - Sincronizar quando online

2. **Queue de Ações**
   - Armazenar ações offline
   - Sincronizar em ordem
   - Resolver conflitos

3. **Estado de Conexão**
   - Monitorar conectividade
   - Indicar status ao usuário
   - Tentar reconexão automática

## 📱 Componentes Sugeridos

1. **ProtocolCard**
   ```typescript
   interface ProtocolCardProps {
     protocol: Protocol;
     onPress: () => void;
     showProgress?: boolean;
   }
   ```

2. **DailyProgress**
   ```typescript
   interface DailyProgressProps {
     day: number;
     tasks: Task[];
     onTaskComplete: (taskId: string) => void;
   }
   ```

3. **SymptomReport**
   ```typescript
   interface SymptomReportProps {
     onSubmit: (data: SymptomData) => void;
     isLoading?: boolean;
   }
   ```

4. **CourseViewer**
   ```typescript
   interface CourseViewerProps {
     course: Course;
     onLessonComplete: (lessonId: string) => void;
   }
   ```

## 🎨 Tema e Estilo

Recomendamos usar um tema consistente:

```typescript
const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FFCC00',
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    border: '#C6C6C8'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  typography: {
    h1: {
      fontSize: 34,
      fontWeight: 'bold'
    },
    h2: {
      fontSize: 28,
      fontWeight: '600'
    },
    body: {
      fontSize: 17
    },
    caption: {
      fontSize: 13
    }
  }
};
```

## 🔐 Segurança

1. **Armazenamento Seguro**
   - Usar EncryptedStorage para tokens
   - Não armazenar senhas
   - Limpar dados sensíveis no logout

2. **Validação**
   - Validar inputs
   - Sanitizar dados
   - Tratar erros graciosamente

3. **Autenticação**
   - Renovar token automaticamente
   - Verificar validade do token
   - Forçar logout quando necessário 