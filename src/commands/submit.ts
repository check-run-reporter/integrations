import fs from 'fs';
import util from 'util';

import FormData from 'form-data';
import axios from 'axios';

import {multiGlob} from '../lib/file';
import {Context} from '../lib/types';
import {client} from '../lib/axios';

type Optional<T> = T | undefined;

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
export async function submit(
  {label, report, root, sha, token, url}: SubmitArgs,
  context: Context
) {
  const {logger} = context;

  const files = await multiGlob(report, context);

  const formData = new FormData();
  for (const file of files) {
    formData.append('report', fs.createReadStream(file));
  }

  if (label) {
    formData.append('label', label);
  }
  formData.append('root', root);
  formData.append('sha', sha);

  try {
    logger.group('Uploading report to Check Run Reporter');
    logger.info(`Label: ${label}`);
    logger.info(`Root: ${root}`);
    logger.info(`SHA: ${sha}`);
    logger.debug(`URL: ${url}`);

    const response = await client.post(url, formData, {
      auth: {password: token, username: 'token'},
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
    });

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
