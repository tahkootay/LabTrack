import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import MainResultsPage from './pages/MainResultsPage';
import DocumentsPage from './pages/DocumentsPage';
import ResultsPage from './pages/ResultsPage';
import AnalytesPage from './pages/AnalytesPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import AnalyteDetailPage from './pages/AnalyteDetailPage';
import UploadsPage from './pages/UploadsPage';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Не повторять запросы для клиентских ошибок (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Повторить максимум 2 раза для серверных ошибок
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Не повторять мутации для клиентских ошибок
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <Router>
          <Layout>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<MainResultsPage />} />
                <Route path="/dashboard" element={<HomePage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/:id" element={<DocumentDetailPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/analytes" element={<AnalytesPage />} />
                <Route path="/analyte/:analyteId" element={<AnalyteDetailPage />} />
                <Route path="/uploads" element={<UploadsPage />} />
              </Routes>
            </ErrorBoundary>
          </Layout>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;