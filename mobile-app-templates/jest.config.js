module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@stores/(.*)$': '<rootDir>/stores/$1',
    '^@types/(.*)$': '<rootDir>/types/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community)/)'
  ],
  globals: {
    __DEV__: true
  }
};