import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning';
}

const ErrorContainer = styled.div<{ $type: 'error' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, $type }) => 
    $type === 'error' ? theme.colors.error + '15' : theme.colors.warning + '15'};
  border: 1px solid ${({ theme, $type }) => 
    $type === 'error' ? theme.colors.error + '30' : theme.colors.warning + '30'};
`;

const ErrorIcon = styled.div<{ $type: 'error' | 'warning' }>`
  color: ${({ theme, $type }) => 
    $type === 'error' ? theme.colors.error : theme.colors.warning};
  flex-shrink: 0;
`;

const ErrorText = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const DismissButton = styled.button<{ $type: 'error' | 'warning' }>`
  color: ${({ theme, $type }) => 
    $type === 'error' ? theme.colors.error : theme.colors.warning};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${({ theme, $type }) => 
      $type === 'error' ? theme.colors.error + '20' : theme.colors.warning + '20'};
  }
`;

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onDismiss, 
  type = 'error' 
}) => {
  return (
    <ErrorContainer $type={type}>
      <ErrorIcon $type={type}>
        <AlertTriangle size={20} />
      </ErrorIcon>
      <ErrorText>{message}</ErrorText>
      {onDismiss && (
        <DismissButton $type={type} onClick={onDismiss}>
          <X size={16} />
        </DismissButton>
      )}
    </ErrorContainer>
  );
};

export default ErrorMessage;