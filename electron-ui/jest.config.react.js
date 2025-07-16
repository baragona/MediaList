/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src/react'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: './tsconfig.test.json'
    }]
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/react/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/react/setupTests.ts'],
  collectCoverageFrom: [
    'src/react/**/*.{ts,tsx}',
    '!src/react/**/*.d.ts',
    '!src/react/index.tsx',
    '!src/react/test.html'
  ],
  coverageDirectory: 'coverage/react',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/dist-react/']
};