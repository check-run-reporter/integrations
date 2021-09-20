'use strict';

const IS_DBOT = (
  process.env.GITHUB_REF ||
  process.env.BUILDKITE_BRANCH ||
  ''
).includes('dependabot');

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [2, 'always', IS_DBOT ? Infinity : 100],
    'footer-max-line-length': [2, 'always', IS_DBOT ? Infinity : 100],
    'header-max-length': [2, 'always', IS_DBOT ? Infinity : 100],
  },
};