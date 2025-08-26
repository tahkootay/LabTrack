import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Upload, FileText, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { documentsApi } from '../services/api';
import { Document } from '../types/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const UploadArea = styled.div<{ $isDragActive: boolean }>`
  border: 2px dashed ${({ theme, $isDragActive }) => 
    $isDragActive ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing['2xl']};
  text-align: center;
  background: ${({ theme, $isDragActive }) => 
    $isDragActive ? `${theme.colors.primary}10` : theme.colors.surface};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}05`};
  }
`;

const UploadIcon = styled.div`
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

const UploadTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const UploadDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const UploadHint = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const DocumentsList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

const DocumentCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const DocumentIcon = styled.div`
  width: 48px;
  height: 48px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
`;

const DocumentInfo = styled.div`
  flex: 1;
`;

const DocumentName = styled.h4`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const DocumentMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const StatusBadge = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  background: ${({ theme, $status }) => theme.colors.status[$status as keyof typeof theme.colors.status]}15;
  color: ${({ theme, $status }) => theme.colors.status[$status as keyof typeof theme.colors.status]};
`;

const ActionButton = styled.button`
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
  
  &:disabled {
    background: ${({ theme }) => theme.colors.secondary};
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
    case 'processing':
      return <Clock size={14} />;
    case 'completed':
      return <CheckCircle size={14} />;
    case 'failed':
      return <XCircle size={14} />;
    default:
      return null;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Ожидает';
    case 'processing':
      return 'Обрабатывается';
    case 'completed':
      return 'Завершено';
    case 'failed':
      return 'Ошибка';
    default:
      return status;
  }
};

const DocumentsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getAll(),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => documentsApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: (id: number) => documentsApi.reprocess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadMutation.mutate({ file });
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
  });

  if (isLoading) {
    return <LoadingText>Загрузка документов...</LoadingText>;
  }

  return (
    <Container>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <UploadArea $isDragActive={isDragActive}>
          <UploadIcon>
            <Upload />
          </UploadIcon>
          <UploadTitle>
            {isDragActive ? 'Отпустите файлы здесь' : 'Загрузить анализы'}
          </UploadTitle>
          <UploadDescription>
            Перетащите файлы сюда или нажмите для выбора
          </UploadDescription>
          <UploadHint>
            Поддерживаются PDF, изображения, CSV и Excel файлы
          </UploadHint>
        </UploadArea>
      </div>

      {uploadMutation.isPending && (
        <LoadingText>Загрузка файла...</LoadingText>
      )}

      <DocumentsList>
        {documents?.map((document: Document) => (
          <DocumentCard key={document.id}>
            <DocumentIcon>
              <FileText />
            </DocumentIcon>
            
            <DocumentInfo>
              <DocumentName>{document.filename}</DocumentName>
              <DocumentMeta>
                <span>
                  {format(new Date(document.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </span>
                {document.lab_name && <span>• {document.lab_name}</span>}
                {document.file_size && (
                  <span>• {Math.round(document.file_size / 1024)} КБ</span>
                )}
                {(document.results?.length || 0) > 0 && (
                  <span>• {document.results?.length || 0} показателей</span>
                )}
              </DocumentMeta>
            </DocumentInfo>
            
            <StatusBadge $status={document.status}>
              {getStatusIcon(document.status)}
              {getStatusText(document.status)}
            </StatusBadge>
            
            {document.status === 'failed' && (
              <ActionButton
                onClick={() => reprocessMutation.mutate(document.id)}
                disabled={reprocessMutation.isPending}
              >
                <RefreshCw size={14} />
                Повторить
              </ActionButton>
            )}
          </DocumentCard>
        ))}
        
        {documents?.length === 0 && (
          <LoadingText>
            Пока нет загруженных документов. Загрузите первый анализ!
          </LoadingText>
        )}
      </DocumentsList>
    </Container>
  );
};

export default DocumentsPage;