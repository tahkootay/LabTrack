import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Plus, Edit2, Save, X } from 'lucide-react';
import { analytesApi } from '../services/api';
import { Analyte } from '../types/api';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h2`
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const AnalytesGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

const AnalyteCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: start;
`;

const AnalyteField = styled.div`
  display: flex;
  flex-direction: column;
`;

const FieldLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const FieldValue = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FieldInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSize.sm};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const IconButton = styled.button<{ $variant?: 'primary' | 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: background-color 0.2s ease;
  
  ${({ theme, $variant = 'primary' }) => {
    switch ($variant) {
      case 'success':
        return `
          background: ${theme.colors.success}15;
          color: ${theme.colors.success};
          &:hover { background: ${theme.colors.success}25; }
        `;
      case 'danger':
        return `
          background: ${theme.colors.error}15;
          color: ${theme.colors.error};
          &:hover { background: ${theme.colors.error}25; }
        `;
      default:
        return `
          background: ${theme.colors.primary}15;
          color: ${theme.colors.primary};
          &:hover { background: ${theme.colors.primary}25; }
        `;
    }
  }}
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

const AnalytesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<Analyte>>({});
  
  const queryClient = useQueryClient();
  
  const { data: analytes, isLoading } = useQuery({
    queryKey: ['analytes'],
    queryFn: () => analytesApi.getAll(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Analyte> }) =>
      analytesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytes'] });
      setEditingId(null);
      setEditingData({});
    },
  });

  const filteredAnalytes = React.useMemo(() => {
    if (!analytes) return [];
    
    return analytes.filter((analyte: Analyte) => 
      analyte.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analyte.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [analytes, searchTerm]);

  const handleEdit = (analyte: Analyte) => {
    setEditingId(analyte.id);
    setEditingData(analyte);
  };

  const handleSave = () => {
    if (editingId && editingData) {
      updateMutation.mutate({ id: editingId, data: editingData });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleInputChange = (field: keyof Analyte, value: string) => {
    setEditingData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <LoadingText>Загрузка показателей...</LoadingText>;
  }

  return (
    <Container>
      <Header>
        <Title>Справочник показателей</Title>
        <AddButton>
          <Plus size={16} />
          Добавить показатель
        </AddButton>
      </Header>

      <SearchInput
        type="text"
        placeholder="Поиск по названию или коду показателя..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <AnalytesGrid>
        {filteredAnalytes.length === 0 ? (
          <EmptyState>
            {searchTerm ? 'Показатели не найдены' : 'Нет показателей в справочнике'}
          </EmptyState>
        ) : (
          filteredAnalytes.map((analyte: Analyte) => (
            <AnalyteCard key={analyte.id}>
              <AnalyteField>
                <FieldLabel>Название</FieldLabel>
                {editingId === analyte.id ? (
                  <FieldInput
                    value={editingData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                ) : (
                  <FieldValue>{analyte.name}</FieldValue>
                )}
              </AnalyteField>
              
              <AnalyteField>
                <FieldLabel>Код</FieldLabel>
                {editingId === analyte.id ? (
                  <FieldInput
                    value={editingData.code || ''}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                  />
                ) : (
                  <FieldValue>{analyte.code}</FieldValue>
                )}
              </AnalyteField>
              
              <AnalyteField>
                <FieldLabel>Единица по умолчанию</FieldLabel>
                {editingId === analyte.id ? (
                  <FieldInput
                    value={editingData.default_unit || ''}
                    onChange={(e) => handleInputChange('default_unit', e.target.value)}
                  />
                ) : (
                  <FieldValue>{analyte.default_unit || '-'}</FieldValue>
                )}
              </AnalyteField>

              <ActionsContainer>
                {editingId === analyte.id ? (
                  <>
                    <IconButton
                      $variant="success"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                    >
                      <Save size={16} />
                    </IconButton>
                    <IconButton $variant="danger" onClick={handleCancel}>
                      <X size={16} />
                    </IconButton>
                  </>
                ) : (
                  <IconButton onClick={() => handleEdit(analyte)}>
                    <Edit2 size={16} />
                  </IconButton>
                )}
              </ActionsContainer>
            </AnalyteCard>
          ))
        )}
      </AnalytesGrid>
    </Container>
  );
};

export default AnalytesPage;