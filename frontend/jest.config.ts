import type { Config } from 'jest';

const config: Config = {
    // Use jsdom for React component rendering
    testEnvironment: 'jest-environment-jsdom',

    // Run setup file after jest is initialized
    setupFilesAfterSetup: ['<rootDir>/src/setupTests.ts'],

    // Transform TypeScript/TSX files with ts-jest
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
                // Use ESM-compatible output
                useESM: false,
            },
        ],
    },

    // Map @/ alias to src/ (mirrors tsconfig paths)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Mock CSS/SCSS imports
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Mock static assets
        '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/src/__mocks__/fileMock.ts',
    },

    // File extensions to process
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Test file patterns
    testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts',
    ],
    coverageDirectory: 'coverage',
};

export default config;
