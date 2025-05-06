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

## Mobile API Endpoints

A API fornece endpoints específicos para clientes mobile, que usam autenticação JWT para maior segurança e melhor experiência em dispositivos móveis.

### Autenticação Mobile

A autenticação mobile usa JWT (JSON Web Tokens) para gerenciar sessões.

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
- **Response**: Usuário e token JWT
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
- **Response**: Usuário e token JWT
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

### Como usar a autenticação JWT

Para todas as requisições aos endpoints mobile, inclua o token JWT no cabeçalho `Authorization`:

```
Authorization: Bearer ${token}
```

Por exemplo, em Axios:

```javascript
const api = axios.create({
  baseURL: 'https://seu-app.com/api',
});

// Configure o interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Pomodoro Stars (Mobile)

#### Listar Estrelas Pomodoro
- **Endpoint**: `/api/mobile/pomodoro-stars`
- **Method**: GET
- **Description**: Retorna as estrelas do usuário agrupadas por data
- **Authentication**: Required (JWT)
- **Response**: Objeto com datas e contagem de estrelas
  ```json
  {
    "2023-06-01": 3,
    "2023-06-02": 2
  }
  ```

#### Adicionar Estrela Pomodoro
- **Endpoint**: `/api/mobile/pomodoro-stars`
- **Method**: POST
- **Description**: Adiciona uma nova estrela para uma data específica
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "date": "string (YYYY-MM-DD)"
  }
  ```
- **Response**: Detalhes da estrela criada e total do dia
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

### Hábitos (Mobile)

#### Listar Hábitos
- **Endpoint**: `/api/mobile/habits`
- **Method**: GET
- **Description**: Retorna todos os hábitos do usuário com progresso
- **Authentication**: Required (JWT)
- **Query Parameters**:
  - `month`: opcional, filtra por mês (YYYY-MM-DD)
- **Response**: Lista de hábitos com progresso
  ```json
  [
    {
      "id": "number",
      "title": "string",
      "category": "string",
      "progress": [
        {
          "date": "string (YYYY-MM-DD)",
          "isChecked": "boolean"
        }
      ]
    }
  ]
  ```

#### Criar Hábito
- **Endpoint**: `/api/mobile/habits`
- **Method**: POST
- **Description**: Cria um novo hábito
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "title": "string",
    "category": "string"
  }
  ```
- **Response**: O hábito criado
  ```json
  {
    "id": "number",
    "title": "string",
    "category": "string",
    "progress": []
  }
  ```

#### Gerenciar Hábito
- **Endpoint**: `/api/mobile/habits/[id]`
- **Method**: GET/PUT/DELETE
- **Description**: Obtém, atualiza ou deleta um hábito
- **Authentication**: Required (JWT)
- **Parameters**: `id` - ID numérico do hábito

#### Registrar Progresso do Hábito
- **Endpoint**: `/api/mobile/habits/progress`
- **Method**: POST
- **Description**: Registra ou alterna o progresso de um hábito
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "habitId": "number",
    "date": "string (YYYY-MM-DD)"
  }
  ```

#### Registrar Progresso de um Hábito Específico (URI Alternativa)
- **Endpoint**: `/api/mobile/habits/[id]/progress`
- **Method**: POST
- **Description**: Registra ou alterna o progresso de um hábito específico (mesmo endpoint, URI alternativa)
- **Authentication**: Required (JWT)
- **Parameters**: `id` - ID numérico do hábito na URL
- **Request Body**:
  ```json
  {
    "date": "string (YYYY-MM-DD)"
  }
  ```
- **Note**: Este endpoint é uma alternativa ao anterior e usa a mesma lógica, só muda a forma de enviar o ID do hábito.

### Círculos (Mobile)

#### Listar Círculos
- **Endpoint**: `/api/mobile/circles`
- **Method**: GET
- **Description**: Retorna todos os círculos do usuário
- **Authentication**: Required (JWT)
- **Response**: Lista de círculos
  ```json
  [
    {
      "id": "number",
      "title": "string",
      "maxClicks": "number",
      "clicks": "number",
      "userId": "string",
      "createdAt": "string"
    }
  ]
  ```

#### Criar Círculo
- **Endpoint**: `/api/mobile/circles`
- **Method**: POST
- **Description**: Cria um novo círculo
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "title": "string",
    "maxClicks": "number"
  }
  ```

#### Gerenciar Círculo
- **Endpoint**: `/api/mobile/circles/[id]`
- **Method**: GET/PUT/DELETE
- **Description**: Obtém, atualiza ou deleta um círculo
- **Authentication**: Required (JWT)
- **Parameters**: `id` - ID numérico do círculo

### Pensamentos (Mobile)

#### Listar Pensamentos
- **Endpoint**: `/api/mobile/thoughts`
- **Method**: GET
- **Description**: Retorna todos os pensamentos do usuário
- **Authentication**: Required (JWT)
- **Response**: Lista de pensamentos ordenados por data de criação

#### Criar Pensamento
- **Endpoint**: `/api/mobile/thoughts`
- **Method**: POST
- **Description**: Registra um novo pensamento
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "content": "string"
  }
  ```

#### Gerenciar Pensamento
- **Endpoint**: `/api/mobile/thoughts/[id]`
- **Method**: GET/PUT/DELETE
- **Description**: Obtém, atualiza ou deleta um pensamento
- **Authentication**: Required (JWT)
- **Parameters**: `id` - ID do pensamento

### Checkpoints (Mobile)

#### Listar Checkpoints
- **Endpoint**: `/api/mobile/checkpoints`
- **Method**: GET
- **Description**: Retorna todos os checkpoints do usuário
- **Authentication**: Required (JWT)
- **Response**: Lista de checkpoints ordenados por data

#### Registrar/Atualizar Checkpoint
- **Endpoint**: `/api/mobile/checkpoints`
- **Method**: POST
- **Description**: Cria ou atualiza um checkpoint para uma data específica
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "date": "string (YYYY-MM-DD)",
    "emotion": "string (opcional)",
    "isCompleted": "boolean (opcional)"
  }
  ```

### Ciclos (Mobile)

#### Listar Ciclos
- **Endpoint**: `/api/mobile/cycles`
- **Method**: GET
- **Description**: Retorna todos os ciclos do usuário com semanas, metas, resultados e tarefas
- **Authentication**: Required (JWT)
- **Response**: Lista completa de ciclos com todos os dados relacionados

#### Criar Ciclo
- **Endpoint**: `/api/mobile/cycles`
- **Method**: POST
- **Description**: Cria um novo ciclo
- **Authentication**: Required (JWT)
- **Request Body**:
  ```json
  {
    "startDate": "string (YYYY-MM-DD)",
    "endDate": "string (YYYY-MM-DD)",
    "vision": "string (opcional)"
  }
  ```

#### Gerenciar Ciclo
- **Endpoint**: `/api/mobile/cycles/[id]`
- **Method**: GET/PUT/DELETE
- **Description**: Obtém, atualiza ou deleta um ciclo
- **Authentication**: Required (JWT)
- **Parameters**: `id` - ID numérico do ciclo 