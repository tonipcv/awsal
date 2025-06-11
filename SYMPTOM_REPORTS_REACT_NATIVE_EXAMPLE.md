# 📱 Symptom Reports - Exemplo React Native

Este documento mostra como implementar o sistema de Relatórios de Sintomas no React Native usando o endpoint `/api/mobile/symptom-reports`.

## 🔧 **Configuração da API**

```javascript
// api/symptomReports.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000'; // ou sua URL de produção

class SymptomReportsAPI {
  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('userToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Buscar relatórios de sintomas
  async getReports(protocolId = null, limit = 20, offset = 0) {
    try {
      const headers = await this.getAuthHeaders();
      let url = `${API_BASE_URL}/api/mobile/symptom-reports?limit=${limit}&offset=${offset}`;
      
      if (protocolId) {
        url += `&protocolId=${protocolId}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching symptom reports:', error);
      throw error;
    }
  }

  // Criar novo relatório de sintomas
  async createReport(reportData) {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/mobile/symptom-reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating symptom report:', error);
      throw error;
    }
  }
}

export default new SymptomReportsAPI();
```

## 🎨 **Tela de Criar Relatório**

```javascript
// screens/CreateSymptomReportScreen.js
import React, { useState } from 'react';
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
import { format } from 'date-fns';
import SymptomReportsAPI from '../api/symptomReports';

const CreateSymptomReportScreen = ({ route, navigation }) => {
  const { protocolId, dayNumber, protocolName } = route.params;
  
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState(1);
  const [isNow, setIsNow] = useState(true);
  const [customTime, setCustomTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!symptoms.trim()) {
      Alert.alert('Error', 'Please describe your symptoms');
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados do relatório
      const reportData = {
        protocolId,
        dayNumber,
        symptoms: symptoms.trim(),
        severity,
        isNow,
        title: title.trim() || 'Relatório de Sintomas',
        description: description.trim()
      };

      // Se não é "agora", incluir tempo customizado
      if (!isNow && customTime) {
        const [hours, minutes] = customTime.split(':').map(Number);
        const reportTime = new Date();
        reportTime.setHours(hours, minutes, 0, 0);
        reportData.reportTime = reportTime.toISOString();
      }

      const result = await SymptomReportsAPI.createReport(reportData);
      
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
      Alert.alert('Error', 'Failed to submit symptom report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (level) => {
    if (level <= 3) return '#10B981'; // Green
    if (level <= 6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getSeverityText = (level) => {
    if (level <= 3) return 'Mild';
    if (level <= 6) return 'Moderate';
    return 'Severe';
  };

  const getCurrentTime = () => {
    return format(new Date(), 'HH:mm');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Report Symptoms</Text>
        <Text style={styles.subtitle}>
          {protocolName} • Day {dayNumber}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title (Optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Title (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Morning headache"
            placeholderTextColor="#666"
            maxLength={100}
          />
        </View>

        {/* Symptoms Description */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Describe your symptoms *
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="Describe in detail the symptoms you are experiencing..."
            placeholderTextColor="#666"
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>
            {symptoms.length}/1000 characters
          </Text>
        </View>

        {/* Additional Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Additional notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Any additional context or notes..."
            placeholderTextColor="#666"
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {description.length}/500 characters
          </Text>
        </View>

        {/* Severity Scale */}
        <View style={styles.section}>
          <Text style={styles.label}>Symptom intensity (1-10)</Text>
          <View style={styles.severityContainer}>
            <View style={styles.severityScale}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityButton,
                    severity === level && {
                      backgroundColor: getSeverityColor(level),
                      borderColor: getSeverityColor(level)
                    }
                  ]}
                  onPress={() => setSeverity(level)}
                >
                  <Text style={[
                    styles.severityButtonText,
                    severity === level && styles.severityButtonTextSelected
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.severityLabels}>
              <Text style={styles.severityLabel}>Mild</Text>
              <Text style={styles.severityLabel}>Moderate</Text>
              <Text style={styles.severityLabel}>Severe</Text>
            </View>
            <View style={styles.selectedSeverity}>
              <Text style={styles.selectedSeverityText}>
                Selected: {severity}/10 - {getSeverityText(severity)}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>When did the symptoms occur?</Text>
          <View style={styles.timeOptions}>
            <TouchableOpacity
              style={[
                styles.timeOption,
                isNow && styles.timeOptionSelected
              ]}
              onPress={() => setIsNow(true)}
            >
              <View style={[
                styles.radio,
                isNow && styles.radioSelected
              ]}>
                {isNow && <View style={styles.radioDot} />}
              </View>
              <Text style={[
                styles.timeOptionText,
                isNow && styles.timeOptionTextSelected
              ]}>
                Now ({getCurrentTime()})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeOption,
                !isNow && styles.timeOptionSelected
              ]}
              onPress={() => setIsNow(false)}
            >
              <View style={[
                styles.radio,
                !isNow && styles.radioSelected
              ]}>
                {!isNow && <View style={styles.radioDot} />}
              </View>
              <Text style={[
                styles.timeOptionText,
                !isNow && styles.timeOptionTextSelected
              ]}>
                Specific time
              </Text>
            </TouchableOpacity>

            {!isNow && (
              <View style={styles.customTimeContainer}>
                <TextInput
                  style={styles.timeInput}
                  value={customTime}
                  onChangeText={setCustomTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#666"
                  maxLength={5}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!symptoms.trim() || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!symptoms.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  severityContainer: {
    marginTop: 8,
  },
  severityScale: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  severityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  severityButtonTextSelected: {
    color: '#000',
  },
  severityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityLabel: {
    color: '#666',
    fontSize: 12,
  },
  selectedSeverity: {
    alignItems: 'center',
  },
  selectedSeverityText: {
    color: '#00CED1',
    fontSize: 14,
    fontWeight: '600',
  },
  timeOptions: {
    marginTop: 8,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeOptionSelected: {
    // Styling handled by radio button
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#00CED1',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00CED1',
  },
  timeOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  timeOptionTextSelected: {
    color: '#00CED1',
    fontWeight: '600',
  },
  customTimeContainer: {
    marginLeft: 32,
    marginTop: 8,
  },
  timeInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    width: 100,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  submitButton: {
    backgroundColor: '#00CED1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#333',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateSymptomReportScreen;
```

## 📋 **Tela de Lista de Relatórios**

```javascript
// screens/SymptomReportsListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { format } from 'date-fns';
import SymptomReportsAPI from '../api/symptomReports';

const SymptomReportsListScreen = ({ route, navigation }) => {
  const { protocolId, protocolName } = route.params || {};
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const limit = 20;

  useEffect(() => {
    loadReports(true);
  }, []);

  const loadReports = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const data = await SymptomReportsAPI.getReports(protocolId, limit, currentOffset);
      
      if (reset) {
        setReports(data.reports);
      } else {
        setReports(prev => [...prev, ...data.reports]);
      }

      setHasMore(data.pagination.hasMore);
      setOffset(currentOffset + limit);
    } catch (error) {
      Alert.alert('Error', 'Failed to load symptom reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports(true);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadReports(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity <= 3) return '#10B981';
    if (severity <= 6) return '#F59E0B';
    return '#EF4444';
  };

  const getSeverityText = (severity) => {
    if (severity <= 3) return 'Mild';
    if (severity <= 6) return 'Moderate';
    return 'Severe';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#F59E0B';
      case 'REVIEWED':
        return '#3B82F6';
      case 'REQUIRES_ATTENTION':
        return '#EF4444';
      case 'RESOLVED':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'REVIEWED':
        return 'Reviewed';
      case 'REQUIRES_ATTENTION':
        return 'Needs Attention';
      case 'RESOLVED':
        return 'Resolved';
      default:
        return status;
    }
  };

  const renderReport = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('SymptomReportDetail', { report: item })}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{item.title}</Text>
          <Text style={styles.reportProtocol}>
            {item.protocol.name} • Day {item.dayNumber}
          </Text>
        </View>
        <View style={styles.reportBadges}>
          <View style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(item.severity) }
          ]}>
            <Text style={styles.severityBadgeText}>
              {item.severity}/10
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusBadgeText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.reportSymptoms} numberOfLines={2}>
        {item.symptoms}
      </Text>

      <View style={styles.reportFooter}>
        <Text style={styles.reportTime}>
          {format(new Date(item.reportTime), 'MMM dd, yyyy HH:mm')}
        </Text>
        {item.attachments.length > 0 && (
          <Text style={styles.attachmentCount}>
            📎 {item.attachments.length} attachment(s)
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No symptom reports</Text>
      <Text style={styles.emptySubtitle}>
        {protocolName 
          ? `No reports found for ${protocolName}`
          : 'You haven\'t submitted any symptom reports yet'
        }
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateSymptomReport', {
          protocolId: protocolId || 'default',
          dayNumber: 1,
          protocolName: protocolName || 'Protocol'
        })}
      >
        <Text style={styles.createButtonText}>Create First Report</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#00CED1" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CED1" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Symptom Reports</Text>
        {protocolName && (
          <Text style={styles.subtitle}>{protocolName}</Text>
        )}
      </View>

      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00CED1"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateSymptomReport', {
          protocolId: protocolId || 'default',
          dayNumber: 1,
          protocolName: protocolName || 'Protocol'
        })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
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
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  reportCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportProtocol: {
    color: '#999',
    fontSize: 12,
  },
  reportBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportSymptoms: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTime: {
    color: '#666',
    fontSize: 12,
  },
  attachmentCount: {
    color: '#666',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#00CED1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00CED1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default SymptomReportsListScreen;
```

## 📄 **Tela de Detalhes do Relatório**

```javascript
// screens/SymptomReportDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import { format } from 'date-fns';

const SymptomReportDetailScreen = ({ route, navigation }) => {
  const { report } = route.params;

  const getSeverityColor = (severity) => {
    if (severity <= 3) return '#10B981';
    if (severity <= 6) return '#F59E0B';
    return '#EF4444';
  };

  const getSeverityText = (severity) => {
    if (severity <= 3) return 'Mild';
    if (severity <= 6) return 'Moderate';
    return 'Severe';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#F59E0B';
      case 'REVIEWED':
        return '#3B82F6';
      case 'REQUIRES_ATTENTION':
        return '#EF4444';
      case 'RESOLVED':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Review';
      case 'REVIEWED':
        return 'Reviewed by Doctor';
      case 'REQUIRES_ATTENTION':
        return 'Requires Attention';
      case 'RESOLVED':
        return 'Resolved';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.subtitle}>
            {report.protocol.name} • Day {report.dayNumber}
          </Text>
          <Text style={styles.date}>
            {format(new Date(report.reportTime), 'MMMM dd, yyyy \'at\' HH:mm')}
          </Text>
        </View>

        {/* Status and Severity */}
        <View style={styles.badgesContainer}>
          <View style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(report.severity) }
          ]}>
            <Text style={styles.severityBadgeText}>
              Intensity: {report.severity}/10 - {getSeverityText(report.severity)}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(report.status) }
          ]}>
            <Text style={styles.statusBadgeText}>
              {getStatusText(report.status)}
            </Text>
          </View>
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms Description</Text>
          <View style={styles.contentBox}>
            <Text style={styles.contentText}>{report.symptoms}</Text>
          </View>
        </View>

        {/* Additional Description */}
        {report.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{report.description}</Text>
            </View>
          </View>
        )}

        {/* Attachments */}
        {report.attachments && report.attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Attachments ({report.attachments.length})
            </Text>
            <View style={styles.attachmentsContainer}>
              {report.attachments.map((attachment) => (
                <TouchableOpacity
                  key={attachment.id}
                  style={styles.attachmentItem}
                >
                  {attachment.mimeType.startsWith('image/') ? (
                    <Image
                      source={{ uri: attachment.fileUrl }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.attachmentFile}>
                      <Text style={styles.attachmentFileName}>
                        📎 {attachment.originalName}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Doctor's Review */}
        {report.doctorNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor's Review</Text>
            <View style={[styles.contentBox, styles.doctorNotesBox]}>
              <Text style={styles.contentText}>{report.doctorNotes}</Text>
              {report.reviewedAt && (
                <Text style={styles.reviewDate}>
                  Reviewed on {format(new Date(report.reviewedAt), 'MMM dd, yyyy \'at\' HH:mm')}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Report Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Information</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>
                {format(new Date(report.createdAt), 'MMM dd, yyyy \'at\' HH:mm')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Protocol:</Text>
              <Text style={styles.infoValue}>{report.protocol.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Day:</Text>
              <Text style={styles.infoValue}>{report.dayNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reported Time:</Text>
              <Text style={styles.infoValue}>
                {report.isNow ? 'Immediate' : 'Specific time'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
    paddingTop: 40,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#00CED1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    color: '#999',
    fontSize: 14,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  severityBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contentBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  contentText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
  },
  doctorNotesBox: {
    backgroundColor: '#0f1419',
    borderColor: '#00CED1',
  },
  reviewDate: {
    color: '#00CED1',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attachmentItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  attachmentFile: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  attachmentFileName: {
    color: '#ccc',
    fontSize: 10,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
});

export default SymptomReportDetailScreen;
```

## 🔗 **Integração com Navegação**

```javascript
// navigation/AppNavigator.js
import { createStackNavigator } from '@react-navigation/stack';
import CreateSymptomReportScreen from '../screens/CreateSymptomReportScreen';
import SymptomReportsListScreen from '../screens/SymptomReportsListScreen';
import SymptomReportDetailScreen from '../screens/SymptomReportDetailScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Outras telas */}
      
      <Stack.Screen 
        name="SymptomReportsList" 
        component={SymptomReportsListScreen}
        options={{
          title: 'Symptom Reports',
        }}
      />
      
      <Stack.Screen 
        name="CreateSymptomReport" 
        component={CreateSymptomReportScreen}
        options={{
          title: 'Report Symptoms',
        }}
      />
      
      <Stack.Screen 
        name="SymptomReportDetail" 
        component={SymptomReportDetailScreen}
        options={{
          title: 'Report Details',
        }}
      />
    </Stack.Navigator>
  );
}
```

## 🎯 **Como Usar**

### 1. Navegar para criar relatório:
```javascript
// De qualquer tela, navegar passando os parâmetros necessários
navigation.navigate('CreateSymptomReport', { 
  protocolId: 'protocol_123',
  dayNumber: 5,
  protocolName: 'Recovery Protocol'
});
```

### 2. Ver lista de relatórios:
```javascript
// Ver todos os relatórios do paciente
navigation.navigate('SymptomReportsList');

// Ver relatórios de um protocolo específico
navigation.navigate('SymptomReportsList', {
  protocolId: 'protocol_123',
  protocolName: 'Recovery Protocol'
});
```

### 3. Botão de acesso rápido:
```javascript
// Componente de botão para criar relatório
const SymptomReportButton = ({ protocolId, dayNumber, protocolName }) => {
  return (
    <TouchableOpacity
      style={styles.symptomButton}
      onPress={() => navigation.navigate('CreateSymptomReport', {
        protocolId,
        dayNumber,
        protocolName
      })}
    >
      <Text style={styles.symptomButtonText}>Report Symptoms</Text>
    </TouchableOpacity>
  );
};
```

## 📊 **Funcionalidades Implementadas**

### ✅ Criar Relatório:
- Descrição detalhada dos sintomas
- Escala de intensidade (1-10)
- Seleção de tempo (agora ou específico)
- Título e notas adicionais opcionais
- Validação de campos obrigatórios

### ✅ Lista de Relatórios:
- Visualização de todos os relatórios
- Filtro por protocolo
- Paginação infinita
- Pull-to-refresh
- Status visual (badges)

### ✅ Detalhes do Relatório:
- Visualização completa do relatório
- Status de revisão do médico
- Notas do médico (quando disponível)
- Anexos (quando implementado)
- Informações detalhadas

## 🔒 **Segurança**

- ✅ Autenticação JWT obrigatória
- ✅ Verificação de acesso ao protocolo
- ✅ Validação de dados no servidor
- ✅ Tratamento de erros completo

## 🚀 **Próximos Passos**

1. **Upload de Imagens**: Implementar anexos de fotos
2. **Notificações**: Alertas quando médico revisar
3. **Filtros Avançados**: Por data, status, intensidade
4. **Estatísticas**: Gráficos de evolução dos sintomas
5. **Lembretes**: Notificações para reportar sintomas 