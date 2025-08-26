import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FileText, Activity, AlertTriangle, Upload } from 'lucide-react';
import { documentsApi, resultsApi } from '../services/api';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CardIcon = styled.div<{ $color?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${({ theme, $color }) => $color || theme.colors.primary}15;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme, $color }) => $color || theme.colors.primary};
`;

const Stat = styled.div`
  font-size: ${({ theme }) => theme.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ActionCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primary}05;
  }
`;

const ActionIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${({ theme }) => theme.colors.primary}15;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 auto ${({ theme }) => theme.spacing.md};
`;

const ActionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSize.xl};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ActionDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const LoadingCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HomePage: React.FC = () => {
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getAll({ limit: 100 }),
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['results'],
    queryFn: () => resultsApi.getAll({ limit: 100 }),
  });

  const stats = React.useMemo(() => {
    if (!documents || !results) return null;

    const totalDocuments = documents.length;
    const pendingDocuments = documents.filter(d => d.status === 'pending' || d.status === 'processing').length;
    const failedDocuments = documents.filter(d => d.status === 'failed').length;
    
    const totalResults = results.length;
    const outOfRangeResults = results.filter(r => r.is_out_of_range).length;
    const suspectResults = results.filter(r => r.is_suspect).length;

    return {
      totalDocuments,
      pendingDocuments,
      failedDocuments,
      totalResults,
      outOfRangeResults,
      suspectResults,
    };
  }, [documents, results]);

  if (documentsLoading || resultsLoading) {
    return (
      <Grid>
        <LoadingCard>Загрузка статистики...</LoadingCard>
      </Grid>
    );
  }

  return (
    <>
      <StatsGrid>
        <Card>
          <CardHeader>
            <CardIcon>
              <FileText />
            </CardIcon>
            <CardTitle>Документы</CardTitle>
          </CardHeader>
          <Stat>{stats?.totalDocuments || 0}</Stat>
          <StatLabel>Всего загружено</StatLabel>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon $color="#f59e0b">
              <Activity />
            </CardIcon>
            <CardTitle>В обработке</CardTitle>
          </CardHeader>
          <Stat>{stats?.pendingDocuments || 0}</Stat>
          <StatLabel>Документов обрабатывается</StatLabel>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon $color="#ef4444">
              <AlertTriangle />
            </CardIcon>
            <CardTitle>Ошибки</CardTitle>
          </CardHeader>
          <Stat>{stats?.failedDocuments || 0}</Stat>
          <StatLabel>Документов с ошибками</StatLabel>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon $color="#10b981">
              <Activity />
            </CardIcon>
            <CardTitle>Результаты</CardTitle>
          </CardHeader>
          <Stat>{stats?.totalResults || 0}</Stat>
          <StatLabel>Показателей извлечено</StatLabel>
        </Card>
      </StatsGrid>

      <Grid>
        <Link to="/documents">
          <ActionCard>
            <ActionIcon>
              <Upload />
            </ActionIcon>
            <ActionTitle>Загрузить анализы</ActionTitle>
            <ActionDescription>
              Загрузите PDF, изображения или файлы с результатами анализов
            </ActionDescription>
          </ActionCard>
        </Link>

        {stats?.outOfRangeResults ? (
          <Link to="/results?out_of_range=true">
            <ActionCard>
              <ActionIcon>
                <AlertTriangle />
              </ActionIcon>
              <ActionTitle>Отклонения от нормы</ActionTitle>
              <ActionDescription>
                {stats.outOfRangeResults} показателей выходят за референсные значения
              </ActionDescription>
            </ActionCard>
          </Link>
        ) : null}

        <Link to="/results">
          <ActionCard>
            <ActionIcon>
              <Activity />
            </ActionIcon>
            <ActionTitle>Просмотреть результаты</ActionTitle>
            <ActionDescription>
              Анализ динамики и сравнение показателей
            </ActionDescription>
          </ActionCard>
        </Link>
      </Grid>
    </>
  );
};

export default HomePage;