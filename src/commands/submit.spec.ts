import nock from 'nock';

import {makeTestContext} from '../test/context';
import {mockFs} from '../test/mockfs';

import {submit} from './submit';

describe('submit()', () => {
  beforeEach(() => {
    mockFs({
      'reports/junit/jest.xml': 'XMLXMLXML',
    });
  });

  beforeEach(() => nock.disableNetConnect());
  afterEach(() => nock.enableNetConnect());

  it('submits reports to check run reporter using multistep upload', async () => {
    nock('https://api.check-run-reporter.com')
      .post('/api/v1/submissions/upload')
      .reply(201, {
        keys: [
          'ianwremmel/check-run-reporter/c6fb3d5423762aa2b3a8f63717ef6b320e5a1b5a/SOMEUUID-reports/junit/jest.xml',
        ],
        signature:
          '19c3cb9748107142317f4eb212b61d2be19a8c4b2aff9dc6117a7936b28313e5',
        urls: {
          'reports/junit/jest.xml': 'https://example.com/1',
        },
      });

    nock('https://example.com').put('/1').reply(200);

    nock('https://api.check-run-reporter.com')
      .patch('/api/v1/submissions/upload')
      .reply(202);

    await submit(
      {
        label: 'foo',
        report: ['reports/junit/**/*.xml'],
        root: '/',
        sha: '40923a72ddf9eefef938355fa96246607c706f6c',
        token: 'FAKE TOKEN',
      },
      makeTestContext()
    );
  });

  it('submits reports to check run reporter, falling back to single step upload', async () => {
    nock('https://api.check-run-reporter.com')
      .post('/api/v1/submissions/upload')
      .reply(404);

    nock('https://api.check-run-reporter.com')
      .post('/api/v1/submissions')
      .reply(201);

    await submit(
      {
        label: 'foo',
        report: ['reports/junit/**/*.xml'],
        root: '/',
        sha: '40923a72ddf9eefef938355fa96246607c706f6c',
        token: 'FAKE TOKEN',
      },
      makeTestContext()
    );
  });
});
