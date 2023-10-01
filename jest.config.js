/* eslint-env node */
module.exports = {
  verbose: true,
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "src"],
  moduleFileExtensions: ["ts", "js"],
  modulePaths: ["src"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  transformIgnorePatterns: [],
  restoreMocks: true,
  clearMocks: true,
};
