/** @type {import('jest').Config} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@pkg/shared/(.*)$": "<rootDir>/packages/shared/src/$1",
    "^@pkg/db$": "<rootDir>/packages/db/src/index.ts",
    "^@pkg/db/(.*)$": "<rootDir>/packages/db/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
          moduleResolution: "bundler",
        },
      },
    ],
  },
  testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
  collectCoverageFrom: ["packages/**/src/**/*.ts", "apps/**/src/**/*.ts"],
  coverageDirectory: "coverage",
};
