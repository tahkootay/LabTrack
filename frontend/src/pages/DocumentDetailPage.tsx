import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { documentsApi } from '../services/api';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const LoadingText = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id || '0', 10);

  const { data: document, isLoading } = useQuery({
    queryKey: ['documents', documentId],
    queryFn: () => documentsApi.getById(documentId),
    enabled: !!documentId,
  });

  if (isLoading) {
    return <LoadingText>Загрузка документа...</LoadingText>;
  }

  if (!document) {
    return <LoadingText>Документ не найден</LoadingText>;
  }

  return (
    <Container>
      <h2>Детали документа: {document.filename}</h2>
      <p>Статус: {document.status}</p>
      <p>Результатов: {document.results?.length || 0}</p>
      {document.lab_name && <p>Лаборатория: {document.lab_name}</p>}
    </Container>
  );
};

export default DocumentDetailPage;