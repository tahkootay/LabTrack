import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, FileText, Trash2, AlertCircle, CheckCircle, Clock, Upload } from 'lucide-react';
import { documentsApi } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
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

const UploadButton = styled.button`
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
`;

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
  vertical-align: middle;
`;

const FileName = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.colors.primary}15;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.primary};
`;

const StatusBadge = styled.div<{ $status: 'pending' | 'processing' | 'completed' | 'failed' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  
  background: ${({ $status, theme }) => {
    switch ($status) {
      case 'completed':
        return theme.colors.success + '20';
      case 'failed':
        return theme.colors.error + '20';
      case 'processing':
        return theme.colors.warning + '20';
      default:
        return theme.colors.text.muted + '20';
    }
  }};
  
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'completed':
        return theme.colors.success;
      case 'failed':
        return theme.colors.error;
      case 'processing':
        return theme.colors.warning;
      default:
        return theme.colors.text.muted;
    }
  }};
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.error}50;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.error}10;
    border-color: ${({ theme }) => theme.colors.error};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// Модальное окно подтверждения
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 400px;
  width: 90%;
  margin: ${({ theme }) => theme.spacing.md};
`;

const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const ModalText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const ConfirmButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.error};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: white;
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.error}dd;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UploadsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; documentId: number | null; fileName: string }>({
    isOpen: false,
    documentId: null,
    fileName: '',
  });

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getAll({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: number) => documentsApi.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['results-summary'] });
      setDeleteModal({ isOpen: false, documentId: null, fileName: '' });
    },
  });

  const handleDeleteClick = (documentId: number, fileName: string) => {
    setDeleteModal({ isOpen: true, documentId, fileName });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.documentId) {
      deleteMutation.mutate(deleteModal.documentId);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, documentId: null, fileName: '' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} />;
      case 'failed':
        return <AlertCircle size={14} />;
      case 'processing':
        return <Clock size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершено';
      case 'failed':
        return 'Ошибка';
      case 'processing':
        return 'Обрабатывается';
      default:
        return 'Ожидает';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '—';
    
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    let i = 0;
    let size = bytes;
    
    while (size >= 1024 && i < sizes.length - 1) {
      size /= 1024;
      i++;
    }
    
    return `${size.toFixed(1)} ${sizes[i]}`;
  };

  // Подсчет результатов для каждого документа
  const getResultsCount = (document: any) => {
    // TODO: Нужно добавить это в API или получать отдельно
    return document.results?.length || 0;
  };

  if (error) {
    return (
      <Container>
        <ErrorMessage 
          message="Не удалось загрузить список загрузок" 
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            Назад
          </BackButton>
          <Title>Мои загрузки</Title>
        </HeaderLeft>
        <UploadButton onClick={() => navigate('/documents')}>
          <Upload size={16} />
          Загрузить файлы
        </UploadButton>
      </Header>

      <TableContainer>
        {isLoading ? (
          <LoadingState>Загрузка списка файлов...</LoadingState>
        ) : documents.length === 0 ? (
          <EmptyState>
            Файлы не загружены.
            <br />
            <UploadButton 
              onClick={() => navigate('/documents')}
              style={{ marginTop: '1rem', display: 'inline-flex' }}
            >
              <Upload size={16} />
              Загрузить первый файл
            </UploadButton>
          </EmptyState>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Имя файла</Th>
                <Th>Размер</Th>
                <Th>Дата загрузки</Th>
                <Th>Статус</Th>
                <Th>Лаборатория</Th>
                <Th>Показателей</Th>
                <Th>Действия</Th>
              </tr>
            </Thead>
            <Tbody>
              {documents.map((document) => (
                <Tr key={document.id}>
                  <Td>
                    <FileName>
                      <FileIcon>
                        <FileText size={16} />
                      </FileIcon>
                      <div>
                        <div>{document.filename}</div>
                        {document.error_message && (
                          <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                            {document.error_message}
                          </div>
                        )}
                      </div>
                    </FileName>
                  </Td>
                  <Td>{formatFileSize(document.file_size)}</Td>
                  <Td>{formatDate(document.created_at)}</Td>
                  <Td>
                    <StatusBadge $status={document.status as any}>
                      {getStatusIcon(document.status)}
                      {getStatusText(document.status)}
                    </StatusBadge>
                  </Td>
                  <Td>{document.lab_name || '—'}</Td>
                  <Td>{getResultsCount(document)}</Td>
                  <Td>
                    <DeleteButton
                      onClick={() => handleDeleteClick(document.id, document.filename)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={14} />
                      Удалить
                    </DeleteButton>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </TableContainer>

      {/* Модальное окно подтверждения удаления */}
      {deleteModal.isOpen && (
        <Modal>
          <ModalContent>
            <ModalTitle>Подтвердите удаление</ModalTitle>
            <ModalText>
              Вы уверены, что хотите удалить файл "{deleteModal.fileName}" и все связанные с ним результаты анализов? 
              Это действие нельзя будет отменить.
            </ModalText>
            <ModalButtons>
              <CancelButton onClick={handleDeleteCancel}>
                Отмена
              </CancelButton>
              <ConfirmButton
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
              </ConfirmButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default UploadsPage;