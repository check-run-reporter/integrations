module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ["@semantic-release/exec", {
      "prepareCmd": "VERSION=${nextRelease.version} npm run build",
    }],
    '@semantic-release/npm',
    [
      '@semantic-release/github',
      {
        assets: ['dist/pkg/*'],
      },
    ],
  ],
};
