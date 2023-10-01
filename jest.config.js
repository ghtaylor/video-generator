/* eslint-env node */

const moduleNameMapper = {
  "^@domain/(.*)$": "<rootDir>/src/domain/$1",
  "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
  "^@core/(.*)$": "<rootDir>/src/core/$1",
  "^@common/(.*)$": "<rootDir>/src/common/$1",
};

module.exports = {
  verbose: true,
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "src"],
  moduleFileExtensions: ["ts", "js"],
  modulePaths: ["src"],
  moduleNameMapper,
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  transformIgnorePatterns: [],
  restoreMocks: true,
  clearMocks: true,
};
