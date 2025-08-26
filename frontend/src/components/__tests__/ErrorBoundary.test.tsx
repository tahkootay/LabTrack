import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import ErrorBoundary from '../ErrorBoundary';
import { theme } from '../../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Компонент, который будет бросать ошибку
const ErrorThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Подавляем console.error для тестов
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error message when child throws error', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
    expect(screen.getByText(/Что-то пошло не так/)).toBeInTheDocument();
  });

  it('shows retry button', () => {
    renderWithTheme(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const retryButton = screen.getByText('Попробовать снова');
    expect(retryButton).toBeInTheDocument();
    
    // Проверяем, что кнопка кликабельна
    fireEvent.click(retryButton);
    
    // После клика на retry ErrorBoundary сбросит состояние ошибки
    // но поскольку дочерний компонент все еще бросает ошибку,
    // снова покажется ошибка
    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
  });
});