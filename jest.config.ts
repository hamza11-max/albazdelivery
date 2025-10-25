import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@testing-library/(.*)$': '<rootDir>/node_modules/@testing-library/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(msw|until-async|node-fetch|uuid|nanoid|@mswjs|@open-draft|client-only|@testing-library)/)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/__tests__/__mocks__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
      useESM: true,
    },
  },
}

export default createJestConfig(config);