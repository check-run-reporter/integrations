'use strict';

const CI = !!process.env.CI;

module.exports = {
  clearMocks: true,
  collectCoverage: CI,
  coverageDirectory: 'reports/coverage',
  coverageProvider: 'v8',
  reporters: [
    'default',
    CI && [
      'jest-junit',
      {
        ancestorSeparator: ' › ',
        classNameTemplate: '{classname}',
        includeConsoleOutput: true,
        outputDirectory: 'reports/junit',
        outputName: `jest.xml`,
        suiteName: 'Unit Tests',
        titleTemplate: '{title}',
      },
    ],
  ].filter(Boolean),
  testMatch: [`**/${CI ? 'dist' : 'src'}/**/?(*.)+(spec|test).[tj]s?(x)`],
  testPathIgnorePatterns: ['/node_modules/'],
};
