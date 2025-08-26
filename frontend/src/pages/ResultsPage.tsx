import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { resultsApi } from '../services/api';
import { Result } from '../types/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  gap: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h2`
  flex: 1;
  margin: 0;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  min-width: 250px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ResultsTable = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr 80px 1fr 100px;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr 80px 1fr 100px;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const FlagBadge = styled.div<{ $flag: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: white;
  background: ${({ theme, $flag }) => {
    switch ($flag) {
      case 'H': return theme.colors.flag.H;
      case 'L': return theme.colors.flag.L;
      default: return theme.colors.flag.N;
    }
  }};
`;

const ValueWithUnit = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.medium};
`;

const ReferenceRange = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const StatsBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ResultsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  
  const { data: results, isLoading } = useQuery({
    queryKey: ['results'],
    queryFn: () => resultsApi.getAll(),
  });

  const filteredResults = useMemo(() => {
    if (!results) return [];
    
    return results.filter((result: Result) => {
      const matchesSearch = result.source_label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFlag = !flagFilter || result.flag === flagFilter;
      
      return matchesSearch && matchesFlag;
    });
  }, [results, searchTerm, flagFilter]);

  const stats = useMemo(() => {
    if (!results) return { total: 0, high: 0, low: 0, normal: 0 };
    
    return {
      total: results.length,
      high: results.filter((r: Result) => r.flag === 'H').length,
      low: results.filter((r: Result) => r.flag === 'L').length,
      normal: results.filter((r: Result) => r.flag === 'N' || !r.flag).length,
    };
  }, [results]);

  if (isLoading) {
    return <LoadingText>Загрузка результатов...</LoadingText>;
  }

  return (
    <Container>
      <Header>
        <Title>Результаты анализов</Title>
      </Header>

      <StatsBar>
        <StatItem>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Всего</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue style={{ color: '#10b981' }}>{stats.normal}</StatValue>
          <StatLabel>Норма</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue style={{ color: '#ef4444' }}>{stats.high}</StatValue>
          <StatLabel>Повышен</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue style={{ color: '#3b82f6' }}>{stats.low}</StatValue>
          <StatLabel>Понижен</StatLabel>
        </StatItem>
      </StatsBar>

      <FiltersRow>
        <SearchInput
          type="text"
          placeholder="Поиск по названию показателя..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={flagFilter} onChange={(e) => setFlagFilter(e.target.value)}>
          <option value="">Все результаты</option>
          <option value="N">Норма</option>
          <option value="H">Повышен</option>
          <option value="L">Понижен</option>
        </Select>
      </FiltersRow>

      <ResultsTable>
        <TableHeader>
          <div>Показатель</div>
          <div>Значение</div>
          <div>Единица</div>
          <div>Референс</div>
          <div>Флаг</div>
          <div>Комментарий</div>
          <div>Дата</div>
        </TableHeader>
        
        {filteredResults.length === 0 ? (
          <EmptyState>
            {searchTerm || flagFilter ? 'Результаты не найдены' : 'Нет результатов анализов'}
          </EmptyState>
        ) : (
          filteredResults.map((result: Result) => (
            <TableRow key={result.id}>
              <div>{result.source_label}</div>
              <ValueWithUnit>{result.raw_value}</ValueWithUnit>
              <div>{result.raw_unit || '-'}</div>
              <ReferenceRange>{result.raw_reference_range || '-'}</ReferenceRange>
              <div>
                <FlagBadge $flag={result.flag || 'N'}>
                  {result.flag || 'N'}
                </FlagBadge>
              </div>
              <div>{result.lab_comments || '-'}</div>
              <div>
                {format(new Date(result.created_at), 'dd.MM.yy', { locale: ru })}
              </div>
            </TableRow>
          ))
        )}
      </ResultsTable>
    </Container>
  );
};

export default ResultsPage;