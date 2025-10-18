const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Proporciona la ruta al directorio de tu aplicación Next.js para cargar next.config.js y archivos .env
  dir: './',
})

// Configuración personalizada de Jest
const config = {
  // Entorno de testing
  testEnvironment: 'jsdom',
  
  // Archivos de configuración que se ejecutan antes de cada test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Patrones para encontrar archivos de test
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/CRM_Casona_Maria/'
  ],
  
  // Extensiones de archivo que Jest debe procesar
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Configuración para resolver módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1'
  },
  
  // Configuración de coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/lib/prisma.ts', // Excluir configuración de BD
    '!src/middleware.ts', // Excluir middleware
  ],
  
  // Umbral de coverage
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Reporteros de coverage
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Directorio de salida para coverage
  coverageDirectory: 'coverage',
  
  // Transformar archivos CSS y otros assets
  moduleNameMapping: {
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
  },
  
  // Variables de entorno para testing
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  
  // Mock de módulos externos problemáticos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': require.resolve('uuid'),
  },
  
  // Configuración de timeout para tests
  testTimeout: 10000,
  
  // Configuración para tests paralelos
  maxWorkers: '50%',
  
  // Configuración de transformers
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  
  // Mock de next/router para testing
  setupFiles: ['<rootDir>/jest.polyfills.js'],
}

// Crear configuración final con Next.js
module.exports = createJestConfig(config)