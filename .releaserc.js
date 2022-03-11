module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    [
      '@semantic-release/github',
      {
        assets: ['dist/pkg/*'],
      },
    ],
    // Reminder: this needs to come after npm so that npm's `prepare` can update
    // package.json with the new version.
    ["@semantic-release/exec", {
      "prepareCmd": "VERSION=${nextRelease.version} npm run build",
      "publishCmd": "./scripts/publish-integrations"
    }],
  ],
};
