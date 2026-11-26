// jest.config.js
/**
 * Jest configuration for the Control Crítico Plant project.
 * Uses ts-jest to compile TypeScript test files.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  // Adjust this if you use path aliases in tsconfig.json
  // moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};