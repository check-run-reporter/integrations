import {mockFs} from '../test/mockfs';

import {client} from './axios';
import {multiGlob} from './file';

describe('multiGlob()', () => {
  beforeEach(() => {
    mockFs({
      'src/a.spec.ts': 'contents',
      'src/app.spec.ts': 'contents',
      'src/b.spec.ts': 'contents',
      'src/index.aws.spec.ts': 'contents',
      'src/index.spec.ts': 'contents',
      'src/lib.spec.ts': 'contents',
      'src/logger.spec.ts': 'contents',
      'src/storyshots.spec.ts': 'contents',
      'src/user.spec.ts': 'contents',
    });
  });

  it('supports exclusions', () => {
    const result = multiGlob(['**/*.ts', '!storyshots*'], {
      client,
      logger: console,
    });

    expect(result).not.toContain(/storyshots/);

    expect(result).toMatchObject([
      'src/a.spec.ts',
      'src/app.spec.ts',
      'src/b.spec.ts',
      'src/index.aws.spec.ts',
      'src/index.spec.ts',
      'src/lib.spec.ts',
      'src/logger.spec.ts',
      'src/user.spec.ts',
    ]);
  });

  it('supports multiple exclusions', () => {
    const result = multiGlob(['**/*.ts', '!*storyshots*', '!*aws*'], {
      client,
      logger: console,
    });

    expect(result).not.toContain(/storyshots/);
    expect(result).not.toContain(/aws/);

    expect(result).toMatchObject([
      'src/a.spec.ts',
      'src/app.spec.ts',
      'src/b.spec.ts',
      'src/index.spec.ts',
      'src/lib.spec.ts',
      'src/logger.spec.ts',
      'src/user.spec.ts',
    ]);
  });

  it('dedupes matches', () => {
    expect(
      multiGlob(['**/a.*.ts', '**/a.*.ts'], {
        client,
        logger: console,
      })
    ).toMatchObject(['src/a.spec.ts']);
  });

  it('treats semicolons as additional separators', () => {
    expect(
      multiGlob(['src/a*;src/b*;!src/a.s*'], {
        client,
        logger: console,
      })
    ).toMatchObject(['src/app.spec.ts', 'src/b.spec.ts']);
  });
});
