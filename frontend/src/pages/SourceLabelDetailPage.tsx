import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { ArrowLeft, Activity, AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { resultsApi } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ChartContainer = styled.div`
  height: 400px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background: ${({ theme }) => theme.colors.background};
`;

const Th = styled.th`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  text-align: left;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FlagWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FlagIcon = styled.div<{ $variant: 'normal' | 'high' | 'low' | 'anomaly' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  color: white;
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  
  background: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'high':
        return theme.colors.error;
      case 'low':
        return theme.colors.warning;
      case 'anomaly':
        return '#dc2626';
      default:
        return theme.colors.success;
    }
  }};
`;

const WarningAlert = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: #92400e;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const InfoAlert = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: #e0f2fe;
  border: 1px solid #0288d1;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: #01579b;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

interface ChartDataPoint {
  date: string;
  value: number | null;
  formattedDate: string;
  is_out_of_range: boolean;
  is_suspect: boolean;
  unit: string;
  reference_min?: number;
  reference_max?: number;
}

const SourceLabelDetailPage: React.FC = () => {
  const { sourceLabel } = useParams<{ sourceLabel: string }>();
  const navigate = useNavigate();

  const decodedSourceLabel = sourceLabel ? decodeURIComponent(sourceLabel) : '';

  const { data: history = [], isLoading: historyLoading, error } = useQuery({
    queryKey: ['source-label-history', decodedSourceLabel],
    queryFn: async () => {
      console.log('Fetching history for source label:', decodedSourceLabel);
      try {
        const result = await resultsApi.getSourceLabelHistory(decodedSourceLabel);
        console.log('Source label history API response:', result);
        return result;
      } catch (err) {
        console.error('Error fetching source label history:', err);
        throw err;
      }
    },
    enabled: !!decodedSourceLabel,
  });

  // Подготавливаем данные для графика
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (!history || history.length === 0) return [];

    return history
      .filter(result => result.numeric_value !== null)
      .map(result => ({
        date: result.created_at,
        value: result.numeric_value ? Number(result.numeric_value) : null,
        formattedDate: new Date(result.created_at).toLocaleDateString('ru-RU'),
        is_out_of_range: result.is_out_of_range || false,
        is_suspect: result.is_suspect,
        unit: result.normalized_unit || result.raw_unit || '',
        reference_min: result.normalized_reference_min ? Number(result.normalized_reference_min) : undefined,
        reference_max: result.normalized_reference_max ? Number(result.normalized_reference_max) : undefined,
      }))
      .reverse(); // Показываем от старых к новым
  }, [history]);

  // Получаем референсные значения для линий
  const referenceRange = React.useMemo(() => {
    if (chartData.length === 0) return null;
    
    const firstPoint = chartData.find(point => point.reference_min !== undefined && point.reference_max !== undefined);
    return firstPoint ? {
      min: firstPoint.reference_min!,
      max: firstPoint.reference_max!,
    } : null;
  }, [chartData]);

  // Есть ли подозрительные значения (>10x отклонение)
  const hasSuspectValues = history.some(result => result.is_suspect);

  const getFlagVariant = (result: any) => {
    if (result.is_suspect) return 'anomaly';
    if (!result.is_out_of_range) return 'normal';
    if (result.numeric_value && result.normalized_reference_max) {
      return Number(result.numeric_value) > Number(result.normalized_reference_max) ? 'high' : 'low';
    }
    return result.is_out_of_range ? 'high' : 'normal';
  };

  const getFlagIcon = (result: any) => {
    if (result.is_suspect) return <AlertTriangle size={12} />;
    if (!result.is_out_of_range) return <CheckCircle size={12} />;
    if (result.numeric_value && result.normalized_reference_max) {
      return Number(result.numeric_value) > Number(result.normalized_reference_max) ? 
        <TrendingUp size={12} /> : <TrendingDown size={12} />;
    }
    return <CheckCircle size={12} />;
  };

  const getFlagText = (result: any) => {
    if (result.is_suspect) return 'аномалия';
    if (!result.is_out_of_range) return 'норма';
    if (result.flag) return result.flag;
    if (result.numeric_value && result.normalized_reference_max) {
      return Number(result.numeric_value) > Number(result.normalized_reference_max) ? '↑' : '↓';
    }
    return result.is_out_of_range ? '↑/↓' : 'норма';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatValue = (result: any) => {
    if (result.numeric_value) {
      const unit = result.normalized_unit || result.raw_unit || '';
      return `${result.numeric_value}${unit ? ' ' + unit : ''}`;
    }
    return result.raw_value;
  };

  const formatReference = (result: any) => {
    if (result.normalized_reference_min && result.normalized_reference_max) {
      return `${result.normalized_reference_min}-${result.normalized_reference_max}`;
    }
    return result.raw_reference_range || '—';
  };

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить историю показателя';
    console.error('Source label detail error:', error);
    
    return (
      <Container>
        <Header>
          <BackButton onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            Назад
          </BackButton>
          <Title>{decodedSourceLabel || 'Показатель'}</Title>
        </Header>
        
        <ErrorMessage 
          message={`Ошибка загрузки данных: ${errorMessage}`}
        />
      </Container>
    );
  }

  if (historyLoading) {
    return (
      <Container>
        <LoadingState>Загрузка данных...</LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          Назад
        </BackButton>
        <Title>{decodedSourceLabel}</Title>
      </Header>

      <InfoAlert>
        <Activity size={20} />
        Это показатель, который еще не привязан к системе аналитов. Данные отображаются как есть из источника.
      </InfoAlert>

      {hasSuspectValues && (
        <WarningAlert>
          <AlertTriangle size={20} />
          Обнаружены значения с сильным отклонением от нормы (&gt;10×). Проверьте корректность данных.
        </WarningAlert>
      )}

      {/* График динамики */}
      <Card>
        <CardTitle>
          <Activity />
          График динамики
        </CardTitle>
        
        {chartData.length > 0 ? (
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [`${value} ${chartData[0]?.unit || ''}`, 'Значение']}
                  labelFormatter={(label) => `Дата: ${label}`}
                />
                
                {/* Референсные линии */}
                {referenceRange && (
                  <>
                    <ReferenceLine 
                      y={referenceRange.min} 
                      stroke="#10b981" 
                      strokeDasharray="5 5" 
                      label="Мин. норма" 
                    />
                    <ReferenceLine 
                      y={referenceRange.max} 
                      stroke="#10b981" 
                      strokeDasharray="5 5" 
                      label="Макс. норма" 
                    />
                  </>
                )}
                
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    let color = '#10b981'; // зеленый для нормы
                    
                    if (payload.is_suspect) {
                      color = '#dc2626'; // красный для аномалий
                    } else if (payload.is_out_of_range) {
                      color = '#f59e0b'; // желтый для выхода за норму
                    }
                    
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={4} 
                        fill={color} 
                        stroke={color}
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            Недостаточно данных для построения графика
          </div>
        )}
      </Card>

      {/* Таблица истории */}
      <Card>
        <CardTitle>История значений</CardTitle>
        
        {history.length > 0 ? (
          <Table>
            <Thead>
              <tr>
                <Th>Дата</Th>
                <Th>Значение</Th>
                <Th>Единица</Th>
                <Th>Референс</Th>
                <Th>Флаг</Th>
                <Th>Комментарий</Th>
              </tr>
            </Thead>
            <Tbody>
              {history.map((result) => {
                const flagVariant = getFlagVariant(result);
                const flagIcon = getFlagIcon(result);
                const flagText = getFlagText(result);

                return (
                  <Tr key={result.id}>
                    <Td>{formatDate(result.created_at)}</Td>
                    <Td>{formatValue(result)}</Td>
                    <Td>{result.normalized_unit || result.raw_unit || '—'}</Td>
                    <Td>{formatReference(result)}</Td>
                    <Td>
                      <FlagWrapper>
                        <FlagIcon $variant={flagVariant}>
                          {flagIcon}
                        </FlagIcon>
                        {flagText}
                      </FlagWrapper>
                    </Td>
                    <Td>{result.lab_comments || '—'}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            История значений отсутствует
          </div>
        )}
      </Card>
    </Container>
  );
};

export default SourceLabelDetailPage;