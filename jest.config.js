import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ["**/**/*.test.ts"],
  verbose: true,
  restoreMocks: true,
  setupFiles: ["<rootDir>/src/__test__/setup.ts"],
};