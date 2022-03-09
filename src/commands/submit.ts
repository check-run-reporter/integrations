import util from 'util';

import axios from 'axios';

import {Context, Optional} from '../lib/types';
// eslint-disable-next-line import/no-deprecated
import {singleStepUpload} from '../lib/upload';

interface SubmitArgs {
  readonly label: Optional<string>;
  readonly report: readonly string[];
  readonly root: string;
  readonly sha: string;
  readonly token: string;
  readonly url: string;
}

/**
 * Submit report files to Check Run Reporter
 */
export async function submit(input: SubmitArgs, context: Context) {
  const {logger} = context;

  try {
    const {label, report, root, sha, token, url} = input;
    logger.group('Uploading report to Check Run Reporter');
    logger.info(`Label: ${label}`);
    logger.info(`Root: ${root}`);
    logger.info(`SHA: ${sha}`);
    logger.debug(`URL: ${url}`);

    // eslint-disable-next-line import/no-deprecated
    const response = await singleStepUpload(input, context);

    logger.info(`Request ID: ${response.headers['x-request-id']}`);
    logger.info(`Status: ${response.status}`);
    logger.info(`StatusText: ${response.statusText}`);
    logger.info(JSON.stringify(response.data, null, 2));
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
