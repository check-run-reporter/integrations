import util from 'util';

import axios from 'axios';
import axiosRetry from 'axios-retry';

import {multiGlob} from '../lib/file';
import {Context} from '../lib/types';

axiosRetry(axios, {retries: 3});

interface SplitArgs {
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
  {tests, label, nodeCount, nodeIndex, token, url}: SplitArgs,
  context: Context
) {
  const {logger} = context;

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

    const response = await axios.post(url, params, {
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

      logger.error(`Request ID: ${err.response.headers['x-request-id']}`);
      logger.error(util.inspect(err.response.data, {depth: 2}));
    }

    throw err;
  } finally {
    logger.groupEnd();
  }
}
