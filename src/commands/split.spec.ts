import nock from 'nock';

import {client} from '../lib/axios';
import {mockFs} from '../test/mockfs';

import {split} from './split';

describe('split()', () => {
  beforeEach(() => {
    mockFs({
      'src/a.spec.ts': 'contents',
      'src/app.spec.ts': 'contents',
      'src/b.spec.ts': 'contents',
      'src/index.spec.ts': 'contents',
      'src/lib.spec.ts': 'contents',
      'src/logger.spec.ts': 'contents',
      'src/storyshots.spec.ts': 'contests',
      'src/user.spec.ts': 'contents',
    });
  });

  beforeEach(() => nock.disableNetConnect());
  afterEach(() => nock.enableNetConnect());

  it('splits a group of tests', async () => {
    nock('https://api.check-run-reporter.com')
      .post('/api/v1/split')
      .reply(201, {
        filenames: ['logger.spec.ts', 'user.spec.ts'],
        inputFilenames: [
          'src/a.spec.ts',
          'src/app.spec.ts',
          'src/b.spec.ts',
          'src/index.spec.ts',
          'src/lib.spec.ts',
          'src/logger.spec.ts',
          'src/storyshots.spec.ts',
          'src/user.spec.ts',
        ],
        nodeCount: 3,
        nodeIndex: 2,
      });

    const result = await split(
      {
        hostname: 'api.check-run-reporter.com',
        label: 'foo',
        nodeCount: 3,
        nodeIndex: 2,
        tests: ['src/**/*.spec.ts', '!src/storyshots.spec.ts'],
        token: 'FAKE TOKEN',
        url: 'https://api.check-run-reporter.com/api/v1/split',
      },
      {client, logger: console}
    );

    expect(result).toMatchObject({
      filenames: ['logger.spec.ts', 'user.spec.ts'],
      inputFilenames: [
        'src/a.spec.ts',
        'src/app.spec.ts',
        'src/b.spec.ts',
        'src/index.spec.ts',
        'src/lib.spec.ts',
        'src/logger.spec.ts',
        'src/storyshots.spec.ts',
        'src/user.spec.ts',
      ],
      nodeCount: 3,
      nodeIndex: 2,
    });
  });
});
