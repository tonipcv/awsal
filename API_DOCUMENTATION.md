# Habit Tracker API Documentation

This document provides an overview of all API endpoints available in the Habit Tracker application.

## Authentication

The application uses NextAuth for authentication. Server-side authentication is handled by `getServerSession(authOptions)`. The auth routes are available at `/api/auth/...` endpoints.

### NextAuth Endpoints

- **Endpoint**: `/api/auth/signin` and `/api/auth/signout`
- **Method**: GET/POST
- **Description**: Standard NextAuth signin and signout endpoints
- **Providers**: Google OAuth, Credentials (Email/Password)

### User Registration

- **Endpoint**: `/api/auth/register`
- **Method**: POST
- **Description**: Creates a new user account
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: Success message with userId
  ```json
  {
    "message": "Usuário criado com sucesso. Verifique seu email para confirmar o cadastro.",
    "userId": "string"
  }
  ```

### Email Verification

- **Endpoint**: `/api/auth/verify`
- **Method**: POST
- **Description**: Verifies user email with verification code
- **Request Body**:
  ```json
  {
    "email": "string",
    "code": "string"
  }
  ```
- **Response**: Success message when email is verified

### Forgot Password

- **Endpoint**: `/api/auth/forgot-password`
- **Method**: POST
- **Description**: Sends a password reset email to the specified address
- **Request Body**:
  ```json
  {
    "email": "string"
  }
  ```
- **Response**: Success message

### Reset Password

- **Endpoint**: `/api/auth/reset-password`
- **Method**: POST
- **Description**: Resets the user's password with a valid token
- **Request Body**:
  ```json
  {
    "token": "string",
    "password": "string"
  }
  ```
- **Response**: Success message when password is reset

### React Native Integration

For React Native apps, you can use these authentication endpoints. Here's how to integrate with your React Native app:

1. **Login Flow**:
   - Send POST request to `/api/auth/[...nextauth]` with credentials
   - Store returned session token
   - Include session token in subsequent API requests

2. **Registration Flow**:
   - Register: POST to `/api/auth/register`
   - Verify: POST to `/api/auth/verify` with the code sent to email
   - Login: Use the credentials to log in

3. **Password Reset Flow**:
   - Request reset: POST to `/api/auth/forgot-password`
   - Process reset: POST to `/api/auth/reset-password`

4. **Headers for Authentication**:
   ```
   Authorization: Bearer ${sessionToken}
   ```

## Task Management

### Get All Tasks
- **Endpoint**: `/api/tasks`
- **Method**: GET
- **Description**: Retrieves all tasks for the authenticated user
- **Response**: An array of task objects
  ```json
  [
    {
      "id": "string",
      "userId": "string",
      "title": "string",
      "dueDate": "string | Date",
      "isCompleted": "boolean",
      "importance": "number",
      "createdAt": "string | Date",
      "updatedAt": "string | Date"
    }
  ]
  ```

### Create Task
- **Endpoint**: `/api/tasks`
- **Method**: POST
- **Description**: Creates a new task
- **Request Body**:
  ```json
  {
    "title": "string",
    "dueDate": "string (YYYY-MM-DD)",
    "importance": "number (1-4)"
  }
  ```
- **Response**: The created task object

### Update Task
- **Endpoint**: `/api/tasks/[taskId]`
- **Method**: PUT
- **Description**: Updates an existing task
- **Parameters**: `taskId` - ID of the task to update
- **Request Body**:
  ```json
  {
    "title": "string",
    "dueDate": "string (YYYY-MM-DD)",
    "importance": "number (1-4)"
  }
  ```
- **Response**: The updated task object

### Delete Task
- **Endpoint**: `/api/tasks/[taskId]`
- **Method**: DELETE
- **Description**: Deletes a task
- **Parameters**: `taskId` - ID of the task to delete
- **Response**: 204 No Content

### Toggle Task Completion
- **Endpoint**: `/api/tasks/[taskId]/toggle`
- **Method**: PUT
- **Description**: Toggles the completion status of a task
- **Parameters**: `taskId` - ID of the task to toggle
- **Response**: The updated task object

## Pomodoro Timer

### Get Pomodoro Stars
- **Endpoint**: `/api/pomodoro-stars`
- **Method**: GET
- **Description**: Retrieves the user's pomodoro stars grouped by date
- **Response**: An object with dates as keys and star counts as values
  ```json
  {
    "2023-06-01": 3,
    "2023-06-02": 2
  }
  ```

### Add Pomodoro Star
- **Endpoint**: `/api/pomodoro-stars`
- **Method**: POST
- **Description**: Adds a new pomodoro star for the current day
- **Request Body**:
  ```json
  {
    "date": "string (YYYY-MM-DD)"
  }
  ```
- **Response**: Object containing the created star and total stars for the day
  ```json
  {
    "star": {
      "id": "string",
      "userId": "string",
      "date": "string",
      "createdAt": "string"
    },
    "totalStars": "number"
  }
  ```

## Habits

### Get All Habits
- **Endpoint**: `/api/habits`
- **Method**: GET
- **Description**: Retrieves all habits for the authenticated user

### Create Habit
- **Endpoint**: `/api/habits`
- **Method**: POST
- **Description**: Creates a new habit

### Update Habit
- **Endpoint**: `/api/habits/[id]`
- **Method**: PUT
- **Description**: Updates an existing habit
- **Parameters**: `id` - ID of the habit to update

### Delete Habit
- **Endpoint**: `/api/habits/[id]`
- **Method**: DELETE
- **Description**: Deletes a habit
- **Parameters**: `id` - ID of the habit to delete

### Track Habit Progress
- **Endpoint**: `/api/habits/progress`
- **Method**: POST/GET
- **Description**: Records or retrieves habit progress

## Circles

### Get All Circles
- **Endpoint**: `/api/circles`
- **Method**: GET
- **Description**: Retrieves all circles for the authenticated user

### Create Circle
- **Endpoint**: `/api/circles`
- **Method**: POST
- **Description**: Creates a new circle

### Manage Circle
- **Endpoint**: `/api/circles/[id]`
- **Method**: GET/PUT/DELETE
- **Description**: Get, update, or delete a specific circle
- **Parameters**: `id` - ID of the circle to manage

## Thoughts

### Get All Thoughts
- **Endpoint**: `/api/thoughts`
- **Method**: GET
- **Description**: Retrieves all thoughts for the authenticated user

### Create Thought
- **Endpoint**: `/api/thoughts`
- **Method**: POST
- **Description**: Creates a new thought

### Manage Thought
- **Endpoint**: `/api/thoughts/[id]`
- **Method**: GET/PUT/DELETE
- **Description**: Get, update, or delete a specific thought
- **Parameters**: `id` - ID of the thought to manage

## Other API Routes

The application also includes the following API routes:

- `/api/profile` - User profile management
- `/api/upload-image` - Image upload functionality
- `/api/ai` - AI-related features
- `/api/checkpoints` - Checkpoint tracking
- `/api/analyze-food` - Food analysis functionality
- `/api/cycles` - Cycle tracking

## Error Handling

All API routes follow a consistent error handling pattern:

- 400 Bad Request - Invalid input data
- 401 Unauthorized - Authentication required
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server-side error

Most routes return a JSON response with appropriate HTTP status codes.

## Data Models

### Task
- `id`: string
- `userId`: string
- `title`: string
- `dueDate`: Date
- `isCompleted`: boolean
- `importance`: number (1-4)
- `createdAt`: Date
- `updatedAt`: Date

### PomodoroStar
- `id`: string
- `userId`: string
- `date`: Date
- `createdAt`: Date

## Importance Levels for Tasks

Tasks in the Eisenhower Matrix are organized by importance:
1. Urgent and Important
2. Important not Urgent
3. Urgent not Important
4. Neither Urgent nor Important

## Endpoints Específicos para React Native

Para facilitar a integração com aplicativos React Native, foram criados endpoints específicos que utilizam autenticação via token JWT.

### Autenticação Mobile

#### Login Mobile
- **Endpoint**: `/api/auth/mobile/login`
- **Method**: POST
- **Description**: Autentica um usuário e retorna um token JWT
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: Dados do usuário e token JWT
  ```json
  {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "image": "string"
    },
    "token": "string"
  }
  ```

#### Registro Mobile
- **Endpoint**: `/api/auth/mobile/register`
- **Method**: POST
- **Description**: Registra um novo usuário e retorna um token JWT
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: Mensagem de sucesso, ID do usuário e token JWT
  ```json
  {
    "message": "Usuário criado com sucesso. Verifique seu email para confirmar o cadastro.",
    "userId": "string",
    "token": "string",
    "verificationCode": "string" // Somente para testes
  }
  ```

### Tarefas Mobile

#### Obter Todas as Tarefas (Mobile)
- **Endpoint**: `/api/mobile/tasks`
- **Method**: GET
- **Headers**: 
  ```
  Authorization: Bearer ${token}
  ```
- **Response**: Lista de objetos de tarefa

#### Criar Tarefa (Mobile)
- **Endpoint**: `/api/mobile/tasks`
- **Method**: POST
- **Headers**: 
  ```
  Authorization: Bearer ${token}
  ```
- **Request Body**:
  ```json
  {
    "title": "string",
    "dueDate": "string (YYYY-MM-DD)",
    "importance": "number (1-4)"
  }
  ```
- **Response**: Objeto da tarefa criada

#### Obter Tarefa Específica (Mobile)
- **Endpoint**: `/api/mobile/tasks/[taskId]`
- **Method**: GET
- **Headers**: 
  ```
  Authorization: Bearer ${token}
  ```
- **Response**: Objeto da tarefa

#### Atualizar Tarefa (Mobile)
- **Endpoint**: `/api/mobile/tasks/[taskId]`
- **Method**: PUT
- **Headers**: 
  ```
  Authorization: Bearer ${token}
  ```
- **Request Body**:
  ```json
  {
    "title": "string",
    "dueDate": "string (YYYY-MM-DD)",
    "importance": "number (1-4)"
  }
  ```
- **Response**: Objeto da tarefa atualizada

#### Excluir Tarefa (Mobile)
- **Endpoint**: `/api/mobile/tasks/[taskId]`
- **Method**: DELETE
- **Headers**: 
  ```
  Authorization: Bearer ${token}
  ```
- **Response**: 204 No Content

#### Alternar Status de Conclusão (Mobile)
- **Endpoint**: `/api/mobile/tasks/[taskId]/toggle`
- **Method**: PUT
- **Headers**: 
  ```
  Authorization: Bearer ${token}
  ```
- **Response**: Objeto da tarefa atualizada

## Implementação no React Native

Para utilizar esses endpoints no React Native, siga as orientações abaixo:

### Setup Inicial

1. Instale as dependências necessárias:
```bash
npm install @react-native-async-storage/async-storage axios
```

2. Crie um arquivo para configuração do cliente API:

```javascript
// api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://seu-backend.com'; // Substitua pelo URL do seu backend

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Autenticação

```javascript
// auth.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email, password) => {
  try {
    const response = await api.post('/api/auth/mobile/login', {
      email,
      password
    });
    
    const { token, user } = response.data;
    
    // Armazenar token e dados do usuário
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    console.error('Erro no login:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Falha na autenticação'
    };
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post('/api/auth/mobile/register', {
      name,
      email,
      password
    });
    
    const { token, userId, verificationCode } = response.data;
    
    // Armazenar token e ID do usuário
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('userId', userId);
    
    return { 
      success: true, 
      userId,
      verificationCode // Somente para testes
    };
  } catch (error) {
    console.error('Erro no registro:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Falha no registro'
    };
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { success: false, error: error.message };
  }
};
```

### Gerenciamento de Tarefas

```javascript
// tasks.js
import api from './api';

export const getTasks = async () => {
  try {
    const response = await api.get('/api/mobile/tasks');
    return { success: true, tasks: response.data };
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Falha ao buscar tarefas'
    };
  }
};

export const createTask = async (title, dueDate, importance) => {
  try {
    const response = await api.post('/api/mobile/tasks', {
      title,
      dueDate,
      importance
    });
    return { success: true, task: response.data };
  } catch (error) {
    console.error('Erro ao criar tarefa:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Falha ao criar tarefa'
    };
  }
};

export const updateTask = async (taskId, title, dueDate, importance) => {
  try {
    const response = await api.put(`/api/mobile/tasks/${taskId}`, {
      title,
      dueDate,
      importance
    });
    return { success: true, task: response.data };
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Falha ao atualizar tarefa'
    };
  }
};

export const deleteTask = async (taskId) => {
  try {
    await api.delete(`/api/mobile/tasks/${taskId}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Falha ao excluir tarefa'
    };
  }
};

export const toggleTask = async (taskId) => {
  try {
    const response = await api.put(`/api/mobile/tasks/${taskId}/toggle`);
    return { success: true, task: response.data };
  } catch (error) {
    console.error('Erro ao alternar tarefa:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Falha ao alternar tarefa'
    };
  }
};
``` 