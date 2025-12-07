import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/js-with-ts',
  // Use projects to support different test environments
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/api/**/*.test.[jt]s?(x)', '**/__tests__/lib/security/**/*.test.[jt]s?(x)'],
      setupFiles: ['<rootDir>/jest.polyfills.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.api.ts'],
      moduleNameMapper: {
        '^@/root/(.*)$': '<rootDir>/$1',
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['next/babel'] }],
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(next|@babel/runtime|msw|@mswjs|@bundled-es-modules|until-async)/)',
      ],
    },
    {
      displayName: 'ui',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/**/*.test.[jt]sx', '**/__tests__/**/*.test.[jt]s', '!**/__tests__/api/**', '!**/__tests__/lib/security/**'],
      setupFiles: ['<rootDir>/jest.polyfills.js'],
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
    },
  ],
  testTimeout: 10000,
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