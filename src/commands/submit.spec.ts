import mockFs from 'mock-fs';
import nock from 'nock';

import {logger} from '../lib/logger';

import {submit} from './submit';

describe('submit()', () => {
  beforeEach(() => {
    console.log('');
    mockFs({
      'reports/junit/jest.xml': 'XMLXMLXML',
    });
  });

  beforeEach(() => nock.disableNetConnect());
  afterEach(() => nock.enableNetConnect());

  afterEach(() => mockFs.restore());

  it('submits reports to check run reporter', async () => {
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
        url: 'https://api.check-run-reporter.com/api/v1/submissions',
      },
      {logger}
    );
  });
});
