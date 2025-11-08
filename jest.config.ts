import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(next|@babel/runtime|msw|@mswjs|@bundled-es-modules|until-async)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  testTimeout: 10000,
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/cypress/',
    '/tests-e2e/',
    '/lib/types/test.ts',
    '/__tests__/setupTests.ts',
    '/__tests__/jest-matchers.d.ts',
    '/__tests__/test-utils.tsx',
    '/__tests__/mocks/'
  ]
};

export default config;