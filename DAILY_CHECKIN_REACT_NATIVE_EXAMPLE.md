# 📱 Daily Check-in - Exemplo React Native

Este documento mostra como implementar o sistema de Daily Check-in no React Native usando o endpoint `/api/mobile/daily-checkin`.

## 🔧 **Configuração da API**

```javascript
// api/dailyCheckin.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000'; // ou sua URL de produção

class DailyCheckinAPI {
  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('userToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Buscar perguntas e status do check-in
  async getCheckinData(protocolId, date = null) {
    try {
      const headers = await this.getAuthHeaders();
      const dateParam = date ? `&date=${date}` : '';
      const url = `${API_BASE_URL}/api/mobile/daily-checkin?protocolId=${protocolId}${dateParam}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching check-in data:', error);
      throw error;
    }
  }

  // Submeter respostas do check-in
  async submitCheckin(protocolId, responses) {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/mobile/daily-checkin`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          protocolId,
          responses
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting check-in:', error);
      throw error;
    }
  }
}

export default new DailyCheckinAPI();
```

## 🎨 **Componente de Check-in**

```javascript
// components/DailyCheckinScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import DailyCheckinAPI from '../api/dailyCheckin';

const DailyCheckinScreen = ({ route, navigation }) => {
  const { protocolId } = route.params;
  
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [hasCheckinToday, setHasCheckinToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    loadCheckinData();
  }, [protocolId]);

  const loadCheckinData = async () => {
    try {
      setIsLoading(true);
      const data = await DailyCheckinAPI.getCheckinData(protocolId);
      
      setQuestions(data.questions || []);
      setHasCheckinToday(data.hasCheckinToday);
      setResponses(data.existingResponses || {});
    } catch (error) {
      Alert.alert('Error', 'Failed to load check-in questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseChange = (questionId, answer) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const canProceedToNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return false;
    
    const hasResponse = responses[currentQuestion.id];
    return !currentQuestion.isRequired || (hasResponse && hasResponse.trim() !== '');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validar respostas obrigatórias
      const requiredQuestions = questions.filter(q => q.isRequired);
      const missingResponses = requiredQuestions.filter(q => !responses[q.id]);
      
      if (missingResponses.length > 0) {
        Alert.alert('Error', 'Please answer all required questions');
        return;
      }

      // Preparar dados para envio
      const submitData = Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const result = await DailyCheckinAPI.submitCheckin(protocolId, submitData);
      
      Alert.alert(
        'Success',
        result.message,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const response = responses[question.id] || '';

    switch (question.type) {
      case 'TEXT':
        return (
          <TextInput
            style={styles.textInput}
            value={response}
            onChangeText={(text) => handleResponseChange(question.id, text)}
            placeholder="Type your answer..."
            multiline
          />
        );

      case 'SCALE':
        return (
          <View style={styles.scaleContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.scaleButton,
                  response === value.toString() && styles.scaleButtonSelected
                ]}
                onPress={() => handleResponseChange(question.id, value.toString())}
              >
                <Text style={[
                  styles.scaleButtonText,
                  response === value.toString() && styles.scaleButtonTextSelected
                ]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'YES_NO':
        return (
          <View style={styles.yesNoContainer}>
            {['Yes', 'No'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.yesNoButton,
                  response === option && styles.yesNoButtonSelected
                ]}
                onPress={() => handleResponseChange(question.id, option)}
              >
                <Text style={[
                  styles.yesNoButtonText,
                  response === option && styles.yesNoButtonTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'MULTIPLE_CHOICE':
        const options = question.options ? question.options.split(',') : [];
        return (
          <View style={styles.multipleChoiceContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.multipleChoiceButton,
                  response === option.trim() && styles.multipleChoiceButtonSelected
                ]}
                onPress={() => handleResponseChange(question.id, option.trim())}
              >
                <Text style={[
                  styles.multipleChoiceButtonText,
                  response === option.trim() && styles.multipleChoiceButtonTextSelected
                ]}>
                  {option.trim()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CED1" />
        <Text style={styles.loadingText}>Loading check-in questions...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No check-in questions available</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {hasCheckinToday ? 'Edit Check-in' : 'Daily Check-in'}
        </Text>
        {questions.length > 1 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1} of {questions.length}
            </Text>
          </View>
        )}
      </View>

      {/* Question */}
      <ScrollView style={styles.content}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {currentQuestion.question}
            {currentQuestion.isRequired && <Text style={styles.required}> *</Text>}
          </Text>
          
          {renderQuestion(currentQuestion)}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === 0 && styles.navButtonDisabled
          ]}
          onPress={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={[
            styles.navButtonText,
            currentQuestionIndex === 0 && styles.navButtonTextDisabled
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!canProceedToNext() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!canProceedToNext() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.submitButtonText}>
                {hasCheckinToday ? 'Update Check-in' : 'Submit Check-in'}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceedToNext() && styles.nextButtonDisabled
            ]}
            onPress={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={!canProceedToNext()}
          >
            <Text style={[
              styles.nextButtonText,
              !canProceedToNext() && styles.nextButtonTextDisabled
            ]}>
              Next
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#00CED1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00CED1',
    borderRadius: 2,
  },
  progressText: {
    color: '#999',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    lineHeight: 24,
  },
  required: {
    color: '#ff4444',
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
  },
  scaleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scaleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  scaleButtonSelected: {
    backgroundColor: '#00CED1',
    borderColor: '#00CED1',
  },
  scaleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scaleButtonTextSelected: {
    color: '#000',
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  yesNoButtonSelected: {
    backgroundColor: '#00CED1',
    borderColor: '#00CED1',
  },
  yesNoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  yesNoButtonTextSelected: {
    color: '#000',
  },
  multipleChoiceContainer: {
    gap: 12,
  },
  multipleChoiceButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  multipleChoiceButtonSelected: {
    backgroundColor: '#00CED1',
    borderColor: '#00CED1',
  },
  multipleChoiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  multipleChoiceButtonTextSelected: {
    color: '#000',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#00CED1',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#00CED1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#333',
  },
  nextButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonTextDisabled: {
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#00CED1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DailyCheckinScreen;
```

## 🔗 **Integração com Navegação**

```javascript
// navigation/AppNavigator.js
import { createStackNavigator } from '@react-navigation/stack';
import DailyCheckinScreen from '../components/DailyCheckinScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* Outras telas */}
      <Stack.Screen 
        name="DailyCheckin" 
        component={DailyCheckinScreen}
        options={{
          title: 'Daily Check-in',
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}
```

## 🎯 **Como Usar**

### 1. Navegar para o Check-in:
```javascript
// De qualquer tela, navegar passando o protocolId
navigation.navigate('DailyCheckin', { 
  protocolId: 'protocol_123' 
});
```

### 2. Verificar Status do Check-in:
```javascript
// Em uma tela de protocolo, verificar se já fez check-in hoje
const checkTodayStatus = async (protocolId) => {
  try {
    const data = await DailyCheckinAPI.getCheckinData(protocolId);
    console.log('Has check-in today:', data.hasCheckinToday);
    return data.hasCheckinToday;
  } catch (error) {
    console.error('Error checking status:', error);
    return false;
  }
};
```

### 3. Botão de Check-in:
```javascript
// Componente de botão para iniciar check-in
const CheckinButton = ({ protocolId }) => {
  const [hasCheckinToday, setHasCheckinToday] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const data = await DailyCheckinAPI.getCheckinData(protocolId);
      setHasCheckinToday(data.hasCheckinToday);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.checkinButton,
        hasCheckinToday && styles.checkinButtonCompleted
      ]}
      onPress={() => navigation.navigate('DailyCheckin', { protocolId })}
    >
      <Text style={styles.checkinButtonText}>
        {hasCheckinToday ? '✓ Edit Check-in' : 'Make Check-in'}
      </Text>
    </TouchableOpacity>
  );
};
```

## 📊 **Tipos de Perguntas Suportadas**

1. **TEXT**: Campo de texto livre
2. **SCALE**: Escala de 1-10
3. **YES_NO**: Sim/Não
4. **MULTIPLE_CHOICE**: Múltipla escolha (opções separadas por vírgula)

## 🔒 **Segurança**

- ✅ Autenticação JWT obrigatória
- ✅ Verificação de acesso ao protocolo
- ✅ Validação de dados no servidor
- ✅ Tratamento de erros completo

## 🚀 **Funcionalidades**

- ✅ Carregar perguntas do protocolo
- ✅ Verificar se já fez check-in hoje
- ✅ Submeter novas respostas
- ✅ Editar respostas existentes
- ✅ Navegação entre perguntas
- ✅ Validação de campos obrigatórios
- ✅ Interface responsiva e intuitiva 