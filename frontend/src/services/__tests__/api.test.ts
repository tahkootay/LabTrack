export {}; // Make this file a module

describe('API Services', () => {
  // Простой тест для проверки того, что API модули загружаются без ошибок
  it('should load API modules without errors', () => {
    // Мокаем axios перед импортом
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      })),
    }));

    // Импортируем API после мокирования
    const { documentsApi, resultsApi, analytesApi } = require('../api');
    
    expect(documentsApi).toBeDefined();
    expect(resultsApi).toBeDefined();
    expect(analytesApi).toBeDefined();
    
    expect(documentsApi.getAll).toBeInstanceOf(Function);
    expect(resultsApi.getAll).toBeInstanceOf(Function);
    expect(analytesApi.getAll).toBeInstanceOf(Function);
  });
});