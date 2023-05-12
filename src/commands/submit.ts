import util from 'util';

import axios from 'axios';

import {Context, Optional} from '../lib/types';
import {multiStepUpload} from '../lib/upload';
import {getRequestId} from '../lib/axios';

interface SubmitArgs {
  readonly label: Optional<string>;
  readonly nodeCount: number;
  readonly nodeIndex: number;
  readonly report: readonly string[];
  readonly root: string;
  readonly sha: string;
  readonly token: string;
}

/**
 * Submit report files to Check Run Reporter
 */
export async function submit(input: SubmitArgs, context: Context) {
  const {logger} = context;

  try {
    logger.group('Uploading report to Check Run Reporter');
    await multiStepUpload(input, context);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        // we didn't get a response, so rethrow before logging things that don't
        // exist.
        logger.error('Failed to make upload request');
        throw err;
      }

      logger.error(`Request ID: ${getRequestId(err.response)}`);
      logger.error(
        `Response Headers: ${util.inspect(err.response.headers, {depth: 2})}`
      );
      logger.error(
        `Response Body: ${util.inspect(err.response.data, {depth: 2})}`
      );
      logger.error(`Request URL: ${err.response.config.url}`);
    }

    throw err;
  } finally {
    logger.groupEnd();
  }
}
