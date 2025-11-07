module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Handle CSS imports (with CSS modules)
    // https://jestjs.io/docs/webpack#mocking-css-modules
    '^\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Handle image imports
    // https://jestjs.io/docs/webpack#handling-static-assets
    '^\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/cypress/',
    // Ignore empty test files
    '<rootDir>/lib/types/test.ts',
    '<rootDir>/__tests__/setupTests.ts',
    '<rootDir>/__tests__/jest-matchers.d.ts',
    '<rootDir>/__tests__/test-utils.tsx',
    // Ignore MSW test files for now
    '<rootDir>/__tests__/mocks/'
  ],
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(next|@babel/runtime)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  // Add support for TypeScript
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
  // Setup files
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Test timeout
  testTimeout: 10000,
  // Only run tests in __tests__ directory
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  // Don't run tests in node_modules by default
  testPathIgnorePatterns: ['/node_modules/'],
};