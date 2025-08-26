import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import ErrorMessage from '../ErrorMessage';
import { theme } from '../../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ErrorMessage', () => {
  it('renders error message correctly', () => {
    renderWithTheme(
      <ErrorMessage message="Test error message" />
    );
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders warning type correctly', () => {
    renderWithTheme(
      <ErrorMessage message="Test warning message" type="warning" />
    );
    
    expect(screen.getByText('Test warning message')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const mockOnDismiss = jest.fn();
    
    renderWithTheme(
      <ErrorMessage 
        message="Test error message" 
        onDismiss={mockOnDismiss}
      />
    );
    
    const dismissButton = screen.getByRole('button');
    fireEvent.click(dismissButton);
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    renderWithTheme(
      <ErrorMessage message="Test error message" />
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});