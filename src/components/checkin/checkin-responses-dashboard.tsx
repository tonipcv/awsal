'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, Filter, Download, Eye } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DailyCheckinResponse {
  id: string;
  date: string;
  answer: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  question: {
    id: string;
    question: string;
    type: 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT' | 'YES_NO';
    options?: string;
    order: number;
  };
}

interface CheckinResponsesDashboardProps {
  protocolId: string;
  protocolName: string;
}

const dateRangeOptions = [
  { label: 'Hoje', value: 'today', days: 0 },
  { label: 'Últimos 7 dias', value: 'week', days: 7 },
  { label: 'Últimos 30 dias', value: 'month', days: 30 },
  { label: 'Esta semana', value: 'thisWeek', days: null },
];

export default function CheckinResponsesDashboard({ 
  protocolId, 
  protocolName 
}: CheckinResponsesDashboardProps) {
  const [responses, setResponses] = useState<DailyCheckinResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('week');
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Carregar respostas
  useEffect(() => {
    loadResponses();
  }, [protocolId, selectedDateRange]);

  const loadResponses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dateRange = getDateRange(selectedDateRange);
      const promises = dateRange.map(date => 
        fetch(`/api/protocols/${protocolId}/checkin-responses?date=${date}`)
          .then(res => res.json())
          .then(data => data.responses || [])
      );

      const allResponses = await Promise.all(promises);
      const flatResponses = allResponses.flat();
      
      setResponses(flatResponses);
    } catch (error: any) {
      setError('Erro ao carregar respostas');
      console.error('Erro ao carregar respostas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (range: string): string[] => {
    const today = new Date();
    const dates: string[] = [];

    switch (range) {
      case 'today':
        dates.push(format(today, 'yyyy-MM-dd'));
        break;
      case 'week':
        for (let i = 6; i >= 0; i--) {
          dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
        }
        break;
      case 'month':
        for (let i = 29; i >= 0; i--) {
          dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
        }
        break;
      case 'thisWeek':
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        let current = start;
        while (current <= end) {
          dates.push(format(current, 'yyyy-MM-dd'));
          current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        }
        break;
    }

    return dates;
  };

  // Filtrar respostas por paciente
  const filteredResponses = selectedPatient === 'all' 
    ? responses 
    : responses.filter(r => r.user.id === selectedPatient);

  // Obter lista única de pacientes
  const patients = Array.from(
    new Map(responses.map(r => [r.user.id, r.user])).values()
  );

  // Agrupar respostas por pergunta
  const responsesByQuestion = filteredResponses.reduce((acc, response) => {
    const questionId = response.question.id;
    if (!acc[questionId]) {
      acc[questionId] = {
        question: response.question,
        responses: []
      };
    }
    acc[questionId].responses.push(response);
    return acc;
  }, {} as Record<string, { question: any; responses: DailyCheckinResponse[] }>);

  // Calcular estatísticas
  const stats = {
    totalResponses: filteredResponses.length,
    uniquePatients: new Set(filteredResponses.map(r => r.user.id)).size,
    questionsAnswered: Object.keys(responsesByQuestion).length,
    avgResponsesPerDay: filteredResponses.length / getDateRange(selectedDateRange).length
  };

  const renderQuestionAnalysis = (questionData: { question: any; responses: DailyCheckinResponse[] }) => {
    const { question, responses } = questionData;

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        const options = question.options ? JSON.parse(question.options) : [];
        const optionCounts = options.reduce((acc: Record<string, number>, option: string) => {
          acc[option] = responses.filter(r => r.answer === option).length;
          return acc;
        }, {});

        return (
          <div className="space-y-3">
            {options.map((option: string) => {
              const count = optionCounts[option] || 0;
              const percentage = responses.length > 0 ? (count / responses.length) * 100 : 0;
              
              return (
                <div key={option} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{option}</span>
                      <span className="text-sm font-medium text-white">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'SCALE':
        const scaleValues = responses.map(r => parseInt(r.answer)).filter(v => !isNaN(v));
        const average = scaleValues.length > 0 
          ? scaleValues.reduce((sum, val) => sum + val, 0) / scaleValues.length 
          : 0;
        const min = Math.min(...scaleValues);
        const max = Math.max(...scaleValues);

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{average.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Média</div>
              </div>
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{max}</div>
                <div className="text-xs text-gray-400">Máximo</div>
              </div>
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{min}</div>
                <div className="text-xs text-gray-400">Mínimo</div>
              </div>
            </div>
          </div>
        );

      case 'YES_NO':
        const yesCount = responses.filter(r => r.answer === 'Sim').length;
        const noCount = responses.filter(r => r.answer === 'Não').length;
        const yesPercentage = responses.length > 0 ? (yesCount / responses.length) * 100 : 0;

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">Sim</span>
                  <span className="text-sm font-medium text-white">{yesCount} ({yesPercentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${yesPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">Não</span>
                  <span className="text-sm font-medium text-white">{noCount} ({(100 - yesPercentage).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${100 - yesPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'TEXT':
        return (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {responses.slice(0, 5).map((response, index) => (
              <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-300 mb-1">
                  {response.user.name} • {format(new Date(response.date), 'dd/MM', { locale: ptBR })}
                </div>
                <div className="text-white text-sm">{response.answer}</div>
              </div>
            ))}
            {responses.length > 5 && (
              <div className="text-center text-sm text-gray-400">
                +{responses.length - 5} respostas adicionais
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Respostas do Check-in Diário</h3>
          <p className="text-sm text-gray-400">{protocolName}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os pacientes</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalResponses}</div>
              <div className="text-sm text-gray-400">Total de Respostas</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.uniquePatients}</div>
              <div className="text-sm text-gray-400">Pacientes Ativos</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.questionsAnswered}</div>
              <div className="text-sm text-gray-400">Perguntas Respondidas</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.avgResponsesPerDay.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Média por Dia</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Questions Analysis */}
      {!isLoading && Object.keys(responsesByQuestion).length > 0 && (
        <div className="space-y-6">
          {Object.values(responsesByQuestion)
            .sort((a, b) => a.question.order - b.question.order)
            .map((questionData) => (
              <div key={questionData.question.id} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2">
                    {questionData.question.question}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="px-2 py-1 bg-gray-700/50 rounded">
                      {questionData.question.type === 'MULTIPLE_CHOICE' ? 'Múltipla Escolha' :
                       questionData.question.type === 'SCALE' ? 'Escala' :
                       questionData.question.type === 'YES_NO' ? 'Sim/Não' : 'Texto Livre'}
                    </span>
                    <span>{questionData.responses.length} respostas</span>
                  </div>
                </div>
                
                {renderQuestionAnalysis(questionData)}
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && Object.keys(responsesByQuestion).length === 0 && (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <Eye className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-300 mb-2">Nenhuma resposta encontrada</h4>
          <p className="text-gray-400">
            {selectedPatient === 'all' 
              ? 'Não há respostas de check-in para o período selecionado'
              : 'Este paciente não respondeu ao check-in no período selecionado'
            }
          </p>
        </div>
      )}
    </div>
  );
} 