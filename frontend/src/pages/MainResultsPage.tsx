import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Activity, Upload } from 'lucide-react';
import { resultsApi } from '../services/api';
import ResultsFilters, { FiltersState } from '../components/ResultsFilters';
import ResultsTable, { ResultSummary } from '../components/ResultsTable';
import ErrorMessage from '../components/ErrorMessage';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TitleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.colors.primary}15;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.primary};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary}dd;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: ${({ theme }) => theme.colors.text.muted};
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary}10;
  }
`;

const StatsCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const MainResultsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    dateFrom: '',
    dateTo: '',
    labName: '',
    outOfRangeOnly: false,
  });

  // Получаем сводку результатов с учетом фильтров
  const { 
    data: results = [], 
    isLoading, 
    error
  } = useQuery({
    queryKey: ['results-summary', filters],
    queryFn: async () => {
      const data = await resultsApi.getSummary({
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        search: filters.search || undefined,
        lab_name: filters.labName || undefined,
        out_of_range_only: filters.outOfRangeOnly || undefined,
      });
      console.log('Results summary API response:', data);
      return data;
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  // Статистика
  const stats = React.useMemo(() => {
    if (!results || results.length === 0) {
      return {
        total: 0,
        outOfRange: 0,
        suspect: 0,
        normal: 0,
      };
    }

    const total = results.length;
    const outOfRange = results.filter((r: ResultSummary) => r.is_out_of_range).length;
    const suspect = results.filter((r: ResultSummary) => r.is_suspect).length;
    const normal = total - outOfRange;

    return {
      total,
      outOfRange,
      suspect,
      normal,
    };
  }, [results]);

  const handleRowClick = (result: ResultSummary) => {
    console.log('Row clicked:', result);
    
    // Если есть настоящий analyte_id (число), используем его
    if (typeof result.analyte_id === 'number') {
      navigate(`/analyte/${result.analyte_id}`);
      return;
    }
    
    // Если это строка и корректное число, пытаемся использовать
    if (typeof result.analyte_id === 'string') {
      const numericId = parseInt(result.analyte_id, 10);
      if (!isNaN(numericId)) {
        navigate(`/analyte/${numericId}`);
        return;
      }
    }
    
    // Иначе используем source_label для навигации
    if (result.source_label) {
      navigate(`/source-label/${encodeURIComponent(result.source_label)}`);
    } else {
      console.error('No valid navigation path for result:', result);
      alert('Не удается определить путь для навигации');
    }
  };

  const handleUploadClick = () => {
    navigate('/documents');
  };

  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <Container>
        <ErrorMessage 
          message="Не удалось загрузить результаты анализов" 
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <TitleIcon>
            <Activity />
          </TitleIcon>
          Результаты анализов
        </Title>
        <Actions>
          <SecondaryButton onClick={() => navigate('/uploads')}>
            Мои загрузки
          </SecondaryButton>
          <Button onClick={handleUploadClick}>
            <Upload size={16} />
            Загрузить анализы
          </Button>
        </Actions>
      </Header>

      {/* Статистика */}
      <StatsCard>
        <StatsGrid>
          <StatItem>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Всего показателей</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue style={{ color: '#10b981' }}>{stats.normal}</StatValue>
            <StatLabel>В норме</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue style={{ color: '#f59e0b' }}>{stats.outOfRange}</StatValue>
            <StatLabel>Вне нормы</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue style={{ color: '#dc2626' }}>{stats.suspect}</StatValue>
            <StatLabel>Аномалии</StatLabel>
          </StatItem>
        </StatsGrid>
      </StatsCard>

      {/* Фильтры */}
      <ResultsFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Таблица результатов */}
      <ResultsTable
        results={results}
        onRowClick={handleRowClick}
        loading={isLoading}
      />
    </Container>
  );
};

export default MainResultsPage;