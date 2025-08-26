import React from 'react';
import styled from 'styled-components';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

const TableContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background: ${({ theme }) => theme.colors.background};
`;

const Th = styled.th`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const AnalyteName = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Value = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

const Unit = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-left: 4px;
`;

const Reference = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSize.xs};
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

const FlagText = styled.span<{ $variant: 'normal' | 'high' | 'low' | 'anomaly' }>`
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  
  color: ${({ $variant, theme }) => {
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

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export interface ResultSummary {
  analyte_id: number;
  analyte_name: string;
  last_value: string;
  unit: string;
  reference: string;
  flag: string;
  date: string;
  lab_name: string;
  is_out_of_range: boolean;
  is_suspect: boolean;
}

interface ResultsTableProps {
  results: ResultSummary[];
  onRowClick: (analyteId: number) => void;
  loading?: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, onRowClick, loading }) => {
  const getFlagVariant = (flag: string, isOutOfRange: boolean, isSuspect: boolean) => {
    if (isSuspect) return 'anomaly';
    if (!isOutOfRange) return 'normal';
    if (flag === '↑') return 'high';
    if (flag === '↓') return 'low';
    return isOutOfRange ? 'high' : 'normal';
  };

  const getFlagIcon = (flag: string, isOutOfRange: boolean, isSuspect: boolean) => {
    if (isSuspect) return <AlertTriangle size={12} />;
    if (!isOutOfRange) return <CheckCircle size={12} />;
    if (flag === '↑') return <TrendingUp size={12} />;
    if (flag === '↓') return <TrendingDown size={12} />;
    return <CheckCircle size={12} />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <TableContainer>
        <EmptyState>Загрузка результатов...</EmptyState>
      </TableContainer>
    );
  }

  if (results.length === 0) {
    return (
      <TableContainer>
        <EmptyState>
          Результаты не найдены.
          <br />
          Попробуйте изменить фильтры или загрузить новые анализы.
        </EmptyState>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <Table>
        <Thead>
          <tr>
            <Th>Показатель</Th>
            <Th>Последнее значение</Th>
            <Th>Единица</Th>
            <Th>Референс</Th>
            <Th>Флаг</Th>
            <Th>Дата</Th>
          </tr>
        </Thead>
        <Tbody>
          {results.map((result) => {
            const flagVariant = getFlagVariant(result.flag, result.is_out_of_range, result.is_suspect);
            const flagIcon = getFlagIcon(result.flag, result.is_out_of_range, result.is_suspect);

            return (
              <Tr key={result.analyte_id} onClick={() => onRowClick(result.analyte_id)}>
                <Td>
                  <AnalyteName>{result.analyte_name}</AnalyteName>
                </Td>
                <Td>
                  <Value>
                    {result.last_value}
                    {result.unit && <Unit>{result.unit}</Unit>}
                  </Value>
                </Td>
                <Td>{result.unit}</Td>
                <Td>
                  <Reference>{result.reference || '—'}</Reference>
                </Td>
                <Td>
                  <FlagWrapper>
                    <FlagIcon $variant={flagVariant}>
                      {flagIcon}
                    </FlagIcon>
                    <FlagText $variant={flagVariant}>
                      {result.flag}
                    </FlagText>
                  </FlagWrapper>
                </Td>
                <Td>{formatDate(result.date)}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default ResultsTable;