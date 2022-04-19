import util from 'util';

import axios from 'axios';

import {Context, Optional} from '../lib/types';
// eslint-disable-next-line import/no-deprecated
import {multiStepUpload, singleStepUpload} from '../lib/upload';
import {getRequestId} from '../lib/axios';

interface SubmitArgs {
  readonly label: Optional<string>;
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
    await tryMultiStepUploadOrFallbackToSingle(input, context);
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
/**
 * Attempts to use multistep upload, but falls back to the legacy system if it
 * gets a 404. This _should_ make things future proof so it'll get more
 * efficient once the new version is released.
 */
async function tryMultiStepUploadOrFallbackToSingle(
  input: SubmitArgs,
  context: Context
) {
  try {
    return await multiStepUpload(input, context);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // CI doesn't like safe-access here.
      if (
        (err.response && err.response.status === 404) ||
        err.code === 'ECONNABORTED'
      ) {
        context.logger.info(
          'Received 404 trying to get signed URLs. Assuming feature is notn released yet and falling back to single step upload',
          {err}
        );
        // eslint-disable-next-line import/no-deprecated
        return await singleStepUpload(input, context);
      }
    }

    throw err;
  }
}
