import util from 'util';

import axios from 'axios';

import {getRequestId} from '../lib/axios';
import {multiGlob} from '../lib/file';
import {Context} from '../lib/types';

interface SplitArgs {
  readonly hostname: string;
  /** list of filenames or globs that match all available test files */
  readonly tests: readonly string[];
  readonly label: string;
  readonly nodeCount: number;
  readonly nodeIndex: number;
  readonly token: string;
  readonly url: string;
}

/**
 * Send the full list of available test files and get back the filees
 * appropriate to this node.
 */
export async function split(
  {hostname, tests, label, nodeCount, nodeIndex, token, url}: SplitArgs,
  context: Context
) {
  const u = new URL(url);
  if (hostname !== u.hostname) {
    u.hostname = hostname;
    context.logger.info('Overriding hostname', {
      newUrl: u.href,
      originalUrl: url,
    });
    url = u.href;
  }

  // This is just here to test the buildkite plugin. The only other option I can
  // think of is to run a server locally that responds with this and use the
  // `url` param, but that currently seems like more trouble than its worth for
  // what I'm trying to test, which is the behavior after the CLI completes and
  // plugin needs to use its result.
  if (process.env.BATS_FAKE_SPLIT_RESPONSE) {
    return {
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
    };
  }

  const {client, logger} = context;

  const filenames = await multiGlob(tests, context);

  const params = new URLSearchParams({
    label,
    nodeCount: String(nodeCount),
    nodeIndex: String(nodeIndex),
  });

  for (const filename of filenames) {
    params.append('filenames', filename);
  }

  try {
    logger.group(
      `Sending ${filenames.length} test names to Check Run Reporter`
    );
    logger.info(`Label: ${label}`);
    logger.info(`Tests: ${filenames}`);
    logger.debug(`URL: ${url}`);

    const response = await client.post(url, params, {
      auth: {password: token, username: 'token'},
    });

    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        // we didn't get a response, so rethrow before logging things that don't
        // exist.
        logger.error('Failed to make upload request');
        throw err;
      }

      logger.error(`Request ID: ${getRequestId(err.response)}`);
      logger.error(util.inspect(err.response.data, {depth: 2}));
    }

    throw err;
  } finally {
    logger.groupEnd();
  }
}
